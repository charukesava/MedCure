import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../services/api";

export default function NearbyFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  // Haversine distance
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  }

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setError("");
      },
      () => setError("Location permission denied"),
    );
  };

  const findNearby = async () => {
    try {
      setError("");
      setResults([]);
      setLoading(true);

      if (!query.trim()) {
        setError("Enter a city or location name.");
        setLoading(false);
        return;
      }

      // Use our internal hospitals API instead of Overpass API
      const response = await fetch(`${BASE_URL}/api/hospitals`);
      if (!response.ok) {
        throw new Error("Failed to fetch hospitals");
      }

      const allHospitals = await response.json();

      // Filter hospitals by query (city name)
      const filtered = allHospitals.filter(
        (h) =>
          h.city.toLowerCase().includes(query.toLowerCase()) ||
          h.name.toLowerCase().includes(query.toLowerCase()),
      );

      if (filtered.length === 0) {
        setError(
          `No hospitals found in "${query}". Try another city like Hyderabad, Mumbai, Delhi, etc.`,
        );
        setLoading(false);
        return;
      }

      // Get user coordinates to calculate distance if available
      let userLat = userLocation?.lat;
      let userLon = userLocation?.lon;

      // Try to get user location for distance calculation
      if (!userLocation) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query,
            )}`,
          );
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            userLat = parseFloat(geoData[0].lat);
            userLon = parseFloat(geoData[0].lon);
          }
        } catch (err) {
          console.log("Could not get coordinates for distance calculation");
        }
      }

      // Map hospitals with distance if coordinates available
      const mapped = filtered.map((hospital) => {
        let distance = "N/A";

        if (userLat && userLon && hospital.coordinates) {
          distance = getDistance(
            userLat,
            userLon,
            hospital.coordinates.lat,
            hospital.coordinates.lng,
          );
        }

        return {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          address: hospital.address,
          phone: hospital.phone,
          city: hospital.city,
          rating: hospital.rating,
          reviews: hospital.reviews,
          specialties: hospital.specialties,
          lat: hospital.coordinates?.lat,
          lon: hospital.coordinates?.lng,
          distance,
        };
      });

      // Sort by distance if available
      mapped.sort((a, b) => {
        if (a.distance === "N/A" || b.distance === "N/A") return 0;
        return parseFloat(a.distance) - parseFloat(b.distance);
      });

      setResults(mapped);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error fetching hospitals. Please try again later.");
      setLoading(false);
    }
  };

  const openMap = (item) => {
    navigate("/map", { state: { hospital: item } });
  };

  // Loading Spinner Component
  const Spinner = () => (
    <div style={{ textAlign: "center", margin: "30px 0" }}>
      <div
        style={{
          display: "inline-block",
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #667eea",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ marginTop: "15px", color: "#667eea", fontWeight: "600" }}>
        🔍 Searching nearby hospitals and clinics...
      </p>
    </div>
  );

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🏥 Nearby Finder</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Find hospitals, clinics, and pharmacies near you
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={getMyLocation}
          style={{
            padding: "10px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          📍 Use My Location
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Enter city or area name (e.g., Hyderabad, Mumbai)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && findNearby()}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "14px",
          }}
          disabled={loading}
        />
        <button
          onClick={findNearby}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: loading ? "#ccc" : "#667eea",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
        >
          {loading ? "🔍 Searching..." : "Search"}
        </button>
      </div>

      {/* Loading State */}
      {loading && <Spinner />}

      {/* Error State */}
      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2
            style={{ color: "#333", marginBottom: "15px", marginTop: "20px" }}
          >
            Found {results.length} facility{results.length !== 1 ? "ies" : ""}
          </h2>
          {results.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "12px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      marginTop: 0,
                      color: "#667eea",
                      marginBottom: "8px",
                    }}
                  >
                    {item.name}
                  </h3>
                </div>
                {item.rating && (
                  <div
                    style={{
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      marginLeft: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px", color: "#ffc107" }}>
                      {"⭐".repeat(Math.floor(item.rating))}
                    </span>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      {item.rating} ({item.reviews} reviews)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ color: "#666", fontSize: "14px" }}>
                <p style={{ marginBottom: "6px" }}>
                  <strong>Type:</strong> {item.type}
                </p>
                <p style={{ marginBottom: "6px" }}>
                  <strong>📍 Address:</strong> {item.address}
                </p>
                <p style={{ marginBottom: "6px" }}>
                  <strong>City:</strong> {item.city}
                </p>
                <p style={{ marginBottom: "6px" }}>
                  <strong>📞 Phone:</strong> {item.phone}
                </p>
                <p style={{ marginBottom: "12px" }}>
                  <strong>📏 Distance:</strong>{" "}
                  {item.distance !== "N/A"
                    ? `${item.distance} km`
                    : "Enable location to see distance"}
                </p>
                {item.specialties && item.specialties.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Specialties:</strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      {item.specialties.slice(0, 4).map((spec) => (
                        <span
                          key={spec}
                          style={{
                            backgroundColor: "#e8f0fe",
                            color: "#667eea",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                      {item.specialties.length > 4 && (
                        <span
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            padding: "4px 0",
                          }}
                        >
                          +{item.specialties.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => openMap(item)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                🗺️ View on Map
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !error && !loading && (
        <div
          style={{
            backgroundColor: "#e7f3ff",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            color: "#0066cc",
          }}
        >
          <p style={{ margin: 0 }}>
            🔍 Search for a location to find nearby hospitals and clinics.
          </p>
          <p style={{ margin: "8px 0 0 0", fontSize: "13px" }}>
            Enter a city name and click Search
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
