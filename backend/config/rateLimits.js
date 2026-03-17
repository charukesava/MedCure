/**
 * Centralized rate limiting configuration
 * Defines rate limits for different endpoints and operations
 */

const rateLimit = require("express-rate-limit");

// ─── General API Rate Limit ─────────────────────────────────────────────────
// Prevent general abuse: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

// ─── Authentication Rate Limit ──────────────────────────────────────────────
// Strict rate limit on auth attempts: 5 requests per 15 minutes per IP
// Prevents brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login/signup attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// ─── Sensitive Operations Rate Limit ────────────────────────────────────────
// Strict limit on sensitive ops: 10 requests per hour per IP
// Used for: admin actions, data export, etc.
const sensitiveOpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many sensitive operations. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Appointment Creation Rate Limit ────────────────────────────────────────
// Prevent spam: 10 appointments per hour per IP
const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many appointment requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── AI Chat Rate Limit ─────────────────────────────────────────────────────
// Prevent AI API abuse: 20 messages per minute per IP
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many chat requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Feedback Rate Limit ────────────────────────────────────────────────────
// Prevent spam: 5 feedback submissions per hour per IP
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many feedback submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Emergency Alert Rate Limit ─────────────────────────────────────────────
// Critical endpoint with moderate limit: 10 per hour per IP
const emergencyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many emergency alerts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  sensitiveOpsLimiter,
  appointmentLimiter,
  aiChatLimiter,
  feedbackLimiter,
  emergencyLimiter,
};
