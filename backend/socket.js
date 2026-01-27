let ioInstance;

// online users map (userId -> socketId)
const onlineUsers = new Map();

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // ===============================
    // join user room + mark online
    // ===============================
    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);

      // send updated online users list
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      console.log(`👤 User online: ${userId}`);
    });

    // ===============================
    // message delivered
    // ===============================
    socket.on("messageDelivered", ({ senderId }) => {
      io.to(senderId).emit("messageDelivered");
    });

    // ===============================
    // message seen
    // ===============================
    socket.on("messageSeen", ({ senderId }) => {
      io.to(senderId).emit("messageSeen");
    });

    // ===============================
    // realtime chat message
    // ===============================
    socket.on("sendMessage", ({ senderId, receiverId, message }) => {
      const chatPayload = {
        senderId,
        message,
        createdAt: new Date(),
      };

      // send message
      io.to(receiverId).emit("receiveMessage", chatPayload);

      // send notification
      io.to(receiverId).emit("notification", {
        message: `💬 New message: ${message}`,
        isRead: false,
        createdAt: new Date(),
      });
    });

    // ===============================
    // typing indicator
    // ===============================
    socket.on("typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("stopTyping", { senderId });
    });

    // ===============================
    // disconnect → mark offline
    // ===============================
    socket.on("disconnect", () => {
      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);

          // broadcast updated online list
          io.emit("onlineUsers", Array.from(onlineUsers.keys()));

          console.log(`🔴 User offline: ${userId}`);
          break;
        }
      }

      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

// ===============================
// existing helper (UNCHANGED)
// ===============================
const sendNotification = (userId, notification) => {
  if (ioInstance) {
    ioInstance.to(userId).emit("notification", notification);
  }
};

module.exports = {
  initSocket,
  sendNotification,
};
