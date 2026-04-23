const router = require("express").Router();
const { auditLog } = require("../middleware/auditLog");

// ⚠️ NOTE: Emergency endpoint intentionally NOT rate-limited
// Real emergencies must never be blocked by rate limiting
// Abuse detection handled via IP reputation and post-hoc analysis

router.post("/", (req, res) => {
  // Log as CRITICAL emergency alert
  auditLog("EMERGENCY_ALERT_POSTED", "CRITICAL", {
    location: req.body?.location,
    timestamp: new Date().toISOString(),
  });
  try {
    const { location, userId, message } = req.body || {};

    if (!location && !userId) {
      return res.status(400).json({
        error: "At least one of 'location' or 'userId' is required",
      });
    }

    // Validate input types
    if (location && typeof location !== "string") {
      return res.status(400).json({ error: "Location must be a string" });
    }

    if (userId && typeof userId !== "string") {
      return res.status(400).json({ error: "UserId must be a string" });
    }

    // Log structured fields only — never log raw body (avoids logging PII/payloads)
    console.warn(
      "[EMERGENCY ALERT]",
      new Date().toISOString(),
      "| userId:",
      userId,
      "| location:",
      location,
      "| message:",
      message ? "(present)" : "(none)",
    );

    res.status(200).json({
      status: "Alert sent (mock)",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Emergency Error]", err.message);
    res.status(500).json({ error: "Failed to process emergency alert" });
  }
});

module.exports = router;
