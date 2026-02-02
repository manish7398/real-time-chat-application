const express = require("express");
const router = express.Router();
const Message = require("./Message");
const authMiddleware = require("./authMiddleware");

// GET chat history between two users
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load messages",
    });
  }
});

module.exports = router;
