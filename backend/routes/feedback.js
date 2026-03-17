const express = require("express");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── Rate limiting for feedback submissions ──────────────────────────────────
// 5 feedback submissions per hour per IP to prevent spam
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many feedback submissions. Please try again later." },
});

const filePath = path.join(__dirname, "../data/feedback.json");

// ─── Validation constraints ───────────────────────────────────────────────
const RATING_MIN = 1;
const RATING_MAX = 5;
const COMMENT_MAX_LENGTH = 1000;

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

router.post("/", feedbackLimiter, (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Validate rating exists and is a number
    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: "Rating is required" });
    }

    const ratingNum = Number(rating);
    if (
      !Number.isInteger(ratingNum) ||
      ratingNum < RATING_MIN ||
      ratingNum > RATING_MAX
    ) {
      return res.status(400).json({
        error: `Rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`,
      });
    }

    // Validate comment (optional, but if provided must be string and under max length)
    let sanitizedComment = "";
    if (comment) {
      if (typeof comment !== "string") {
        return res.status(400).json({ error: "Comment must be a string" });
      }
      sanitizedComment = comment.trim().slice(0, COMMENT_MAX_LENGTH);
    }

    const feedbackData = loadFeedback();
    feedbackData.push({
      rating: ratingNum,
      comment: sanitizedComment,
      date: new Date().toISOString(),
    });

    saveFeedback(feedbackData);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Feedback Post Error]", err.message);
    return res.status(500).json({ error: "Failed to process feedback" });
  }
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
