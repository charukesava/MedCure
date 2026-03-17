require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

// ─── Security headers (X-Frame-Options, CSP, HSTS, etc.) ───────────────────
app.use(helmet());

const analyzeRoutes = require("./routes/analyze");
const imageAnalyzeRoutes = require("./routes/imageAnalyze");
const appointmentsRoutes = require("./routes/appointments");
const doctorsRoutes = require("./routes/doctors");
const emergencyRoutes = require("./routes/emergency");
const feedbackRoutes = require("./routes/feedback");
const hospitalUpdatesRoutes = require("./routes/hospitalUpdates");
const hospitalsRoutes = require("./routes/hospitals");
const aiChat = require("./routes/aiChat");

// ─── CORS — only allow the React dev server and production origin ──────────
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const ALLOWED_ORIGINS = [
  ...new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
];
app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server (no origin) and whitelisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body limit — prevent large-payload DoS attacks ─────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use("/api/ai", aiChat);

/* -------- ROUTES -------- */

app.use("/api/analyze", analyzeRoutes);
app.use("/api/image-analyze", imageAnalyzeRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/hospital-updates", hospitalUpdatesRoutes);
app.use("/api/hospitals", hospitalsRoutes);

/* -------- 404 handler -------- */
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

/* -------- Global error handler -------- */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

/* -------- SERVER -------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
