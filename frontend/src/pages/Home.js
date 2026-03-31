import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../services/api";

function Home() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/hospital-updates`);
        const data = await res.json();

        // ✅ FIX: Ensure data is always an array
        if (Array.isArray(data)) {
          setUpdates(data);
        } else {
          console.error("Invalid API response:", data);
          setUpdates([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setUpdates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="page fade-in">
      <h1>Welcome to AI Health Assistant</h1>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        Latest hospital updates and health information from across India.
      </p>

      {/* ── Doctor AI Agent Feature Card ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "32px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 30px rgba(13, 148, 136, 0.35)",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🩺</span>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
              Dr. HealthAI — Your AI Doctor
            </h2>
          </div>
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              maxWidth: "520px",
              lineHeight: 1.6,
            }}
          >
            Get a professional medical consultation powered by AI. Describe your
            symptoms and receive a thorough assessment — including causes,
            treatments, diet tips, and when to see a specialist.
          </p>

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {[
              "Symptoms Analysis",
              "Disease Causes",
              "Treatments & Cures",
              "Diet Advice",
            ].map((tag) => (
              <span
                key={tag}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  padding: "3px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/doctor-agent")}
          style={{
            background: "white",
            color: "#0d9488",
            border: "none",
            borderRadius: "12px",
            padding: "12px 28px",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Consult Dr. HealthAI →
        </button>
      </div>

      {/* Hospital Updates */}
      <section>
        <h2>🏥 Hospital Updates (India)</h2>

        {loading && <p>Loading updates...</p>}

        {!loading && (!Array.isArray(updates) || updates.length === 0) && (
          <p>No hospital updates available at the moment.</p>
        )}

        {/* ✅ FIX: Safe rendering */}
        {Array.isArray(updates) &&
          updates.map((item) => (
            <div
              key={item._id || item.id}
              className="feedback-card slide-in-up"
              style={{ marginTop: "18px", padding: "20px 28px" }}
            >
              <strong>{item.title}</strong>
              <p>{item.description}</p>

              <p style={{ marginTop: "5px", fontSize: "14px" }}>
                🏥 <strong>{item.hospitalName}</strong>
                <br />
                📍 {item.location}
              </p>

              <small style={{ color: "#777" }}>
                Date: {item.date || "N/A"}
              </small>
            </div>
          ))}
      </section>
    </div>
  );
}

export default Home;