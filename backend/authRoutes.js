const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { registerUser, loginUser } = require("./authController");
const authMiddleware = require("./authMiddleware");
const Notification = require("./Notification");

// 🔒 Rate limit login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try later.",
});

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

// Fetch notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user.id,
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// Mark as read
router.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });
  res.json({ message: "Marked as read" });
});

module.exports = router;
