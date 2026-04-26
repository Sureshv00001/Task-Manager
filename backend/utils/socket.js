const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socket.id
const onlineUsers = new Set(); // Set of active userIds
const taskViewers = new Map(); // taskId -> Set of user info

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSockets.set(userId, socket.id);
      onlineUsers.add(userId);
      io.emit('presence-update', Array.from(onlineUsers));
      console.log(`User connected: ${userId} with socket ${socket.id}`);
    }

    socket.on('join-task', ({ taskId, user }) => {
      socket.join(`task-${taskId}`);
      if (!taskViewers.has(taskId)) {
        taskViewers.set(taskId, new Map());
      }
      taskViewers.get(taskId).set(userId, user);
      
      const currentViewers = Array.from(taskViewers.get(taskId).values());
      io.to(`task-${taskId}`).emit('task-viewers', currentViewers);
    });

    socket.on('leave-task', ({ taskId }) => {
      socket.leave(`task-${taskId}`);
      if (taskViewers.has(taskId)) {
        taskViewers.get(taskId).delete(userId);
        const currentViewers = Array.from(taskViewers.get(taskId).values());
        io.to(`task-${taskId}`).emit('task-viewers', currentViewers);
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        userSockets.delete(userId);
        onlineUsers.delete(userId);
        io.emit('presence-update', Array.from(onlineUsers));
        
        // Clean up task viewers
        taskViewers.forEach((viewers, taskId) => {
          if (viewers.has(userId)) {
            viewers.delete(userId);
            const currentViewers = Array.from(viewers.values());
            io.to(`task-${taskId}`).emit('task-viewers', currentViewers);
          }
        });
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

const getOnlineUsers = () => Array.from(onlineUsers);

module.exports = { initSocket, getIo, emitToUser, getOnlineUsers };
