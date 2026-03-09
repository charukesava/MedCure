const router = require("express").Router();
const multer = require("multer");

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
    const category = req.body.category;
    let severity = "Low";

    if (category === "wound") severity = "Medium";
    if (category === "other") severity = "High";

    res.json({
      category,
      severity,
      advice: "Consult a doctor if condition worsens",
      disclaimer: "Mock image analysis. Educational only.",
    });
  },
);

module.exports = router;
