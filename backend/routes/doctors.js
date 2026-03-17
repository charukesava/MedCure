const express = require("express");
const router = express.Router();

const doctors = [
  {
    name: "City Care Hospital",
    type: "Hospital",
    specialization: "General",
    location: "Hyderabad",
    distance: 2.5,
  },
  {
    name: "Dr. Ramesh Kumar",
    type: "Doctor",
    specialization: "Cardiology",
    location: "Hyderabad",
    distance: 4.2,
  },
  {
    name: "Sunrise Clinic",
    type: "Clinic",
    specialization: "Dermatology",
    location: "Hyderabad",
    distance: 1.8,
  },
  {
    name: "Apollo Medical Center",
    type: "Hospital",
    specialization: "Orthopedics",
    location: "Hyderabad",
    distance: 3.6,
  },
];

router.get("/", (req, res) => {
  try {
    res.json(doctors);
  } catch (err) {
    console.error("[Doctors GET Error]", err.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

module.exports = router;
