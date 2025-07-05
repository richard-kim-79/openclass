import { Server } from 'socket.io';

export const setupSocketIO = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('join-room', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { userId: socket.id });
      console.log(`👥 User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { userId: socket.id });
      console.log(`👋 User ${socket.id} left room ${roomId}`);
    });

    socket.on('send-message', ({ roomId, message }) => {
      socket.to(roomId).emit('new-message', {
        userId: socket.id,
        message,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};
