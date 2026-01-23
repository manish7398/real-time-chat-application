import { useEffect, useState } from "react";
import socket, {
  joinUserRoom,
  sendChatMessage,
} from "./socket";
import { jwtDecode } from "jwt-decode";
import "./App.css";

function Dashboard({ setToken }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  // demo receiver (later dynamic)
  const receiverId = "demo-receiver-id";

  // join room
  useEffect(() => {
    if (userId) joinUserRoom(userId);
  }, [userId]);

  // socket listeners
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
      setIsTyping(false);
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("onlineUsers");
    };
  }, []);

  const handleTyping = (value) => {
    setText(value);
    socket.emit("typing", { senderId: userId, receiverId });
    if (!value) {
      socket.emit("stopTyping", { senderId: userId, receiverId });
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = { senderId: userId, receiverId, message: text };
    sendChatMessage(msg);
    socket.emit("stopTyping", { senderId: userId, receiverId });

    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const receiverOnline = onlineUsers.includes(receiverId);

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h2>
          NotifyX Chat
          <span
            className={`status-dot ${
              receiverOnline ? "online" : "offline"
            }`}
          />
        </h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-bubble ${
                m.senderId === userId
                  ? "chat-me"
                  : "chat-other"
              }`}
            >
              {m.message}
            </div>
          ))}
          {isTyping && (
            <div className="typing-indicator">typing…</div>
          )}
        </div>

        <div className="chat-input">
          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
