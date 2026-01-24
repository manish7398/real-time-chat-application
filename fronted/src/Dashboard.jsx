import { useEffect, useRef, useState } from "react";
import socket, {
  joinUserRoom,
  sendChatMessage,
} from "./socket";
import { jwtDecode } from "jwt-decode";
import "./App.css";

const chatUsers = [
  { id: "u1", name: "Rahul" },
  { id: "u2", name: "Amit" },
  { id: "u3", name: "Neha" },
];

function Dashboard({ setToken }) {
  const [messages, setMessages] = useState([]);
  const [seen, setSeen] = useState(false);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(chatUsers[0]);

  // 🔴 unread count per user
  const [unread, setUnread] = useState({
    u1: 0,
    u2: 0,
    u3: 0,
  });

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const receiverId = selectedChat.id;

  // join own room
  useEffect(() => {
    if (userId) joinUserRoom(userId);
  }, [userId]);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // socket listeners
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      // if message from currently open chat
      if (data.senderId === receiverId) {
        setMessages((prev) => [...prev, data]);
        setIsTyping(false);
      } else {
        // 🔴 increment unread for that user
        setUnread((prev) => ({
          ...prev,
          [data.senderId]:
            (prev[data.senderId] || 0) + 1,
        }));
      }

      socket.emit("messageDelivered", {
        senderId: data.senderId,
      });
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("messageDelivered", () => {
      setSeen(false);
    });

    socket.on("messageSeen", () => {
      setSeen(true);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("onlineUsers");
      socket.off("messageDelivered");
      socket.off("messageSeen");
    };
  }, [receiverId]);

  const handleTyping = (value) => {
    setText(value);
    socket.emit("typing", {
      senderId: userId,
      receiverId,
    });

    if (!value) {
      socket.emit("stopTyping", {
        senderId: userId,
        receiverId,
      });
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      senderId: userId,
      receiverId,
      message: text,
    };

    sendChatMessage(msg);
    socket.emit("stopTyping", {
      senderId: userId,
      receiverId,
    });

    setMessages((prev) => [...prev, msg]);
    setText("");
    setSeen(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const receiverOnline = onlineUsers.includes(receiverId);

  return (
    <div className="dash-page">
      {/* HEADER */}
      <div className="dash-header">
        <h2>
          NotifyX Chat — {selectedChat.name}
          <span
            className={`status-dot ${
              receiverOnline ? "online" : "offline"
            }`}
          />
        </h2>
        <button onClick={logout}>Logout</button>
      </div>

      {/* CHAT LAYOUT */}
      <div className="chat-layout">
        {/* LEFT CHAT LIST */}
        <div className="chat-list">
          {chatUsers.map((user) => (
            <div
              key={user.id}
              className={`chat-item ${
                selectedChat.id === user.id
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelectedChat(user);
                setMessages([]);
                setSeen(false);

                // reset unread
                setUnread((prev) => ({
                  ...prev,
                  [user.id]: 0,
                }));

                socket.emit("messageSeen", {
                  senderId: user.id,
                });
              }}
            >
              <div className="chat-name">
                {user.name}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="chat-last">
                  Click to chat
                </span>

                {unread[user.id] > 0 && (
                  <span
                    style={{
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 8px",
                      fontSize: 12,
                    }}
                  >
                    {unread[user.id]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT CHAT WINDOW */}
        <div className="chat-window">
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
                  {m.senderId === userId && (
                    <span
                      style={{
                        fontSize: 12,
                        marginLeft: 6,
                        opacity: 0.7,
                      }}
                    >
                      {seen ? "✔✔" : "✔"}
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
                  handleTyping(e.target.value)
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
    </div>
  );
}

export default Dashboard;
