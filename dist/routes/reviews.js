"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// POST /api/reviews - Add seller review post-escrow
router.post('/', auth_1.authenticate, async (req, res) => {
    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating)
        throw new errorHandler_1.AppError('orderId and rating are required', 400);
    if (rating < 1 || rating > 5)
        throw new errorHandler_1.AppError('Rating must be between 1 and 5', 400);
    const order = await prisma_1.default.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError('Order not found', 404);
    if (order.buyerId !== req.user.id)
        throw new errorHandler_1.AppError('Only the buyer who completed this transaction can review', 403);
    if (order.escrowStatus !== 'RELEASED')
        throw new errorHandler_1.AppError('Reviews can only be posted after escrow release is confirmed', 400);
    const existing = await prisma_1.default.review.findUnique({ where: { orderId } });
    if (existing)
        throw new errorHandler_1.AppError('A review has already been submitted for this order', 409);
    const review = await prisma_1.default.review.create({
        data: {
            orderId,
            reviewerId: order.buyerId,
            revieweeId: order.sellerId,
            rating,
            comment,
        },
    });
    // Re-calculate seller reputation score
    const allReviews = await prisma_1.default.review.findMany({ where: { revieweeId: order.sellerId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await prisma_1.default.user.update({
        where: { id: order.sellerId },
        data: { repScore: Math.round(avgRating * 10) / 10 },
    });
    res.status(201).json({ review });
});
// GET /api/reviews/seller/:userId
router.get('/seller/:userId', async (req, res) => {
    const reviews = await prisma_1.default.review.findMany({
        where: { revieweeId: req.params.userId },
        orderBy: { createdAt: 'desc' },
        include: {
            reviewer: { select: { id: true, name: true, avatar: true } },
        },
    });
    const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
    res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length });
});
exports.default = router;
//# sourceMappingURL=reviews.js.map