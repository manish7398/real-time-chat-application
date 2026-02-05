import { useEffect, useRef, useState } from "react";
import socket, {
  joinUserRoom,
  sendChatMessage,
} from "./socket";
import API from "./api";
import { jwtDecode } from "jwt-decode";
import "./App.css";

function Dashboard({ setToken }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const decoded = jwtDecode(token);
  const userId = decoded.id;

  // ======================
  // Fetch users
  // ======================
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await API.get("/users");
      setUsers(res.data);
      if (res.data[0]) {
        setSelectedUser(res.data[0]);
        loadChatHistory(res.data[0]._id);
      }
    };
    fetchUsers();
  }, []);

  // ======================
  // Join socket
  // ======================
  useEffect(() => {
    joinUserRoom(userId);
  }, [userId]);

  // ======================
  // Load history
  // ======================
  const loadChatHistory = async (otherUserId) => {
    const res = await API.get(`/messages/${otherUserId}`);
    setMessages(res.data);

    // 🔵 mark unseen messages as seen
    res.data.forEach((m) => {
      if (
        m.receiverId === userId &&
        m.status !== "seen"
      ) {
        socket.emit("messageSeen", {
          messageId: m._id,
          senderId: m.senderId,
        });
      }
    });
  };

  // ======================
  // Auto scroll
  // ======================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ======================
  // Socket listeners
  // ======================
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, msg]);

        // mark seen immediately
        socket.emit("messageSeen", {
          messageId: msg._id,
          senderId: msg.senderId,
        });
      }
    });

    socket.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, status: "delivered" }
            : m
        )
      );
    });

    socket.on("messageSeen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, status: "seen" }
            : m
        )
      );
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    socket.on("onlineUsers", (users) =>
      setOnlineUsers(users)
    );

    return () => socket.off();
  }, [selectedUser]);

  // ======================
  // Send message
  // ======================
  const sendMessage = () => {
    if (!text.trim() || !selectedUser) return;

    const msg = {
      senderId: userId,
      receiverId: selectedUser._id,
      message: text,
    };

    sendChatMessage(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, status: "sent" },
    ]);
    setText("");
  };

  // ======================
  // Logout
  // ======================
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h2>NotifyX Chat</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="chat-layout">
        {/* USERS */}
        <div className="chat-list">
          {users.map((u) => (
            <div
              key={u._id}
              className={`chat-item ${
                selectedUser?._id === u._id
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelectedUser(u);
                loadChatHistory(u._id);
              }}
            >
              <div className="chat-name">{u.name}</div>
              <span
                className={`status-dot ${
                  onlineUsers.includes(u._id)
                    ? "online"
                    : "offline"
                }`}
              />
            </div>
          ))}
        </div>

        {/* CHAT */}
        <div className="chat-window">
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
                {m.senderId === userId && (
                  <span
                    style={{
                      marginLeft: 6,
                      color:
                        m.status === "seen"
                          ? "dodgerblue"
                          : "gray",
                    }}
                  >
                    {m.status === "sent"
                      ? "✔"
                      : "✔✔"}
                  </span>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

