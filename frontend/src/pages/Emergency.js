import { useEffect, useState } from "react";
import Header from "../components/Header";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Emergency() {
  const [location, setLocation] = useState(null);
  const [dbHospitals, setDbHospitals] = useState([]);
  const [osmHospitals, setOsmHospitals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });

        // ── 1. Fetch from our enriched local database ──────────────────────
        try {
          const res = await fetch(
            `${API_BASE}/api/hospitals/nearby?lat=${lat}&lng=${lon}&radius=15`,
          );
          const data = await res.json();
          setDbHospitals(Array.isArray(data) ? data : []);
        } catch {
          // fallback silently — OSM results still shown
        }

        // ── 2. Fetch from OpenStreetMap Overpass (live local data) ─────────
        const query = `
          [out:json];
          node["amenity"="hospital"](around:3000,${lat},${lon});
          out;
        `;
        try {
          const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
          });
          const data = await res.json();
          setOsmHospitals(data.elements || []);
        } catch {
          setError("Failed to load live nearby hospitals.");
        }

        setLoading(false);
      },
      () => {
        setError("Location permission denied.");
        setLoading(false);
      },
    );
  }, []);

  const styles = {
    container: { padding: "30px", maxWidth: "900px", margin: "0 auto" },
    card: {
      border: "1px solid #e2e8f0",
      padding: "16px 20px",
      borderRadius: "10px",
      marginBottom: "14px",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    hospitalName: { margin: "0 0 6px", fontSize: "1.05rem", color: "#1a202c" },
    detail: { margin: "3px 0", fontSize: "0.9rem", color: "#4a5568" },
    badge: {
      display: "inline-block",
      background: "#e6fffa",
      color: "#276749",
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "0.75rem",
      marginRight: "6px",
      fontWeight: 600,
    },
    emailLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "8px",
      padding: "6px 14px",
      borderRadius: "6px",
      background: "#0d9488",
      color: "#fff",
      textDecoration: "none",
      fontSize: "0.85rem",
      fontWeight: 600,
    },
    sectionTitle: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#0d9488",
      margin: "24px 0 10px",
      borderBottom: "2px solid #e6fffa",
      paddingBottom: "6px",
    },
    distanceBadge: {
      fontSize: "0.78rem",
      background: "#ebf8ff",
      color: "#2b6cb0",
      borderRadius: "4px",
      padding: "2px 8px",
      fontWeight: 600,
      marginLeft: "8px",
    },
  };

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={{ color: "#1a202c" }}>Emergency Nearby Hospitals</h1>

        {error && <p style={{ color: "#e53e3e", fontWeight: 500 }}>{error}</p>}

        {loading && !location && (
          <p style={{ color: "#718096" }}>
            📍 Fetching your location and nearby hospitals…
          </p>
        )}

        {location && (
          <div
            style={{
              background: "#f0fff4",
              border: "1px solid #c6f6d5",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
            }}
          >
            <strong style={{ color: "#276749" }}>📍 Your Location</strong>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.9rem",
                color: "#4a5568",
              }}
            >
              Lat: {location.lat.toFixed(6)} &nbsp;|&nbsp; Lng:{" "}
              {location.lon.toFixed(6)}
            </p>
          </div>
        )}

        {/* ─── Database Hospitals (enriched, with email) ─── */}
        {dbHospitals.length > 0 && (
          <>
            <div style={styles.sectionTitle}>
              🏥 Hospitals Near You (within 15 km)
            </div>
            {dbHospitals.map((h) => (
              <div key={h.id} style={styles.card}>
                <h3 style={styles.hospitalName}>
                  {h.name}
                  <span style={styles.distanceBadge}>
                    {h.distanceKm.toFixed(1)} km away
                  </span>
                </h3>
                <p style={styles.detail}>📍 {h.address}</p>
                {h.phone && (
                  <p style={styles.detail}>
                    📞{" "}
                    <a href={`tel:${h.phone}`} style={{ color: "#2b6cb0" }}>
                      {h.phone}
                    </a>
                  </p>
                )}
                <div style={{ marginTop: "6px" }}>
                  {h.specialties?.map((s) => (
                    <span key={s} style={styles.badge}>
                      {s}
                    </span>
                  ))}
                </div>
                {h.email && (
                  <a
                    href={`mailto:${h.email}?subject=Appointment Request - ${h.name}&body=Dear ${h.name} Team,%0A%0AI would like to request an appointment. Please let me know the available slots.%0A%0AThank you.`}
                    style={styles.emailLink}
                  >
                    ✉ Email for Appointment
                  </a>
                )}
              </div>
            ))}
          </>
        )}

        {/* ─── Live OSM Hospitals (within 3 km, raw OSM data) ─── */}
        {osmHospitals.length > 0 && (
          <>
            <div style={styles.sectionTitle}>
              🔍 Additional Hospitals within 3 km (Live)
            </div>
            {osmHospitals
              .filter(
                (h) =>
                  h.tags?.name &&
                  !dbHospitals.some(
                    (d) =>
                      d.name
                        .toLowerCase()
                        .includes(h.tags.name.toLowerCase()) ||
                      h.tags.name
                        .toLowerCase()
                        .includes(d.name.toLowerCase().split(" ")[0]),
                  ),
              )
              .map((h, i) => (
                <div key={h.id || i} style={styles.card}>
                  <h3 style={styles.hospitalName}>
                    {h.tags?.name || "Unnamed Hospital"}
                  </h3>
                  <p style={styles.detail}>
                    📍{" "}
                    {h.tags?.["addr:full"] ||
                      h.tags?.["addr:street"] ||
                      "Address not available"}
                  </p>
                  {(h.tags?.phone || h.tags?.["contact:phone"]) && (
                    <p style={styles.detail}>
                      📞{" "}
                      <a
                        href={`tel:${h.tags?.phone || h.tags?.["contact:phone"]}`}
                        style={{ color: "#2b6cb0" }}
                      >
                        {h.tags?.phone || h.tags?.["contact:phone"]}
                      </a>
                    </p>
                  )}
                  {(h.tags?.email || h.tags?.["contact:email"]) && (
                    <a
                      href={`mailto:${h.tags?.email || h.tags?.["contact:email"]}?subject=Appointment Request - ${h.tags?.name}&body=Dear Team,%0A%0AI would like to request an appointment. Please let me know available slots.%0A%0AThank you.`}
                      style={styles.emailLink}
                    >
                      ✉ Email for Appointment
                    </a>
                  )}
                </div>
              ))}
          </>
        )}

        {!loading &&
          dbHospitals.length === 0 &&
          osmHospitals.length === 0 &&
          location && (
            <p style={{ color: "#718096" }}>
              No hospitals found in your area. Try expanding the search radius.
            </p>
          )}
      </div>
    </>
  );
}

export default Emergency;
