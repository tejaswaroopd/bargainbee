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
// GET /api/wishlist
router.get('/', async (req, res) => {
    const items = await prisma_1.default.wishlist.findMany({ where: { userId: req.user.id } });
    res.json({ items });
});
// POST /api/wishlist - Add brand or category alert
router.post('/', async (req, res) => {
    const { brand, category, maxPrice, notifyEmail } = req.body;
    const item = await prisma_1.default.wishlist.create({
        data: {
            userId: req.user.id,
            brand,
            category,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            notifyEmail: notifyEmail !== false,
        },
    });
    res.status(201).json({ item });
});
// DELETE /api/wishlist/:id
router.delete('/:id', async (req, res) => {
    const item = await prisma_1.default.wishlist.findUnique({ where: { id: req.params.id } });
    if (!item)
        throw new errorHandler_1.AppError('Wishlist item not found', 404);
    if (item.userId !== req.user.id)
        throw new errorHandler_1.AppError('Unauthorized', 403);
    await prisma_1.default.wishlist.delete({ where: { id: req.params.id } });
    res.json({ message: 'Removed from wishlist' });
});
exports.default = router;
//# sourceMappingURL=wishlist.js.map