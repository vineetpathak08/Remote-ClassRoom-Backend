import LiveClass from '../models/LiveClass.model.js';
import { logger } from '../utils/logger.js';

export const initializeLiveClassSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a live class room
    socket.on('join-class', async (data) => {
      const { roomId, studentId } = data;
      
      try {
        socket.join(roomId);
        
        // Update participant list
        await LiveClass.findOneAndUpdate(
          { roomId },
          {
            $push: {
              participants: {
                studentId,
                joinedAt: new Date()
              }
            }
          }
        );

        socket.to(roomId).emit('user-joined', { studentId });
        logger.info(`Student ${studentId} joined room ${roomId}`);
      } catch (error) {
        logger.error('Error joining class:', error);
        socket.emit('error', { message: 'Failed to join class' });
      }
    });

    // Leave a live class room
    socket.on('leave-class', async (data) => {
      const { roomId, studentId } = data;
      
      try {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', { studentId });
        logger.info(`Student ${studentId} left room ${roomId}`);
      } catch (error) {
        logger.error('Error leaving class:', error);
      }
    });

    // Handle audio stream (audio-only mode for low bandwidth)
    socket.on('audio-stream', (data) => {
      const { roomId, audioData } = data;
      socket.to(roomId).emit('audio-stream', audioData);
    });

    // Handle slide changes
    socket.on('change-slide', async (data) => {
      const { roomId, slideUrl } = data;
      
      socket.to(roomId).emit('slide-changed', { slideUrl });
      
      // Save slide display to database
      try {
        await LiveClass.findOneAndUpdate(
          { roomId },
          {
            $push: {
              slides: {
                url: slideUrl,
                displayedAt: new Date()
              }
            }
          }
        );
      } catch (error) {
        logger.error('Error saving slide change:', error);
      }
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      const { roomId, message, studentId } = data;
      io.to(roomId).emit('chat-message', {
        message,
        studentId,
        timestamp: new Date()
      });
    });

    // Handle raise hand
    socket.on('raise-hand', (data) => {
      const { roomId, studentId } = data;
      socket.to(roomId).emit('hand-raised', { studentId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};