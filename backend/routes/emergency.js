const router = require("express").Router();

router.post("/", (req, res) => {
  const { location, userId, message } = req.body || {};
  if (!location && !userId) {
    return res.status(400).json({ error: "location or userId is required" });
  }
  // Log structured fields only — never log raw body (avoids logging PII/payloads)
  console.warn("[EMERGENCY ALERT] userId:", userId, "| location:", location);
  res.json({ status: "Alert sent (mock)" });
});

module.exports = router;
