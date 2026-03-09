import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fix Leaflet's broken default icon paths under CRA/webpack ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ── Custom icons ──
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hospitalIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fallbackIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Haversine distance in km
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
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Normalise hospital coords — NearbyFinder sends flat {lat, lon},
// Map's own list uses {coordinates: {lat, lng}}
function getCoords(h) {
  if (h?.coordinates?.lat != null)
    return { lat: h.coordinates.lat, lng: h.coordinates.lng };
  if (h?.lat != null) return { lat: h.lat, lng: h.lon ?? h.lng };
  return null;
}

// Sub-component: re-centers the map whenever the center prop changes
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Fits map bounds to show both user and hospital
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

// Fetch fastest road route using public OSRM API
async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM request failed");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length)
    throw new Error("No route found");
  const route = data.routes[0];
  // GeoJSON coords are [lng, lat] — reverse to [lat, lng] for Leaflet
  const polyline = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);
  return { polyline, distanceKm, durationMin };
}

// ─────────────────────────────────────────────────────────────────────────────
// FOCUSED VIEW — shown when "View on Map" is clicked from NearbyFinder
// Shows ONLY the selected hospital and the best road route to it
// ─────────────────────────────────────────────────────────────────────────────
function FocusedHospitalMap({ hospital }) {
  const navigate = useNavigate();
  const coords = getCoords(hospital);

  const [userPos, setUserPos] = useState(null);
  const [locError, setLocError] = useState("");
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [fitPositions, setFitPositions] = useState(null);
  const hospitalMarkerRef = useRef(null);

  // 1. Get user GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError(
        "Geolocation not supported — showing hospital location only.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError("Location permission denied — route cannot be drawn."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // 2. Fetch road route once we have user location AND hospital coords
  useEffect(() => {
    if (!userPos || !coords) return;
    setRouteLoading(true);
    setRouteError("");
    fetchRoute(userPos, coords)
      .then(({ polyline, distanceKm, durationMin }) => {
        setRoutePoints(polyline);
        setRouteInfo({ distanceKm, durationMin });
        setFitPositions([
          [userPos.lat, userPos.lng],
          [coords.lat, coords.lng],
        ]);
      })
      .catch(() => {
        setRouteError("Could not load road route. Showing straight-line path.");
        setRoutePoints([
          [userPos.lat, userPos.lng],
          [coords.lat, coords.lng],
        ]);
        const dist = getDistance(
          userPos.lat,
          userPos.lng,
          coords.lat,
          coords.lng,
        );
        setRouteInfo({
          distanceKm: dist.toFixed(1),
          durationMin: Math.round((dist / 30) * 60),
        });
        setFitPositions([
          [userPos.lat, userPos.lng],
          [coords.lat, coords.lng],
        ]);
      })
      .finally(() => setRouteLoading(false));
  }, [userPos]); // eslint-disable-line

  // 3. Auto-open popup on the hospital marker once the map is ready
  const onHospitalRef = useCallback((el) => {
    if (el) {
      hospitalMarkerRef.current = el;
      setTimeout(() => el.openPopup(), 700);
    }
  }, []);

  if (!coords) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#c0392b" }}>
        ⚠ Hospital coordinates are not available.
      </div>
    );
  }

  const formatDuration = (min) =>
    min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;

  return (
    <div style={{ padding: "20px 24px", fontFamily: "inherit" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1.5px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, color: "#1a3c5e", fontSize: 20 }}>
            {hospital.name}
          </h2>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: 13 }}>
            {hospital.address}
            {hospital.phone && (
              <>
                {" "}
                &nbsp;·&nbsp;
                <a href={`tel:${hospital.phone}`} style={{ color: "#2a9d8f" }}>
                  {hospital.phone}
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Route info cards */}
      {routeInfo && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              icon: "🛣️",
              label: "ROAD DISTANCE",
              value: `${routeInfo.distanceKm} km`,
              bg: "linear-gradient(135deg,#0d9488,#0f766e)",
            },
            {
              icon: "⏱️",
              label: "ESTIMATED TIME",
              value: formatDuration(routeInfo.durationMin),
              bg: "linear-gradient(135deg,#2563eb,#1d4ed8)",
            },
            {
              icon: "🚗",
              label: "FASTEST ROUTE",
              value: "Via road network",
              bg: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            },
          ].map(({ icon, label, value, bg }) => (
            <div
              key={label}
              style={{
                flex: "1 1 160px",
                background: bg,
                borderRadius: 12,
                padding: "14px 20px",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.85,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {routeLoading && (
        <p style={{ color: "#2a9d8f", marginBottom: 10, fontSize: 13 }}>
          🔄 Calculating fastest road route…
        </p>
      )}
      {locError && (
        <p
          style={{
            color: "#b45309",
            background: "#fef3c7",
            padding: "8px 14px",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          ⚠ {locError}
        </p>
      )}
      {routeError && (
        <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 10 }}>
          ℹ {routeError}
        </p>
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
          marginBottom: 20,
        }}
      >
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={14}
          style={{ width: "100%", height: "500px" }}
          scrollWheelZoom
        >
          {fitPositions && <FitBounds positions={fitPositions} />}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location */}
          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup>
                <strong>📍 Your Location</strong>
              </Popup>
            </Marker>
          )}

          {/* Hospital marker — auto-opens popup */}
          <Marker
            position={[coords.lat, coords.lng]}
            icon={hospitalIcon}
            ref={onHospitalRef}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong style={{ fontSize: 14, color: "#1a3c5e" }}>
                  {hospital.name}
                </strong>
                <p style={{ margin: "6px 0 3px", fontSize: 12, color: "#555" }}>
                  {hospital.address}
                </p>
                {hospital.phone && (
                  <p style={{ margin: "3px 0", fontSize: 12 }}>
                    📞{" "}
                    <a
                      href={`tel:${hospital.phone}`}
                      style={{ color: "#2a9d8f" }}
                    >
                      {hospital.phone}
                    </a>
                  </p>
                )}
                {hospital.type && (
                  <p style={{ margin: "3px 0", fontSize: 12, color: "#888" }}>
                    🏥 {hospital.type}
                  </p>
                )}
                {hospital.rating && (
                  <p style={{ margin: "3px 0", fontSize: 12 }}>
                    ⭐ {hospital.rating}
                  </p>
                )}
                {routeInfo && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0d9488",
                    }}
                  >
                    🛣️ {routeInfo.distanceKm} km &nbsp;·&nbsp; ⏱️{" "}
                    {formatDuration(routeInfo.durationMin)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Road route polyline */}
          {routePoints && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
                opacity: 0.85,
                lineJoin: "round",
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Detail card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "18px 22px",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          border: "1.5px solid #e5e7eb",
        }}
      >
        <h3 style={{ margin: "0 0 12px", color: "#1a3c5e" }}>
          {hospital.name}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 10,
          }}
        >
          {[
            hospital.address && {
              label: "📍 Address",
              value: hospital.address,
            },
            hospital.phone && {
              label: "📞 Phone",
              value: hospital.phone,
              href: `tel:${hospital.phone}`,
            },
            hospital.type && { label: "🏥 Type", value: hospital.type },
            hospital.rating && {
              label: "⭐ Rating",
              value: `${hospital.rating} / 5`,
            },
          ]
            .filter(Boolean)
            .map(({ label, value, href }) => (
              <p key={label} style={{ margin: 0, fontSize: 13, color: "#555" }}>
                <span style={{ fontWeight: 600 }}>{label}:</span>
                <br />
                {href ? (
                  <a href={href} style={{ color: "#2a9d8f" }}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </p>
            ))}
        </div>
        {hospital.specialties?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 13 }}>
              Specialties:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {hospital.specialties.map((s) => (
                <span
                  key={s}
                  style={{
                    background: "#e0f2fe",
                    color: "#0369a1",
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospital.name + (hospital.address ? ", " + hospital.address : ""))}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              background: "#4285F4",
              color: "#fff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            🗺️ Open Turn-by-Turn in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Map() {
  const routeLocation = useLocation();
  const focusHospital = routeLocation.state?.hospital || null;
  const navigate = useNavigate();

  // ── If we arrived via "View on Map" → show focused route view ──────────────
  if (focusHospital) {
    return <FocusedHospitalMap hospital={focusHospital} />;
  }

  // ── Otherwise render the full overview map ──────────────────────────────────
  return <AllHospitalsMap navigate={navigate} />;
}

// ── Overview component (used when navigating directly to /map) ───────────────
function AllHospitalsMap({ navigate }) {
  const [userPos, setUserPos] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [allSorted, setAllSorted] = useState([]);
  const [radius, setRadius] = useState(50);
  const [error, setError] = useState("");
  const [locLoading, setLocLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const markerRefs = useRef({});
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  // 1. Get user GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setMapCenter([p.lat, p.lng]);
        setMapZoom(12);
        setLocLoading(false);
      },
      () => {
        setError("Location permission denied. Showing all hospitals.");
        setLocLoading(false);
      },
    );
  }, []);

  // 2. Fetch hospitals
  useEffect(() => {
    fetch(`${BASE_URL}/api/hospitals`)
      .then((r) => r.json())
      .then(setHospitals)
      .catch(() => setError("Could not load hospital data."));
  }, []);

  // 3. Sort by distance
  useEffect(() => {
    const withCoords = hospitals.filter(
      (h) => h.coordinates?.lat && h.coordinates?.lng,
    );
    if (!userPos) {
      setAllSorted(withCoords);
      return;
    }
    setAllSorted(
      withCoords
        .map((h) => ({
          ...h,
          distance: getDistance(
            userPos.lat,
            userPos.lng,
            h.coordinates.lat,
            h.coordinates.lng,
          ),
        }))
        .sort((a, b) => a.distance - b.distance),
    );
  }, [userPos, hospitals]);

  const focusMarker = (h) => {
    const c = getCoords(h);
    if (!c) return;
    setSelectedId(h.id);
    setMapCenter([c.lat, c.lng]);
    setMapZoom(15);
  };

  const viewRoute = (h) => {
    const c = getCoords(h);
    navigate("/map", {
      state: { hospital: { ...h, lat: c?.lat, lon: c?.lng } },
    });
  };

  const inRadius = userPos
    ? allSorted.filter((h) => h.distance <= radius)
    : allSorted;
  const outsideRadius = userPos
    ? allSorted.filter((h) => h.distance > radius).slice(0, 20)
    : [];

  return (
    <div style={{ padding: "20px 24px", fontFamily: "inherit" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1a3c5e" }}>Nearby Hospitals Map</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
          Click a card to focus it on the map, or click{" "}
          <strong>View Route</strong> for turn-by-turn directions.
        </p>
      </div>

      {userPos && (
        <div
          style={{
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontWeight: 600, color: "#333", fontSize: 13 }}>
            Search radius:
          </label>
          {[5, 10, 20, 50, 100].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                cursor: "pointer",
                borderColor: radius === r ? "#2a9d8f" : "#ccc",
                background: radius === r ? "#2a9d8f" : "#fff",
                color: radius === r ? "#fff" : "#333",
                fontWeight: radius === r ? 600 : 400,
                fontSize: 13,
              }}
            >
              {r} km
            </button>
          ))}
        </div>
      )}

      {error && (
        <p
          style={{
            color: "#c0392b",
            background: "#fdecea",
            padding: "8px 14px",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          ⚠ {error}
        </p>
      )}
      {locLoading && (
        <p style={{ color: "#555", marginBottom: 12 }}>
          📍 Getting your location…
        </p>
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
          marginBottom: 24,
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: "100%", height: "480px" }}
          scrollWheelZoom
        >
          <RecenterMap center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userPos && (
            <>
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={radius * 1000}
                pathOptions={{
                  color: "#2a9d8f",
                  fillColor: "#2a9d8f",
                  fillOpacity: 0.08,
                  weight: 1.5,
                }}
              />
              <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                <Popup>
                  <strong>📍 You are here</strong>
                </Popup>
              </Marker>
            </>
          )}

          {outsideRadius.map((h) => {
            const c = getCoords(h);
            if (!c) return null;
            return (
              <Marker
                key={`out-${h.id}`}
                position={[c.lat, c.lng]}
                icon={fallbackIcon}
                eventHandlers={{ click: () => setSelectedId(h.id) }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong style={{ fontSize: 14, color: "#345" }}>
                      {h.name}
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#888" }}>
                      {h.address}
                    </p>
                    {h.phone && (
                      <p style={{ margin: "2px 0", fontSize: 12 }}>
                        📞 {h.phone}
                      </p>
                    )}
                    {h.distance != null && (
                      <p
                        style={{
                          margin: "4px 0 6px",
                          fontSize: 12,
                          color: "#888",
                          fontWeight: 600,
                        }}
                      >
                        📏 {h.distance.toFixed(1)} km away
                      </p>
                    )}
                    <button
                      onClick={() => viewRoute(h)}
                      style={{
                        padding: "5px 12px",
                        background: "#e07b39",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      🗺️ View Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {inRadius.map((h) => {
            const c = getCoords(h);
            if (!c) return null;
            return (
              <Marker
                key={`in-${h.id}`}
                position={[c.lat, c.lng]}
                icon={hospitalIcon}
                ref={(el) => {
                  if (el) markerRefs.current[h.id] = el;
                }}
                eventHandlers={{ click: () => setSelectedId(h.id) }}
              >
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <strong style={{ fontSize: 14, color: "#1a3c5e" }}>
                      {h.name}
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
                      {h.address}
                    </p>
                    {h.phone && (
                      <p style={{ margin: "2px 0", fontSize: 12 }}>
                        📞 {h.phone}
                      </p>
                    )}
                    {h.rating && (
                      <p style={{ margin: "2px 0", fontSize: 12 }}>
                        ⭐ {h.rating} · {h.type}
                      </p>
                    )}
                    {h.distance != null && (
                      <p
                        style={{
                          margin: "4px 0 6px",
                          fontSize: 12,
                          color: "#2a9d8f",
                          fontWeight: 600,
                        }}
                      >
                        📏 {h.distance.toFixed(1)} km away
                      </p>
                    )}
                    <button
                      onClick={() => viewRoute(h)}
                      style={{
                        padding: "5px 12px",
                        background: "#2a9d8f",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      🗺️ View Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Hospital List */}
      <h3 style={{ color: "#1a3c5e", marginBottom: 4 }}>
        {userPos
          ? `${inRadius.length} hospital${inRadius.length !== 1 ? "s" : ""} within ${radius} km`
          : `${allSorted.length} hospitals`}
      </h3>
      {userPos && (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>
          🔴 Red pins = within radius &nbsp;·&nbsp; 🟠 Orange pins = nearest
          outside radius
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 12,
        }}
      >
        {inRadius.map((h) => {
          return (
            <div
              key={`in-${h.id}`}
              onClick={() => focusMarker(h)}
              style={{
                background: selectedId === h.id ? "#e8f8f5" : "#fff",
                border: `1.5px solid ${selectedId === h.id ? "#2a9d8f" : "#e0e0e0"}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                boxShadow:
                  selectedId === h.id
                    ? "0 0 0 2px #2a9d8f33"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <strong
                  style={{ fontSize: 14, color: "#1a3c5e", lineHeight: 1.3 }}
                >
                  {h.name}
                </strong>
                {h.distance != null && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#2a9d8f",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {h.distance.toFixed(1)} km
                  </span>
                )}
              </div>
              <p style={{ margin: "4px 0 6px", fontSize: 12, color: "#777" }}>
                {h.address}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    background: "#f0f4f8",
                    borderRadius: 10,
                    padding: "2px 8px",
                    color: "#555",
                  }}
                >
                  {h.type}
                </span>
                {h.rating && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#fff9e6",
                      borderRadius: 10,
                      padding: "2px 8px",
                      color: "#b7860b",
                    }}
                  >
                    ⭐ {h.rating}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewRoute(h);
                  }}
                  style={{
                    marginLeft: "auto",
                    padding: "4px 12px",
                    background: "#2a9d8f",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  View Route →
                </button>
              </div>
              {h.specialties?.length > 0 && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#888" }}>
                  {h.specialties.slice(0, 3).join(" · ")}
                  {h.specialties.length > 3 ? " …" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {outsideRadius.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: "#1a3c5e", marginBottom: 4 }}>
            Nearest hospitals beyond {radius} km
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>
            Showing the {outsideRadius.length} closest outside your selected
            radius
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 12,
            }}
          >
            {outsideRadius.map((h) => (
              <div
                key={`out-${h.id}`}
                onClick={() => focusMarker(h)}
                style={{
                  background: selectedId === h.id ? "#fff8f0" : "#fafafa",
                  border: `1.5px solid ${selectedId === h.id ? "#e07b39" : "#e8e8e8"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  boxShadow:
                    selectedId === h.id
                      ? "0 0 0 2px #e07b3933"
                      : "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <strong
                    style={{ fontSize: 14, color: "#2c3e50", lineHeight: 1.3 }}
                  >
                    {h.name}
                  </strong>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#e07b39",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    {h.distance.toFixed(1)} km
                  </span>
                </div>
                <p style={{ margin: "4px 0 6px", fontSize: 12, color: "#888" }}>
                  {h.address}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      background: "#f0f4f8",
                      borderRadius: 10,
                      padding: "2px 8px",
                      color: "#555",
                    }}
                  >
                    {h.type}
                  </span>
                  {h.rating && (
                    <span
                      style={{
                        fontSize: 11,
                        background: "#fff9e6",
                        borderRadius: 10,
                        padding: "2px 8px",
                        color: "#b7860b",
                      }}
                    >
                      ⭐ {h.rating}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewRoute(h);
                    }}
                    style={{
                      marginLeft: "auto",
                      padding: "4px 12px",
                      background: "#e07b39",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    View Route →
                  </button>
                </div>
                {h.specialties?.length > 0 && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#aaa" }}>
                    {h.specialties.slice(0, 3).join(" · ")}
                    {h.specialties.length > 3 ? " …" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
