import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: true,
});

export const joinUserRoom = (userId) => {
  socket.emit("joinRoom", userId);
};

export default socket;
