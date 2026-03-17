const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// ─── Rate limiting for sensitive operations ──────────────────────────────────
// 10 operations per hour per IP (strict limit for admin actions)
const sensitiveOpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sensitive operations. Please try again later." },
});

// In-memory store (persists for the lifetime of the server process)
let updates = [];

router.get("/", (req, res) => {
  try {
    // Return newest first
    res.json([...updates].reverse());
  } catch (err) {
    console.error("[Hospital Updates GET Error]", err.message);
    res.status(500).json({ error: "Failed to fetch hospital updates" });
  }
});

router.post("/", sensitiveOpsLimiter, verifyToken, verifyAdmin, (req, res) => {
  try {
    const { email, hospitalName, location, title, description } = req.body;

    if (!hospitalName || !location || !title || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: hospitalName, location, title, description",
      });
    }

    // Validate types
    if (
      typeof hospitalName !== "string" ||
      typeof location !== "string" ||
      typeof title !== "string" ||
      typeof description !== "string"
    ) {
      return res.status(400).json({ error: "All fields must be strings" });
    }

    // Sanitize inputs
    const sanitize = (val, max = 500) =>
      typeof val === "string" ? val.trim().slice(0, max) : "";

    const update = {
      id: uuidv4(),
      email: email || req.email,
      hospitalName: sanitize(hospitalName, 200),
      location: sanitize(location, 200),
      title: sanitize(title, 200),
      description: sanitize(description, 1000),
      createdAt: new Date().toISOString(),
    };

    updates.push(update);
    res.status(201).json(update);
  } catch (err) {
    console.error("[Hospital Updates POST Error]", err.message);
    res.status(500).json({ error: "Failed to create hospital update" });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Valid update ID is required" });
    }

    const before = updates.length;
    updates = updates.filter((u) => u.id !== id);

    if (updates.length === before) {
      return res.status(404).json({ error: "Update not found" });
    }

    res.json({ message: "Update deleted successfully" });
  } catch (err) {
    console.error("[Hospital Updates DELETE Error]", err.message);
    res.status(500).json({ error: "Failed to delete hospital update" });
  }
});

module.exports = router;
