import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter email and password.");
      return;
    }
    if (!captchaVerified) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      await login(username, password);
      navigate("/admin");
    } catch (err) {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Login</h1>

      <form onSubmit={handleLogin} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}

        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={() => setCaptchaVerified(true)}
          onExpired={() => setCaptchaVerified(false)}
          style={{ marginBottom: "10px" }}
        />
        <button type="submit" disabled={!captchaVerified}>Login</button>
      </form>
    </div>
  );
}
