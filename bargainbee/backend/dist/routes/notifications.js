"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// GET /api/notifications
router.get('/', async (req, res) => {
    const notifications = await prisma_1.default.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    const unreadCount = await prisma_1.default.notification.count({
        where: { userId: req.user.id, read: false },
    });
    res.json({ notifications, unreadCount });
});
// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
    await prisma_1.default.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data: { read: true },
    });
    res.json({ message: 'Marked as read' });
});
// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
    await prisma_1.default.notification.updateMany({
        where: { userId: req.user.id, read: false },
        data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
});
exports.default = router;
//# sourceMappingURL=notifications.js.map