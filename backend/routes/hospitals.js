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
  try {
    res.json(hospitals);
  } catch (err) {
    console.error("[Hospitals GET / Error]", err.message);
    res.status(500).json({ error: "Failed to fetch hospitals" });
  }
});

/**
 * GET /api/hospitals/nearby?lat=X&lng=Y&radius=R
 * Returns hospitals from the local database within `radius` km (default 10 km).
 * Results are sorted by distance and include a `distanceKm` field.
 */
router.get("/nearby", (req, res) => {
  try {
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
  } catch (err) {
    console.error("[Hospitals Nearby Error]", err.message);
    res.status(500).json({ error: "Failed to fetch nearby hospitals" });
  }
});

/**
 * GET /api/hospitals/search?q=query  ← MUST be before /:id
 * Search hospitals by name, city, or specialty — O(n) scan is unavoidable here
 */
router.get("/search", (req, res) => {
  try {
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
  } catch (err) {
    console.error("[Hospitals Search Error]", err.message);
    res.status(500).json({ error: "Failed to search hospitals" });
  }
});

/**
 * GET /api/hospitals/city/:city — O(1) via precomputed byCity Map
 */
router.get("/city/:city", (req, res) => {
  try {
    const key = req.params.city.toLowerCase();
    const cityHospitals = byCity.get(key) || [];
    res.json(cityHospitals);
  } catch (err) {
    console.error("[Hospitals City Error]", err.message);
    res.status(500).json({ error: "Failed to fetch hospitals by city" });
  }
});

/**
 * GET /api/hospitals/:id — O(1) via precomputed byId Map
 */
router.get("/:id", (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id);
    if (isNaN(hospitalId)) {
      return res
        .status(400)
        .json({ error: "Hospital ID must be a valid number" });
    }
    const hospital = byId.get(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }
    res.json(hospital);
  } catch (err) {
    console.error("[Hospitals Get By ID Error]", err.message);
    res.status(500).json({ error: "Failed to fetch hospital" });
  }
});

module.exports = router;
