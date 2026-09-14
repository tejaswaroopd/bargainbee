import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/:id - Public seller profile & reviews
router.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
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
router.get('/me/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const [totalListings, activeListings, totalOrders, totalRevenue] = await Promise.all([
    prisma.voucherListing.count({ where: { sellerId: userId } }),
    prisma.voucherListing.count({ where: { sellerId: userId, status: 'LIVE' } }),
    prisma.order.count({ where: { sellerId: userId } }),
    prisma.order.aggregate({
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

export default router;
