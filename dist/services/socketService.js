"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = void 0;
const jwt_1 = require("../config/jwt");
const prisma_1 = __importDefault(require("../config/prisma"));
const setupSocketIO = (io) => {
    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                return next(new Error('Authentication required'));
            const decoded = (0, jwt_1.verifyToken)(token);
            const user = await prisma_1.default.user.findUnique({ where: { id: decoded.id } });
            if (!user)
                return next(new Error('User not found'));
            socket.user = { id: user.id, name: user.name };
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`[Socket.IO] Connected: ${user?.name || socket.id}`);
        if (user?.id) {
            socket.join(`user:${user.id}`);
        }
        socket.on('join_room', async (roomId) => {
            if (!user?.id)
                return;
            const room = await prisma_1.default.chatRoom.findFirst({
                where: {
                    id: roomId,
                    OR: [{ buyerId: user.id }, { sellerId: user.id }],
                },
            });
            if (!room) {
                socket.emit('error', 'Room access denied');
                return;
            }
            socket.join(`room:${roomId}`);
            socket.emit('joined_room', roomId);
        });
        socket.on('send_message', async (data) => {
            const { roomId, body } = data;
            if (!body?.trim() || !user?.id)
                return;
            const room = await prisma_1.default.chatRoom.findFirst({
                where: {
                    id: roomId,
                    OR: [{ buyerId: user.id }, { sellerId: user.id }],
                },
            });
            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }
            const message = await prisma_1.default.chatMessage.create({
                data: {
                    roomId,
                    senderId: user.id,
                    body: body.trim(),
                },
                include: { sender: { select: { id: true, name: true, avatar: true } } },
            });
            io.to(`room:${roomId}`).emit('message_received', message);
        });
        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Disconnected: ${user?.name || socket.id}`);
        });
    });
};
exports.setupSocketIO = setupSocketIO;
//# sourceMappingURL=socketService.js.map