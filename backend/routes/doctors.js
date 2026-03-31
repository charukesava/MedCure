const express = require("express");
const router = express.Router();
const doctors = require("../data/doctors");

router.get("/", (req, res) => {
  try {
    res.json(doctors);
  } catch (err) {
    console.error("[Doctors GET Error]", err.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

module.exports = router;
