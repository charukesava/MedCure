const router = require("express").Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");

// ─── Rate limiting for image analysis ────────────────────────────────────────
// 100 requests per 15 minutes per IP (general limit)
const imageAnalyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Allow only image MIME types, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/",
  imageAnalyzeLimiter,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const category = req.body.category;

      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      if (typeof category !== "string") {
        return res.status(400).json({ error: "Category must be a string" });
      }

      let severity = "Low";
      if (category === "wound") severity = "Medium";
      if (category === "other") severity = "High";

      res.json({
        category,
        severity,
        advice: "Consult a doctor if condition worsens",
        disclaimer: "Educational analysis only. Not a medical diagnosis.",
        note: "Full image analysis will be implemented using Gemini Vision API",
      });
    } catch (err) {
      console.error("[Image Analyze Error]", err.message);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  },
);

module.exports = router;
