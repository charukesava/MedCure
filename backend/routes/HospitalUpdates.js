const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// In-memory store (persists for the lifetime of the server process)
let updates = [];

router.get("/", (req, res) => {
  // Return newest first
  res.json([...updates].reverse());
});

router.post("/", verifyToken, verifyAdmin, (req, res) => {
  const { email, hospitalName, location, title, description } = req.body;

  if (!hospitalName || !location || !title || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const update = {
    id: uuidv4(),
    email: email || req.email,
    hospitalName,
    location,
    title,
    description,
    createdAt: new Date().toISOString(),
  };

  updates.push(update);
  res.status(201).json(update);
});

router.delete("/:id", verifyToken, verifyAdmin, (req, res) => {
  const before = updates.length;
  updates = updates.filter((u) => u.id !== req.params.id);
  if (updates.length === before) {
    return res.status(404).json({ error: "Update not found." });
  }
  res.json({ message: "Update deleted." });
});

module.exports = router;
