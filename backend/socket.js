let ioInstance;
const Message = require("./Message");

// online users map (userId -> socketId)
const onlineUsers = new Map();

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // ===============================
    // join user room
    // ===============================
    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    // ===============================
    // SEND MESSAGE
    // ===============================
    socket.on(
      "sendMessage",
      async ({ senderId, receiverId, message }) => {
        // 1️⃣ save (sent)
        const msg = await Message.create({
          senderId,
          receiverId,
          message,
          status: "sent",
        });

        // 2️⃣ deliver if receiver online
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverId).emit("receiveMessage", msg);

          // 3️⃣ update to delivered
          msg.status = "delivered";
          await msg.save();

          // 4️⃣ notify sender
          io.to(senderId).emit("messageDelivered", {
            messageId: msg._id,
          });
        }
      }
    );

    // ===============================
    // MESSAGE SEEN
    // ===============================
    socket.on(
      "messageSeen",
      async ({ messageId, senderId }) => {
        await Message.findByIdAndUpdate(messageId, {
          status: "seen",
        });

        io.to(senderId).emit("messageSeen", {
          messageId,
        });
      }
    );

    // ===============================
    // typing
    // ===============================
    socket.on("typing", ({ receiverId }) => {
      io.to(receiverId).emit("typing");
    });

    socket.on("stopTyping", ({ receiverId }) => {
      io.to(receiverId).emit("stopTyping");
    });

    // ===============================
    // disconnect
    // ===============================
    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          io.emit(
            "onlineUsers",
            Array.from(onlineUsers.keys())
          );
          break;
        }
      }
    });
  });
};

const sendNotification = (userId, payload) => {
  if (ioInstance) {
    ioInstance.to(userId).emit("notification", payload);
  }
};

module.exports = { initSocket, sendNotification };
