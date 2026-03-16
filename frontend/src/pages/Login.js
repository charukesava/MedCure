import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (!captchaVerified) {
      setMessage("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      await login(email, password);
      setMessage("Login successful.");
      navigate("/home");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setMessage("No account found. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        setMessage("Incorrect password.");
      } else if (error.code === "auth/email-not-verified") {
        setMessage("Please verify your email before logging in.");
      } else {
        setMessage(error.message || "Login failed. Try again.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setGoogleLoading(true);
    try {
      await googleLogin();
      navigate("/home");
    } catch (error) {
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        // user closed the popup — not an error worth showing
      } else if (error.code === "auth/popup-blocked") {
        setMessage(
          "Popup was blocked by your browser. Please allow popups for this site and try again.",
        );
      } else {
        setMessage(error.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage("");

    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(
        "Password reset email sent! Check your inbox and follow the instructions.",
      );
      setResetEmail("");
      setTimeout(() => {
        setShowForgotPassword(false);
      }, 2000);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setResetMessage("No account found with this email.");
      } else {
        setResetMessage(error.message || "Failed to send reset email.");
      }
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
          Back to Home
        </button>
      </div>

      <h2>AI Health Assistant</h2>

      {message && (
        <p style={{ marginBottom: "10px", color: "#d9534f" }}>{message}</p>
      )}

      {!showForgotPassword ? (
        <>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              onChange={() => setCaptchaVerified(true)}
              onExpired={() => setCaptchaVerified(false)}
              style={{ marginBottom: "10px" }}
            />
            <button type="submit" disabled={!captchaVerified}>Login</button>
          </form>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              marginTop: "10px",
              opacity: googleLoading ? 0.7 : 1,
              cursor: googleLoading ? "not-allowed" : "pointer",
            }}
          >
            {googleLoading ? "Signing in..." : "Login with Google"}
          </button>

          <p style={{ marginTop: "10px" }}>
            Don't have an account? <a href="/signup">Sign up</a>
          </p>

          <p style={{ marginTop: "15px", textAlign: "center" }}>
            <button
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              Forgot your password?
            </button>
          </p>
        </>
      ) : (
        <>
          <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
            Reset Your Password
          </h3>

          {resetMessage && (
            <p
              style={{
                marginBottom: "10px",
                color: resetMessage.includes("sent") ? "#5cb85c" : "#d9534f",
              }}
            >
              {resetMessage}
            </p>
          )}

          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />

            <button type="submit">Send Reset Email</button>
          </form>

          <p style={{ marginTop: "15px", textAlign: "center" }}>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail("");
                setResetMessage("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              Back to Login
            </button>
          </p>
        </>
      )}
    </div>
  );
}
