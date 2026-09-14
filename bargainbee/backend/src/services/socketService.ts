import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../config/jwt';
import prisma from '../config/prisma';

export const setupSocketIO = (io: SocketServer) => {
  // Auth middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return next(new Error('User not found'));
      (socket as Socket & { user: { id: string; name: string } }).user = { id: user.id, name: user.name };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user: { id: string; name: string } }).user;
    console.log(`[Socket.IO] Connected: ${user?.name || socket.id}`);

    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    socket.on('join_room', async (roomId: string) => {
      if (!user?.id) return;
      const room = await prisma.chatRoom.findFirst({
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

    socket.on('send_message', async (data: { roomId: string; body: string }) => {
      const { roomId, body } = data;
      if (!body?.trim() || !user?.id) return;

      const room = await prisma.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
      });

      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      const message = await prisma.chatMessage.create({
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
