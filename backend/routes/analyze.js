const express = require("express");
const router = express.Router();
const ruleEngine = require("../logic/ruleEngine");

router.post("/", (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || typeof symptoms !== "string") {
    return res.status(400).json({ error: "Symptoms are required" });
  }

  const trimmed = symptoms.trim();
  if (trimmed.length < 3) {
    return res
      .status(400)
      .json({ error: "Please describe your symptoms in more detail" });
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
});

module.exports = router;
