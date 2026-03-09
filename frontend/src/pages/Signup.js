import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password || !confirmPassword) {
      setMessage("❌ Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      await signup(email, password);
      setMessage("✅ Signup successful. Please verify your email.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage("❌ " + (err.message || "Signup failed."));
    }
  };

  return (
    <div className="auth-box">
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "1px solid #667eea",
            color: "#667eea",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%",
          }}
        >
          ← Back to Home
        </button>
      </div>

      <h2>Create Account</h2>

      {message && (
        <p
          style={{
            marginBottom: "10px",
            color: message.includes("✅") ? "#5cb85c" : "#d9534f",
          }}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          placeholder="Confirm Password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          style={{ marginTop: "6px", marginBottom: "12px" }}
        >
          {showPassword ? "Hide" : "Show"} Password
        </button>

        <button type="submit">Sign up</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
