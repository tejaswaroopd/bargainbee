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
router.use(auth_1.authenticate);
// GET /api/chat/rooms
router.get('/rooms', async (req, res) => {
    const rooms = await prisma_1.default.chatRoom.findMany({
        where: { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] },
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
router.post('/rooms', async (req, res) => {
    const { listingId } = req.body;
    const listing = await prisma_1.default.voucherListing.findUnique({ where: { id: listingId } });
    if (!listing)
        throw new errorHandler_1.AppError('Listing not found', 404);
    if (listing.sellerId === req.user.id)
        throw new errorHandler_1.AppError('Cannot initiate chat on your own listing', 400);
    const existing = await prisma_1.default.chatRoom.findFirst({
        where: { listingId, buyerId: req.user.id },
    });
    if (existing) {
        res.json({ room: existing });
        return;
    }
    const room = await prisma_1.default.chatRoom.create({
        data: { listingId, buyerId: req.user.id, sellerId: listing.sellerId },
    });
    res.status(201).json({ room });
});
// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', async (req, res) => {
    const room = await prisma_1.default.chatRoom.findUnique({ where: { id: req.params.id } });
    if (!room)
        throw new errorHandler_1.AppError('Chat room not found', 404);
    if (room.buyerId !== req.user.id && room.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Unauthorized access to chat', 403);
    }
    const messages = await prisma_1.default.chatMessage.findMany({
        where: { roomId: req.params.id },
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    res.json({ messages });
});
exports.default = router;
//# sourceMappingURL=chat.js.map