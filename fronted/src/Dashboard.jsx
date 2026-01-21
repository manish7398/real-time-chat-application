import { useEffect, useState } from "react";
import socket, { joinUserRoom } from "./socket";
import { fetchNotifications, markAsRead } from "./api";
import "./App.css";
import { jwtDecode } from "jwt-decode";

function Dashboard({ setToken }) {
  const [notifications, setNotifications] = useState([]);

  // 🔐 get userId from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      joinUserRoom(decoded.id);
    }
  }, []);

  // load notifications
  useEffect(() => {
    fetchNotifications().then((res) => {
      setNotifications(res.data);
    });
  }, []);

  // realtime listener
  useEffect(() => {
    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => socket.off("notification");
  }, []);

  // mark read
  const handleRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <h2>NotifyX</h2>

        <div className="dash-right">
          <div className="dash-bell">
            🔔
            {unreadCount > 0 && (
              <span className="dash-badge">
                {unreadCount}
              </span>
            )}
          </div>

          <button className="dash-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="dash-content">
        <h3>Notifications</h3>

        <div className="notify-grid">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notify-card ${
                n.isRead ? "read" : "unread"
              }`}
              onClick={() => handleRead(n._id)}
            >
              <div className="notify-icon">🔔</div>
              <div className="notify-text">
                <p>{n.message}</p>
                <span>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
