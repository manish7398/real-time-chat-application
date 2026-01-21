let ioInstance;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`👤 User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

const sendNotification = (userId, notification) => {
  if (ioInstance) {
    ioInstance.to(userId).emit("notification", notification);
  }
};

module.exports = {
  initSocket,
  sendNotification,
};
