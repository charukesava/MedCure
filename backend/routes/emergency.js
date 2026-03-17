const router = require("express").Router();
const rateLimit = require("express-rate-limit");

// ─── Rate limiting for emergency alerts ──────────────────────────────────────
// 10 alerts per hour per IP to prevent abuse of critical endpoint
const emergencyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many emergency alerts. Please try again later." },
});

router.post("/", emergencyLimiter, (req, res) => {
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
