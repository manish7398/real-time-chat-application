require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const authRoutes = require("./authRoutes");
const { initSocket } = require("./socket");

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
