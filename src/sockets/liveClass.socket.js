import LiveClass from "../models/LiveClass.model.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const activeRooms = new Map();

export const initializeLiveClassSocket = (io) => {
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join-class", async (data) => {
      const { roomId, userId, userName, userRole } = data;

      try {
        socket.join(roomId);

        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            participants: [],
            instructor: null,
            currentSlide: null,
            recording: false,
            recordingChunks: [],
            bandwidthStats: new Map(),
          });
        }

        const room = activeRooms.get(roomId);

        const participant = {
          socketId: socket.id,
          userId,
          userName,
          userRole,
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: false,
          handRaised: false,
          bandwidth: "medium",
          connectionQuality: "good",
        };

        room.participants.push(participant);

        if (userRole === "instructor") {
          room.instructor = participant;
        }

        await LiveClass.findOneAndUpdate(
          { roomId },
          {
            $push: {
              participants: {
                userId,
                name: userName,
                role: userRole,
                joinedAt: new Date(),
              },
            },
          }
        );

        // Send user-joined to others (excluding the person who just joined)
        socket.to(roomId).emit("user-joined", {
          participant,
          totalParticipants: room.participants.length,
        });

        socket.emit("room-state", {
          participants: room.participants,
          currentSlide: room.currentSlide,
          instructor: room.instructor,
          isRecording: room.recording,
        });

        logger.info(`User ${userName} (${userRole}) joined room ${roomId}`);
      } catch (error) {
        logger.error("Error joining class:", error);
        socket.emit("error", { message: "Failed to join class" });
      }
    });

    socket.on("leave-class", async (data) => {
      const { roomId, userId } = data;

      try {
        socket.leave(roomId);

        if (activeRooms.has(roomId)) {
          const room = activeRooms.get(roomId);
          const participant = room.participants.find(
            (p) => p.socketId === socket.id
          );

          room.participants = room.participants.filter(
            (p) => p.socketId !== socket.id
          );

          await LiveClass.findOneAndUpdate(
            { roomId, "participants.userId": userId },
            {
              $set: { "participants.$.leftAt": new Date() },
            }
          );

          if (room.participants.length === 0) {
            activeRooms.delete(roomId);
          }

          socket.to(roomId).emit("user-left", {
            userId,
            userName: participant?.userName,
            totalParticipants: room.participants.length,
          });
        }

        logger.info(`User ${userId} left room ${roomId}`);
      } catch (error) {
        logger.error("Error leaving class:", error);
      }
    });

    socket.on("webrtc-offer", (data) => {
      const { roomId, offer, targetSocketId } = data;

      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-offer", {
          offer,
          fromSocketId: socket.id,
        });
      } else {
        socket.to(roomId).emit("webrtc-offer", {
          offer,
          fromSocketId: socket.id,
        });
      }
    });

    socket.on("webrtc-answer", (data) => {
      const { answer, targetSocketId } = data;

      io.to(targetSocketId).emit("webrtc-answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on("webrtc-ice-candidate", (data) => {
      const { candidate, targetSocketId } = data;

      io.to(targetSocketId).emit("webrtc-ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    socket.on("bandwidth-update", (data) => {
      const { roomId, bandwidth, connectionQuality } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const participant = room.participants.find(
          (p) => p.socketId === socket.id
        );

        if (participant) {
          participant.bandwidth = bandwidth;
          participant.connectionQuality = connectionQuality;

          if (room.instructor) {
            io.to(room.instructor.socketId).emit(
              "participant-bandwidth-update",
              {
                userId: participant.userId,
                userName: participant.userName,
                bandwidth,
                connectionQuality,
              }
            );
          }
        }
      }
    });

    socket.on("toggle-media", (data) => {
      const { roomId, mediaType, enabled } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const participant = room.participants.find(
          (p) => p.socketId === socket.id
        );

        if (participant) {
          if (mediaType === "audio") {
            participant.audioEnabled = enabled;
          } else if (mediaType === "video") {
            participant.videoEnabled = enabled;
          }

          io.to(roomId).emit("participant-media-changed", {
            userId: participant.userId,
            userName: participant.userName,
            mediaType,
            enabled,
          });
        }
      }
    });

    socket.on("change-slide", async (data) => {
      const { roomId, slideUrl, slideIndex } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);

        const sender = room.participants.find((p) => p.socketId === socket.id);
        if (sender && sender.userRole === "instructor") {
          room.currentSlide = { url: slideUrl, index: slideIndex };

          socket.to(roomId).emit("slide-changed", {
            slideUrl,
            slideIndex,
            timestamp: new Date(),
          });

          try {
            await LiveClass.findOneAndUpdate(
              { roomId },
              {
                $push: {
                  slides: {
                    url: slideUrl,
                    displayedAt: new Date(),
                  },
                },
              }
            );
          } catch (error) {
            logger.error("Error saving slide change:", error);
          }
        }
      }
    });

    socket.on("start-screen-share", (data) => {
      const { roomId } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          socket.to(roomId).emit("screen-share-started", {
            instructorSocketId: socket.id,
            instructorName: sender.userName,
          });
        }
      }
    });

    socket.on("stop-screen-share", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("screen-share-stopped");
    });

    socket.on("chat-message", (data) => {
      const { roomId, message, userName, userId } = data;

      io.to(roomId).emit("chat-message", {
        message,
        userName,
        userId,
        timestamp: new Date(),
      });
    });

    socket.on("raise-hand", (data) => {
      const { roomId, userName, userId, raised } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const participant = room.participants.find(
          (p) => p.socketId === socket.id
        );

        if (participant) {
          participant.handRaised = raised;

          io.to(roomId).emit("hand-raised", {
            userName,
            userId,
            raised,
            timestamp: new Date(),
          });
        }
      }
    });

    socket.on("start-poll", (data) => {
      const { roomId, poll } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          socket.to(roomId).emit("new-poll", {
            poll,
            timestamp: new Date(),
          });
        }
      }
    });

    socket.on("submit-poll-response", (data) => {
      const { roomId, pollId, response, userId, userName } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);

        if (room.instructor) {
          io.to(room.instructor.socketId).emit("poll-response", {
            pollId,
            response,
            userId,
            userName,
            timestamp: new Date(),
          });
        }
      }
    });

    socket.on("end-poll", (data) => {
      const { roomId, pollId, results } = data;

      io.to(roomId).emit("poll-ended", {
        pollId,
        results,
        timestamp: new Date(),
      });
    });

    socket.on("start-recording", async (data) => {
      const { roomId, initiatedBy } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          room.recording = true;
          room.recordingChunks = [];

          // Send to others in the room (excluding the sender)
          socket.to(roomId).emit("recording-started", {
            timestamp: new Date(),
            initiatedBy,
          });

          await LiveClass.findOneAndUpdate(
            { roomId },
            {
              isRecording: true,
              recordingStartedAt: new Date(),
            }
          );

          logger.info(`Recording started for room ${roomId}`);
        }
      }
    });

    socket.on("recording-chunk", (data) => {
      const { roomId, chunk } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        if (room.recording && chunk) {
          room.recordingChunks.push(chunk);
        }
      }
    });

    socket.on("stop-recording", async (data) => {
      const { roomId, initiatedBy } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          room.recording = false;

          const recordingDir = path.join(
            process.cwd(),
            "uploads",
            "recordings"
          );
          if (!fs.existsSync(recordingDir)) {
            fs.mkdirSync(recordingDir, { recursive: true });
          }

          const recordingPath = `uploads/recordings/${roomId}-${Date.now()}.webm`;

          // Send to others in the room (excluding the sender)
          socket.to(roomId).emit("recording-stopped", {
            timestamp: new Date(),
            recordingUrl: recordingPath,
            initiatedBy,
          });

          await LiveClass.findOneAndUpdate(
            { roomId },
            {
              isRecording: false,
              recordingEndedAt: new Date(),
              recordingUrl: recordingPath,
            }
          );

          logger.info(`Recording stopped for room ${roomId}`);
        }
      }
    });

    socket.on("mute-all", (data) => {
      const { roomId } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          room.participants.forEach((p) => {
            if (p.userRole === "student") {
              p.audioEnabled = false;
            }
          });

          socket.to(roomId).emit("mute-all-command");
        }
      }
    });

    socket.on("mute-student", (data) => {
      const { roomId, studentSocketId } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          const student = room.participants.find(
            (p) => p.socketId === studentSocketId
          );
          if (student) {
            student.audioEnabled = false;
            io.to(studentSocketId).emit("force-mute");
          }
        }
      }
    });

    socket.on("remove-student", (data) => {
      const { roomId, studentSocketId } = data;

      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const sender = room.participants.find((p) => p.socketId === socket.id);

        if (sender && sender.userRole === "instructor") {
          io.to(studentSocketId).emit("removed-from-class", {
            reason: "Removed by instructor",
          });

          const studentSocket = io.sockets.sockets.get(studentSocketId);
          if (studentSocket) {
            studentSocket.leave(roomId);
          }

          room.participants = room.participants.filter(
            (p) => p.socketId !== studentSocketId
          );
        }
      }
    });

    socket.on("end-class", (data) => {
      const { roomId } = data;

      io.to(roomId).emit("class-ended", {
        message: "The class has been ended by the instructor",
        timestamp: new Date(),
      });

      if (activeRooms.has(roomId)) {
        activeRooms.delete(roomId);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);

      activeRooms.forEach((room, roomId) => {
        const participant = room.participants.find(
          (p) => p.socketId === socket.id
        );

        if (participant) {
          room.participants = room.participants.filter(
            (p) => p.socketId !== socket.id
          );

          io.to(roomId).emit("user-left", {
            userId: participant.userId,
            userName: participant.userName,
            totalParticipants: room.participants.length,
          });

          if (room.participants.length === 0) {
            activeRooms.delete(roomId);
          }
        }
      });
    });
  });

  return {
    getActiveRooms: () => activeRooms,
    getRoomParticipants: (roomId) =>
      activeRooms.get(roomId)?.participants || [],
    isRoomActive: (roomId) => activeRooms.has(roomId),
  };
};
