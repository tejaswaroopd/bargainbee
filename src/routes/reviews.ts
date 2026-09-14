import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/reviews - Add seller review post-escrow
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { orderId, rating, comment } = req.body;
  if (!orderId || !rating) throw new AppError('orderId and rating are required', 400);
  if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyerId !== req.user!.id) throw new AppError('Only the buyer who completed this transaction can review', 403);
  if (order.escrowStatus !== 'RELEASED') throw new AppError('Reviews can only be posted after escrow release is confirmed', 400);

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) throw new AppError('A review has already been submitted for this order', 409);

  const review = await prisma.review.create({
    data: {
      orderId,
      reviewerId: order.buyerId,
      revieweeId: order.sellerId,
      rating,
      comment,
    },
  });

  // Re-calculate seller reputation score
  const allReviews = await prisma.review.findMany({ where: { revieweeId: order.sellerId } });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await prisma.user.update({
    where: { id: order.sellerId },
    data: { repScore: Math.round(avgRating * 10) / 10 },
  });

  res.status(201).json({ review });
});

// GET /api/reviews/seller/:userId
router.get('/seller/:userId', async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
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

export default router;
