/**
 * Admin Routes
 *
 * FEATURE 4 — Fraud Detection:
 *   GET /api/admin/flagged-sellers returns sellers flagged for duplicate submissions.
 *
 * FEATURE 7 — Secure Transaction Records:
 *   Listing verification and dispute resolution are logged as immutable AuditLog entries.
 *
 * All routes are protected by authenticate + requireAdmin middleware (set at router level).
 */

import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendEmail, emailTemplates } from '../services/emailService';
import { logAudit } from '../services/auditService';

const router = Router();
router.use(authenticate, requireAdmin);

// ---------------------------------------------------------------------------
// GET /api/admin/queue — Pending verification listings queue
// ---------------------------------------------------------------------------
router.get('/queue', async (_req, res: Response) => {
  const listings = await prisma.voucherListing.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ isPriorityVerification: 'desc' }, { createdAt: 'asc' }],
    include: {
      seller: {
        select: {
          id: true, name: true, email: true, repScore: true,
          totalSales: true,
          isVerified: true,      // FEATURE 6: show verification badge in queue
          flaggedForReview: true, // FEATURE 4: highlight flagged sellers
        },
      },
    },
  });
  res.json({ listings, count: listings.length });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/listings/:id/verify — Approve or Reject listing (Feature 3 + 7)
// ---------------------------------------------------------------------------
router.put('/listings/:id/verify', async (req: AuthRequest, res: Response) => {
  const { action, notes } = req.body; // 'APPROVE' | 'REJECT'
  if (!action) throw new AppError('Action (APPROVE or REJECT) is required', 400);

  const listing = await prisma.voucherListing.findUnique({
    where: { id: req.params.id },
    include: { seller: { select: { email: true, name: true, id: true } } },
  });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.status !== 'PENDING') {
    throw new AppError('Only PENDING listings can be verified', 400);
  }

  const newStatus = action === 'APPROVE' ? 'LIVE' : 'REJECTED';
  const updated = await prisma.voucherListing.update({
    where: { id: req.params.id },
    data: {
      status: newStatus,
      verificationNotes: notes || null,
      verifiedAt: new Date(),
      verifiedBy: req.user!.id,
    },
  });

  // FEATURE 4 — If rejecting, increment seller flaggedCount (possible bad listing)
  if (action === 'REJECT') {
    const seller = await prisma.user.update({
      where: { id: listing.sellerId },
      data: {
        flaggedCount: { increment: 1 },
        flaggedForReview: true, // one rejection is enough to flag for review
      },
      select: { flaggedCount: true },
    });

    // FEATURE 7 — Audit: seller flagged due to rejection
    await logAudit({
      userId: listing.seller.id,
      action: 'SELLER_FLAGGED',
      ipAddress: req.ip,
      metadata: {
        reason: 'Listing rejected by admin',
        listingId: listing.id,
        brand: listing.brand,
        flaggedCount: seller.flaggedCount,
        notes,
      },
    });
  }

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: listing.sellerId,
      type: action === 'APPROVE' ? 'LISTING_VERIFIED' : 'LISTING_REJECTED',
      title: action === 'APPROVE' ? '✅ Voucher Verified & Live!' : '❌ Listing Verification Notice',
      message: action === 'APPROVE'
        ? `Your ${listing.brand} voucher is now verified and live for buyers to purchase.`
        : `Your ${listing.brand} listing was rejected: ${notes || 'Information could not be validated.'}`,
      link: '/dashboard/seller',
    },
  });

  if (action === 'APPROVE') {
    const tmpl = emailTemplates.listingVerified(listing.seller.name, listing.brand);
    await sendEmail({ to: listing.seller.email, ...tmpl });
  } else {
    const tmpl = emailTemplates.listingRejected(listing.seller.name, listing.brand, notes || 'Information could not be validated');
    await sendEmail({ to: listing.seller.email, ...tmpl });
  }

  // FEATURE 7 — Audit: listing verified or rejected by admin
  await logAudit({
    userId: req.user!.id,
    action: action === 'APPROVE' ? 'LISTING_VERIFIED' : 'LISTING_REJECTED',
    ipAddress: req.ip,
    metadata: {
      listingId: listing.id,
      brand: listing.brand,
      sellerId: listing.sellerId,
      notes,
    },
  });

  res.json({ listing: updated });
});

// ---------------------------------------------------------------------------
// GET /api/admin/analytics — Platform health, GMV, take rate
// ---------------------------------------------------------------------------
router.get('/analytics', async (_req, res: Response) => {
  const [totalUsers, totalListings, totalOrders, gmvResult, disputeCount] = await Promise.all([
    prisma.user.count(),
    prisma.voucherListing.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { escrowStatus: 'RELEASED' },
      _sum: { amount: true, commission: true },
    }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
  ]);

  const categoryStats = await prisma.voucherListing.groupBy({
    by: ['category'],
    where: { status: 'LIVE' },
    _count: { id: true },
    _avg: { discountPct: true, askingPrice: true },
  });

  const pendingVerification = await prisma.voucherListing.count({ where: { status: 'PENDING' } });
  const flaggedSellers = await prisma.user.count({ where: { flaggedForReview: true } }); // FEATURE 4

  const gmv = gmvResult._sum.amount || 0;
  const totalCommission = gmvResult._sum.commission || 0;
  const takeRate = gmv > 0 ? ((totalCommission / gmv) * 100).toFixed(2) : '5.00';

  res.json({
    totalUsers,
    totalListings,
    totalOrders,
    gmv,
    totalCommission,
    takeRate,
    disputeCount,
    pendingVerification,
    flaggedSellers, // FEATURE 4
    categoryStats,
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/flagged-sellers — Sellers with repeated duplicate/rejected listings (Feature 4)
// ---------------------------------------------------------------------------
router.get('/flagged-sellers', async (_req, res: Response) => {
  const flagged = await prisma.user.findMany({
    where: { flaggedForReview: true },
    orderBy: { flaggedCount: 'desc' },
    select: {
      id: true, name: true, email: true, role: true,
      repScore: true, totalSales: true,
      flaggedCount: true, flaggedForReview: true,
      createdAt: true,
      listings: {
        where: { status: { in: ['REJECTED', 'PENDING'] } },
        select: { id: true, brand: true, status: true, createdAt: true, verificationNotes: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  res.json({ flaggedSellers: flagged, count: flagged.length });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/sellers/:id/unflag — Clear a seller's fraud flag (Feature 4)
// ---------------------------------------------------------------------------
router.put('/sellers/:id/unflag', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { flaggedForReview: false, flaggedCount: 0 },
    select: { id: true, name: true, email: true, flaggedForReview: true },
  });
  res.json({ message: 'Seller fraud flag cleared', user });
});

// ---------------------------------------------------------------------------
// GET /api/admin/disputes
// ---------------------------------------------------------------------------
router.get('/disputes', async (_req, res: Response) => {
  const disputes = await prisma.dispute.findMany({
    where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      order: {
        include: {
          listing: { select: { brand: true, askingPrice: true, faceValue: true } },
          buyer:   { select: { name: true, email: true } },
          seller:  { select: { name: true, email: true } },
        },
      },
      raisedBy: { select: { name: true, email: true } },
    },
  });
  res.json({ disputes });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/disputes/:id/resolve
// ---------------------------------------------------------------------------
router.put('/disputes/:id/resolve', async (req: AuthRequest, res: Response) => {
  const { resolution, action, adminNote } = req.body;
  // action: 'REFUND_BUYER' | 'RELEASE_SELLER'
  const dispute = await prisma.dispute.findUnique({
    where: { id: req.params.id },
    include: { order: { select: { buyerId: true, sellerId: true, sellerEarnings: true } } },
  });
  if (!dispute) throw new AppError('Dispute not found', 404);

  const newEscrowStatus = action === 'REFUND_BUYER' ? 'REFUNDED' : 'RELEASED';

  await Promise.all([
    prisma.dispute.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolution, adminNote, resolvedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: dispute.orderId },
      data: { escrowStatus: newEscrowStatus, confirmedAt: new Date() },
    }),
  ]);

  // FEATURE 7 — Audit: admin resolved dispute
  const auditAction = action === 'REFUND_BUYER' ? 'ESCROW_REFUNDED' : 'ESCROW_RELEASED';
  await logAudit({
    userId: req.user!.id,
    action: auditAction,
    orderId: dispute.orderId,
    ipAddress: req.ip,
    metadata: {
      disputeId: dispute.id,
      resolution,
      adminNote,
      resolvedBy: req.user!.id,
    },
  });

  res.json({ message: `Dispute resolved successfully. Escrow funds marked as ${newEscrowStatus}.` });
});

// ---------------------------------------------------------------------------
// GET /api/admin/users
// ---------------------------------------------------------------------------
router.get('/users', async (req, res: Response) => {
  const { page = '1', role, search } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * 20,
      take: 20,
      select: {
        id: true, name: true, email: true, role: true,
        repScore: true, totalSales: true, isVerified: true, createdAt: true,
        flaggedForReview: true, flaggedCount: true, // FEATURE 4
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/config — Update platform settings
// ---------------------------------------------------------------------------
router.put('/config', async (req, res: Response) => {
  const { key, value } = req.body;
  const config = await prisma.platformConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  res.json({ config });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/users/:id/verify — Manually verify a seller (Feature 6)
// ---------------------------------------------------------------------------
router.put('/users/:id/verify', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isVerified: true, sellerVerifiedAt: new Date() },
    select: { id: true, name: true, email: true, isVerified: true, sellerVerifiedAt: true },
  });
  await logAudit({
    userId: req.user!.id,
    action: 'EMAIL_VERIFIED',
    ipAddress: req.ip,
    metadata: { targetUserId: req.params.id, method: 'ADMIN_MANUAL' },
  });
  res.json({ message: 'User verified', user });
});

export default router;
