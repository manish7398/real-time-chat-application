const express = require("express");
const router = express.Router();
const User = require("./User");
const authMiddleware = require("./authMiddleware");

// GET all users except logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      "name email"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

module.exports = router;
