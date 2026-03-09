const express = require("express");
const router = express.Router();
const hospitals = require("../data/hospitals");

// ─── Precompute indexes at module load — O(n) once, O(1) per request ───
// Map<id, hospital>
const byId = new Map(hospitals.map((h) => [h.id, h]));

// Map<city_lowercase, hospital[]>
const byCity = new Map();
for (const h of hospitals) {
  const key = h.city.toLowerCase();
  if (!byCity.has(key)) byCity.set(key, []);
  byCity.get(key).push(h);
}
// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/", (req, res) => {
  res.json(hospitals);
});

/**
 * GET /api/hospitals/nearby?lat=X&lng=Y&radius=R
 * Returns hospitals from the local database within `radius` km (default 10 km).
 * Results are sorted by distance and include a `distanceKm` field.
 */
router.get("/nearby", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 10;

  if (isNaN(lat) || isNaN(lng)) {
    return res
      .status(400)
      .json({ error: "lat and lng query params are required" });
  }

  const nearby = hospitals
    .map((h) => ({
      ...h,
      distanceKm: haversineKm(lat, lng, h.coordinates.lat, h.coordinates.lng),
    }))
    .filter((h) => h.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(nearby);
});

/**
 * GET /api/hospitals/search?q=query  ← MUST be before /:id
 * Search hospitals by name, city, or specialty — O(n) scan is unavoidable here
 */
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(hospitals);

  const searchTerm = q.toLowerCase();
  const results = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm) ||
      h.city.toLowerCase().includes(searchTerm) ||
      h.specialties.some((s) => s.toLowerCase().includes(searchTerm)),
  );
  res.json(results);
});

/**
 * GET /api/hospitals/city/:city — O(1) via precomputed byCity Map
 */
router.get("/city/:city", (req, res) => {
  const key = req.params.city.toLowerCase();
  const cityHospitals = byCity.get(key) || [];
  res.json(cityHospitals);
});

/**
 * GET /api/hospitals/:id — O(1) via precomputed byId Map
 */
router.get("/:id", (req, res) => {
  const hospital = byId.get(parseInt(req.params.id));
  if (!hospital) return res.status(404).json({ error: "Hospital not found" });
  res.json(hospital);
});

module.exports = router;
