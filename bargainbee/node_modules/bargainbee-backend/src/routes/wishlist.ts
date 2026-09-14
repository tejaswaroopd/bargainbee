import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/wishlist
router.get('/', async (req: AuthRequest, res: Response) => {
  const items = await prisma.wishlist.findMany({ where: { userId: req.user!.id } });
  res.json({ items });
});

// POST /api/wishlist - Add brand or category alert
router.post('/', async (req: AuthRequest, res: Response) => {
  const { brand, category, maxPrice, notifyEmail } = req.body;
  const item = await prisma.wishlist.create({
    data: {
      userId: req.user!.id,
      brand,
      category,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      notifyEmail: notifyEmail !== false,
    },
  });
  res.status(201).json({ item });
});

// DELETE /api/wishlist/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.wishlist.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError('Wishlist item not found', 404);
  if (item.userId !== req.user!.id) throw new AppError('Unauthorized', 403);
  await prisma.wishlist.delete({ where: { id: req.params.id } });
  res.json({ message: 'Removed from wishlist' });
});

export default router;
