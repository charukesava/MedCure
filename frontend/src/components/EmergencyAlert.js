import { postData } from "../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function EmergencyAlert() {
  const send = async () => {
    try {
      await postData(`${BASE_URL}/api/emergency`, { msg: "Help needed" });
      alert("Emergency alert sent (mock)");
    } catch (e) {
      console.error(e);
      alert("Failed to send emergency alert");
    }
  };

  return (
    <button onClick={send} style={{ padding: "8px 16px" }}>
      🚨 Emergency Alert
    </button>
  );
}
