const express = require("express");
const fs = require("fs");
const path = require("path");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

const filePath = path.join(__dirname, "../data/feedback.json");

// ─── In-memory cache — eliminates repeated disk reads ───────────────────────
// Populated lazily on first request, updated on every write.
let feedbackCache = null;

const loadFeedback = () => {
  if (feedbackCache !== null) return feedbackCache;
  try {
    feedbackCache = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : [];
  } catch {
    feedbackCache = [];
  }
  return feedbackCache;
};

const saveFeedback = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  feedbackCache = data; // keep cache in sync
};

router.post("/", (req, res) => {
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ error: "Rating is required" });
  }

  const feedbackData = loadFeedback();
  feedbackData.push({
    rating,
    comment: comment || "",
    date: new Date().toISOString(),
  });

  try {
    saveFeedback(feedbackData);
  } catch (err) {
    console.error("Error writing feedback file:", err);
    return res.status(500).json({ error: "Failed to save feedback" });
  }

  return res.json({ success: true });
});

router.get("/", (req, res) => {
  return res.json(loadFeedback());
});

// DELETE /api/feedback/:index — admin-only deletion by array index
router.delete("/:index", verifyToken, verifyAdmin, (req, res) => {
  const index = parseInt(req.params.index, 10);
  const feedbackData = loadFeedback();
  if (isNaN(index) || index < 0 || index >= feedbackData.length) {
    return res.status(404).json({ error: "Feedback not found" });
  }
  feedbackData.splice(index, 1);
  try {
    saveFeedback(feedbackData);
    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    return res.status(500).json({ error: "Failed to delete feedback" });
  }
});

module.exports = router;
