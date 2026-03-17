const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const ruleEngine = require("../logic/ruleEngine");

// ─── Rate limiting for symptom analysis ──────────────────────────────────────
// 100 requests per 15 minutes per IP (general limit)
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// ─── Validation constraints ───────────────────────────────────────────────
const SYMPTOM_MIN_LENGTH = 3;
const SYMPTOM_MAX_LENGTH = 2000;

router.post("/", analyzeLimiter, (req, res) => {
  try {
    const { symptoms } = req.body;

    // Validate type
    if (!symptoms || typeof symptoms !== "string") {
      return res.status(400).json({
        error: "Symptoms are required and must be a string",
      });
    }

    const trimmed = symptoms.trim();

    // Validate length
    if (trimmed.length < SYMPTOM_MIN_LENGTH) {
      return res.status(400).json({
        error: `Please describe your symptoms in more detail (minimum ${SYMPTOM_MIN_LENGTH} characters)`,
      });
    }

    if (trimmed.length > SYMPTOM_MAX_LENGTH) {
      return res.status(400).json({
        error: `Symptom description is too long (maximum ${SYMPTOM_MAX_LENGTH} characters)`,
      });
    }

    const result = ruleEngine(trimmed);

    return res.json({
      possibleCondition: result.condition,
      severity: result.severity,
      advice: result.firstAid,
      consultDoctor: result.consult,
      disclaimer:
        "This is not a medical diagnosis. Always consult a qualified healthcare professional.",
    });
  } catch (err) {
    console.error("[Analyze Error]", err.message);
    res.status(500).json({ error: "Failed to analyze symptoms" });
  }
});

module.exports = router;
