import { useState } from "react";
import API from "./api";
import "./App.css";

function Login({ setToken, setShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // ✅ token auto store
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">
          Login to <b>NotifyX</b>
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
          </div>

          <div className="input-group">
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
            <label>Password</label>

            <span
              className="toggle"
              onClick={() => setShow(!show)}
            >
              {show ? "🙈" : "👁️"}
            </span>
          </div>

          {error && (
            <p className="error">{error}</p>
          )}

          <button
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 🔹 REGISTER LINK */}
        <p
          style={{
            marginTop: 15,
            cursor: "pointer",
          }}
          onClick={() => setShowRegister(true)}
        >
          New user? <b>Register here</b>
        </p>

        <p className="footer-text">
          Secure • Fast • Realtime Notifications
        </p>
      </div>
    </div>
  );
}
export default Login;

