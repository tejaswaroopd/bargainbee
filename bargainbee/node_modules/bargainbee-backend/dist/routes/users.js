"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/users/:id - Public seller profile & reviews
router.get('/:id', async (req, res) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            repScore: true,
            totalSales: true,
            createdAt: true,
            receivedReviews: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    reviewer: { select: { id: true, name: true, avatar: true } },
                },
            },
            listings: {
                where: { status: 'LIVE' },
                select: {
                    id: true, brand: true, category: true,
                    faceValue: true, askingPrice: true, discountPct: true,
                    expiryDate: true, isFeatured: true,
                },
            },
        },
    });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({ user });
});
// GET /api/users/me/stats - Seller personal dashboard stats
router.get('/me/stats', auth_1.authenticate, async (req, res) => {
    const userId = req.user.id;
    const [totalListings, activeListings, totalOrders, totalRevenue] = await Promise.all([
        prisma_1.default.voucherListing.count({ where: { sellerId: userId } }),
        prisma_1.default.voucherListing.count({ where: { sellerId: userId, status: 'LIVE' } }),
        prisma_1.default.order.count({ where: { sellerId: userId } }),
        prisma_1.default.order.aggregate({
            where: { sellerId: userId, escrowStatus: 'RELEASED' },
            _sum: { sellerEarnings: true },
        }),
    ]);
    res.json({
        totalListings,
        activeListings,
        totalOrders,
        totalRevenue: totalRevenue._sum.sellerEarnings || 0,
    });
});
exports.default = router;
//# sourceMappingURL=users.js.map