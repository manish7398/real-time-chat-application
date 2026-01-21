const User = require("./User");
const Notification = require("./Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendNotification } = require("./socket");

exports.registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashed });

    res.json({ message: "User registered successfully" });
  } catch {
    res.status(500).json({ message: "Register error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const notification = await Notification.create({
      userId: user._id,
      message: "Login successful",
    });

    sendNotification(user._id.toString(), notification);

    res.json({ token });
  } catch {
    res.status(500).json({ message: "Login error" });
  }
};
