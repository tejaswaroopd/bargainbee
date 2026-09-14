"use strict";
/**
 * Listings Routes
 *
 * FEATURE 2 — Encrypted Transactions:
 *   Voucher codes are AES-256-GCM encrypted before storage and never returned in plaintext.
 *
 * FEATURE 3 — Digital Voucher Verification:
 *   All new listings are forced to PENDING status; admin must approve before going LIVE.
 *   Admin receives a notification for every new submission.
 *
 * FEATURE 4 — Fraud Detection:
 *   SHA-256 hash of the raw code is stored separately for duplicate detection.
 *   Duplicate attempts increment seller flaggedCount; >= 2 flags seller for admin review.
 *
 * FEATURE 5 — Privacy Protection:
 *   Seller PII (email) is never included in public browse or listing-detail responses.
 *   Only non-sensitive fields (masked name, repScore, isVerified) are exposed.
 *
 * FEATURE 6 — Seller Verification:
 *   requireSellerVerified middleware blocks unverified accounts from creating listings.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../middleware/auth");
const sellerVerified_1 = require("../middleware/sellerVerified");
const upload_1 = require("../middleware/upload");
const storageService_1 = require("../services/storageService");
const errorHandler_1 = require("../middleware/errorHandler");
const encryptionService_1 = require("../services/encryptionService");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// GET /api/listings — Browse marketplace (public, no PII exposed)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
    const { category, brand, minPrice, maxPrice, minDiscount, expiryBefore, sort = 'createdAt', page = '1', limit = '12', featured, search, } = req.query;
    const where = { status: 'LIVE' };
    if (category)
        where.category = category;
    if (brand)
        where.brand = { contains: brand, mode: 'insensitive' };
    if (minPrice || maxPrice) {
        where.askingPrice = {};
        if (minPrice)
            where.askingPrice.gte = parseFloat(minPrice);
        if (maxPrice)
            where.askingPrice.lte = parseFloat(maxPrice);
    }
    if (minDiscount)
        where.discountPct = { gte: parseFloat(minDiscount) };
    if (expiryBefore)
        where.expiryDate = { lte: new Date(expiryBefore) };
    if (featured === 'true')
        where.isFeatured = true;
    if (search) {
        where.OR = [
            { brand: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search.toLowerCase() } },
        ];
    }
    const orderBy = {};
    if (sort === 'price_asc')
        orderBy.askingPrice = 'asc';
    else if (sort === 'price_desc')
        orderBy.askingPrice = 'desc';
    else if (sort === 'discount')
        orderBy.discountPct = 'desc';
    else if (sort === 'expiry')
        orderBy.expiryDate = 'asc';
    else
        orderBy.createdAt = 'desc';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [listings, total] = await Promise.all([
        prisma_1.default.voucherListing.findMany({
            where,
            orderBy,
            skip,
            take,
            select: {
                id: true, brand: true, category: true, faceValue: true,
                askingPrice: true, discountPct: true, expiryDate: true,
                voucherImageUrl: true, isFeatured: true, status: true,
                viewCount: true, createdAt: true,
                // FEATURE 5: Only expose non-PII seller fields; NO email
                seller: {
                    select: {
                        id: true,
                        name: true, // visible (public profile name)
                        repScore: true,
                        avatar: true,
                        isVerified: true, // FEATURE 6: badge shown on card
                        // email intentionally excluded
                    },
                },
            },
        }),
        prisma_1.default.voucherListing.count({ where }),
    ]);
    res.json({
        listings,
        pagination: { total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) },
    });
});
// ---------------------------------------------------------------------------
// GET /api/listings/my — Seller's own listings (authenticated)
// ---------------------------------------------------------------------------
router.get('/my/listings', auth_1.authenticate, auth_1.requireSeller, async (req, res) => {
    const listings = await prisma_1.default.voucherListing.findMany({
        where: { sellerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: { orders: { select: { id: true, amount: true, escrowStatus: true } } },
    });
    // FEATURE 2 + 8: Seller sees their own listings but voucherCode is never returned
    // (it's encrypted at rest; reveal only happens through the order flow)
    const safeListing = listings.map(l => ({ ...l, voucherCode: undefined, voucherCodeHash: undefined }));
    res.json({ listings: safeListing });
});
// ---------------------------------------------------------------------------
// GET /api/listings/:id — Single listing detail (public, no PII)
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const listing = await prisma_1.default.voucherListing.findUnique({
        where: { id: req.params.id },
        include: {
            seller: {
                select: {
                    id: true, name: true, avatar: true, repScore: true,
                    totalSales: true, createdAt: true,
                    isVerified: true, // FEATURE 6: verified badge
                    // FEATURE 5: email intentionally excluded from public detail
                    receivedReviews: { select: { rating: true }, take: 100 },
                },
            },
        },
    });
    if (!listing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
    }
    prisma_1.default.voucherListing.update({
        where: { id: listing.id },
        data: { viewCount: { increment: 1 } },
    }).catch(() => { });
    // FEATURE 2 + 8: Never expose the raw or encrypted code publicly
    const { voucherCode: _, voucherCodeHash: __, ...safeListing } = listing;
    res.json({ listing: safeListing });
});
// ---------------------------------------------------------------------------
// POST /api/listings — Create listing
// ---------------------------------------------------------------------------
router.post('/', auth_1.authenticate, auth_1.requireSeller, sellerVerified_1.requireSellerVerified, // FEATURE 6: block unverified sellers
upload_1.upload.fields([{ name: 'voucherImage', maxCount: 1 }, { name: 'receipt', maxCount: 1 }]), async (req, res) => {
    const { brand, category, faceValue, askingPrice, expiryDate, description, voucherCode, tags, isPriorityVerification, } = req.body;
    if (!brand || !category || !faceValue || !askingPrice || !expiryDate) {
        throw new errorHandler_1.AppError('Brand, category, faceValue, askingPrice, and expiryDate are required', 400);
    }
    // FEATURE 4 — Fraud Detection: check SHA-256 hash for duplicate voucher code
    // We hash the code before encryption so we can compare hashes without
    // storing plaintext or decrypting every record.
    if (voucherCode) {
        const codeHash = (0, crypto_1.createHash)('sha256').update(voucherCode.trim()).digest('hex');
        const existing = await prisma_1.default.voucherListing.findFirst({
            where: {
                voucherCodeHash: codeHash,
                status: { notIn: ['SOLD', 'EXPIRED', 'REJECTED'] },
            },
        });
        if (existing) {
            // FEATURE 4: Flag the seller if they repeatedly try to list duplicate codes
            const updatedSeller = await prisma_1.default.user.update({
                where: { id: req.user.id },
                data: {
                    flaggedCount: { increment: 1 },
                    // Flag for admin review after 2 duplicate attempts
                    flaggedForReview: await prisma_1.default.user
                        .findUnique({ where: { id: req.user.id }, select: { flaggedCount: true } })
                        .then(u => (u?.flaggedCount ?? 0) + 1 >= 2),
                },
                select: { flaggedCount: true },
            });
            // FEATURE 7 — Audit log the fraud attempt
            await (0, auditService_1.logAudit)({
                userId: req.user.id,
                action: 'SELLER_FLAGGED',
                ipAddress: req.ip,
                metadata: { reason: 'Duplicate voucher code submission', flaggedCount: updatedSeller.flaggedCount },
            });
            throw new errorHandler_1.AppError('Fraud prevention alert: This voucher code is already registered in active platform listings.', 409);
        }
    }
    const files = req.files;
    let voucherImageUrl;
    let receiptUrl;
    if (files?.voucherImage?.[0]) {
        voucherImageUrl = await (0, storageService_1.uploadFile)(files.voucherImage[0].buffer, files.voucherImage[0].originalname, 'vouchers');
    }
    if (files?.receipt?.[0]) {
        receiptUrl = await (0, storageService_1.uploadFile)(files.receipt[0].buffer, files.receipt[0].originalname, 'receipts');
    }
    const face = parseFloat(faceValue);
    const asking = parseFloat(askingPrice);
    const discountPct = Math.round(((face - asking) / face) * 100);
    // FEATURE 2 — Encrypt the voucher code at rest using AES-256-GCM
    let encryptedCode;
    let codeHash;
    if (voucherCode) {
        encryptedCode = (0, encryptionService_1.encryptField)(voucherCode.trim());
        codeHash = (0, crypto_1.createHash)('sha256').update(voucherCode.trim()).digest('hex');
    }
    const listing = await prisma_1.default.voucherListing.create({
        data: {
            sellerId: req.user.id,
            brand,
            category,
            faceValue: face,
            askingPrice: asking,
            discountPct,
            expiryDate: new Date(expiryDate),
            description,
            voucherCode: encryptedCode, // FEATURE 2: encrypted
            voucherCodeHash: codeHash, // FEATURE 4: hash for duplicate detection
            voucherImageUrl,
            receiptUrl,
            // FEATURE 3: Always PENDING — admin must verify before listing goes LIVE
            // (removed the DRAFT bypass that could skip the verification workflow)
            status: 'PENDING',
            isPriorityVerification: isPriorityVerification === 'true' || isPriorityVerification === true,
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        },
    });
    // Auto-upgrade role to BOTH if previously BUYER
    if (req.user.role === 'BUYER') {
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { role: 'BOTH' },
        });
    }
    // FEATURE 3 — Notify admin team of new pending listing
    const admin = await prisma_1.default.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
        await prisma_1.default.notification.create({
            data: {
                userId: admin.id,
                type: 'LISTING_PENDING',
                title: '📋 New Listing Awaiting Verification',
                message: `${brand} voucher submitted by seller. Verify before it goes live.`,
                link: `/dashboard/admin`,
            },
        });
    }
    // FEATURE 7 — Listing creation is not an escrow event, no audit needed here
    res.status(201).json({ listing: { ...listing, voucherCode: undefined, voucherCodeHash: undefined } });
});
// ---------------------------------------------------------------------------
// PUT /api/listings/:id — Update listing (DRAFT or REJECTED only)
// ---------------------------------------------------------------------------
router.put('/:id', auth_1.authenticate, upload_1.upload.fields([{ name: 'voucherImage', maxCount: 1 }, { name: 'receipt', maxCount: 1 }]), async (req, res) => {
    const listing = await prisma_1.default.voucherListing.findUnique({ where: { id: req.params.id } });
    if (!listing)
        throw new errorHandler_1.AppError('Listing not found', 404);
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Unauthorized', 403);
    }
    if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
        throw new errorHandler_1.AppError('Only DRAFT or REJECTED listings can be edited', 400);
    }
    const { brand, category, faceValue, askingPrice, expiryDate, description, voucherCode, tags } = req.body;
    const face = faceValue ? parseFloat(faceValue) : listing.faceValue;
    const asking = askingPrice ? parseFloat(askingPrice) : listing.askingPrice;
    // FEATURE 2 — Re-encrypt updated voucher code
    // FEATURE 4 — Recompute hash for the updated code
    let encryptedCode = listing.voucherCode;
    let codeHash = listing.voucherCodeHash;
    if (voucherCode) {
        const rawCode = voucherCode.trim();
        encryptedCode = (0, encryptionService_1.encryptField)(rawCode);
        codeHash = (0, crypto_1.createHash)('sha256').update(rawCode).digest('hex');
        // FEATURE 4: Check for duplicates on code update too
        const duplicate = await prisma_1.default.voucherListing.findFirst({
            where: {
                voucherCodeHash: codeHash,
                status: { notIn: ['SOLD', 'EXPIRED', 'REJECTED'] },
                id: { not: req.params.id }, // exclude self
            },
        });
        if (duplicate) {
            throw new errorHandler_1.AppError('Fraud prevention: This voucher code is already listed on the platform.', 409);
        }
    }
    const updated = await prisma_1.default.voucherListing.update({
        where: { id: req.params.id },
        data: {
            brand: brand || listing.brand,
            category: category || listing.category,
            faceValue: face,
            askingPrice: asking,
            discountPct: Math.round(((face - asking) / face) * 100),
            expiryDate: expiryDate ? new Date(expiryDate) : listing.expiryDate,
            description: description !== undefined ? description : listing.description,
            voucherCode: encryptedCode,
            voucherCodeHash: codeHash,
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : listing.tags,
            // FEATURE 3: re-submit puts back into PENDING verification queue
            status: 'PENDING',
        },
    });
    res.json({ listing: { ...updated, voucherCode: undefined, voucherCodeHash: undefined } });
});
// ---------------------------------------------------------------------------
// DELETE /api/listings/:id
// ---------------------------------------------------------------------------
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    const listing = await prisma_1.default.voucherListing.findUnique({ where: { id: req.params.id } });
    if (!listing)
        throw new errorHandler_1.AppError('Listing not found', 404);
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Unauthorized', 403);
    }
    if (listing.status === 'SOLD')
        throw new errorHandler_1.AppError('Cannot delete a sold listing', 400);
    await prisma_1.default.voucherListing.update({
        where: { id: req.params.id },
        data: { status: 'EXPIRED' },
    });
    res.json({ message: 'Listing removed successfully' });
});
exports.default = router;
//# sourceMappingURL=listings.js.map