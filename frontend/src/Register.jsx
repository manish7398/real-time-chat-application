import { useState } from "react";
import API from "./api";
import "./App.css";

function Register({ setToken, setShowRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
      });

      // ✅ auto login after register
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Create Account</h2>
        <p className="subtitle">
          Register to <b>NotifyX</b>
        </p>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input
              required
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
            <label>Name</label>
          </div>

          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
            <label>Email</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
            <label>Password</label>
          </div>

          {error && (
            <p className="error">{error}</p>
          )}

          <button
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p
          style={{ marginTop: 15, cursor: "pointer" }}
          onClick={() => setShowRegister(false)}
        >
          Already have an account?{" "}
          <b>Login</b>
        </p>
      </div>
    </div>
  );
}

export default Register;
