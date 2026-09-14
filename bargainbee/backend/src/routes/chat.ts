import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/chat/rooms
router.get('/rooms', async (req: AuthRequest, res: Response) => {
  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }] },
    include: {
      listing: { select: { id: true, brand: true, voucherImageUrl: true, askingPrice: true } },
      buyer: { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  res.json({ rooms });
});

// POST /api/chat/rooms - Create or get chat room
router.post('/rooms', async (req: AuthRequest, res: Response) => {
  const { listingId } = req.body;
  const listing = await prisma.voucherListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.sellerId === req.user!.id) throw new AppError('Cannot initiate chat on your own listing', 400);

  const existing = await prisma.chatRoom.findFirst({
    where: { listingId, buyerId: req.user!.id },
  });
  if (existing) {
    res.json({ room: existing });
    return;
  }

  const room = await prisma.chatRoom.create({
    data: { listingId, buyerId: req.user!.id, sellerId: listing.sellerId },
  });
  res.status(201).json({ room });
});

// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', async (req: AuthRequest, res: Response) => {
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) throw new AppError('Chat room not found', 404);
  if (room.buyerId !== req.user!.id && room.sellerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Unauthorized access to chat', 403);
  }
  const messages = await prisma.chatMessage.findMany({
    where: { roomId: req.params.id },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });
  res.json({ messages });
});

export default router;
