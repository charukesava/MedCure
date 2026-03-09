import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/PageWrapper.css";

export default function Settings() {
  const { user, changeEmail, changePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("email");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");

  // Phone number state (stored in local storage or firestore in real app)
  const [phoneNumber, setPhoneNumber] = useState(
    localStorage.getItem("userPhoneNumber") || "",
  );
  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!newEmail || !currentPassword) {
      setMessage("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (newEmail === user.email) {
      setMessage("New email must be different from current email.");
      setLoading(false);
      return;
    }

    try {
      await changeEmail(currentPassword, newEmail);
      setMessage("Email updated successfully. Please verify your new email.");
      setNewEmail("");
      setCurrentPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setMessage("Incorrect password.");
      } else if (error.code === "auth/email-already-in-use") {
        setMessage("This email is already in use.");
      } else {
        setMessage(error.message || "Failed to update email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!newPhoneNumber) {
      setMessage("Please enter a valid phone number.");
      return;
    }

    try {
      // Store phone number in local storage (in production, use Firestore)
      localStorage.setItem("userPhoneNumber", newPhoneNumber);
      setPhoneNumber(newPhoneNumber);
      setMessage("Phone number updated successfully.");
      setNewPhoneNumber("");
    } catch (error) {
      setMessage("Failed to update phone number.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!newPassword || !confirmPassword || !currentPassword) {
      setMessage("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setMessage("Incorrect current password.");
      } else {
        setMessage(error.message || "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <button
          onClick={() => navigate("/home")}
          style={{
            background: "transparent",
            border: "1px solid #667eea",
            color: "#667eea",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          Back to Home
        </button>

        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          Account Settings
        </h2>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            borderBottom: "2px solid #e9ecef",
            paddingBottom: "10px",
          }}
        >
          <button
            onClick={() => setActiveTab("email")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "email" ? "#667eea" : "transparent",
              color: activeTab === "email" ? "white" : "#667eea",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
          >
            Email
          </button>

          <button
            onClick={() => setActiveTab("phone")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "phone" ? "#667eea" : "transparent",
              color: activeTab === "phone" ? "white" : "#667eea",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
          >
            Phone
          </button>

          <button
            onClick={() => setActiveTab("password")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "password" ? "#667eea" : "transparent",
              color: activeTab === "password" ? "white" : "#667eea",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
          >
            Password
          </button>
        </div>

        {message && (
          <p
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "5px",
              backgroundColor: message.includes("successfully")
                ? "#d4edda"
                : "#f8d7da",
              color: message.includes("successfully") ? "#155724" : "#721c24",
              border: "1px solid",
              borderColor: message.includes("successfully")
                ? "#c3e6cb"
                : "#f5c6cb",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailChange}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Current Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f5f5f5",
                  opacity: 0.7,
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                New Email
              </label>
              <input
                type="email"
                placeholder="Enter new email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating..." : "Update Email"}
            </button>
          </form>
        )}

        {/* Phone Tab */}
        {activeTab === "phone" && (
          <form onSubmit={handlePhoneChange}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Current Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                disabled
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f5f5f5",
                  opacity: 0.7,
                }}
              />
              {!phoneNumber && (
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  No phone number set yet
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                New Phone Number
              </label>
              <input
                type="tel"
                placeholder="Enter phone number (e.g., +91-XXXXXXXXXX)"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Update Phone Number
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
