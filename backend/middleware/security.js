/**
 * Security middleware and utilities
 * Provides input sanitization, validation, and protection against common attacks
 */

/**
 * Sanitize strings to prevent XSS and injection attacks
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/["'`]/g, "") // Remove quotes
    .trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email.trim());
};

/**
 * Validate phone number format
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid phone
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-+()]{10,15}$/;
  return typeof phone === "string" && phoneRegex.test(phone.trim());
};

/**
 * Prevent SQL injection by checking for SQL keywords
 * @param {string} str - String to check
 * @returns {boolean} - True if potentially malicious SQL detected
 */
const detectSQLInjection = (str) => {
  if (typeof str !== "string") return false;
  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "UNION",
    "SCRIPT",
    "JAVASCRIPT",
    "ONERROR",
    "ONCLICK",
  ];
  const upperStr = str.toUpperCase();
  return sqlKeywords.some((keyword) => upperStr.includes(keyword));
};

/**
 * Validate request size to prevent DoS
 * Express app.use(express.json({ limit })) should be set before this
 */
const validateRequestSize = (maxSizeKB = 50) => {
  return (req, res, next) => {
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxSizeKB * 1024) {
        res.status(413).json({
          error: `Request too large (max ${maxSizeKB}KB)`,
        });
      }
    });
    next();
  };
};

/**
 * Sanitize all request inputs (query, body, params)
 */
const sanitizeInputs = (req, res, next) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitizeString(req.query[key]);
    }
  }

  // Sanitize body
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize params
  for (const key in req.params) {
    if (typeof req.params[key] === "string") {
      req.params[key] = sanitizeString(req.params[key]);
    }
  }

  next();
};

/**
 * Prevent XXS by validating content types
 */
const validateContentType = (req, res, next) => {
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    const contentType = req.headers["content-type"] || "";
    if (
      !contentType.includes("application/json") &&
      !contentType.includes("multipart/form-data")
    ) {
      return res.status(415).json({
        error: "Unsupported Media Type. Use application/json",
      });
    }
  }
  next();
};

/**
 * Add security headers to response
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // No referrer
  res.setHeader("Referrer-Policy", "no-referrer");
  // Disable client caching for sensitive endpoints
  if (req.path.includes("/admin") || req.path.includes("/auth")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
  }
  next();
};

/**
 * Rate limit check middleware factory
 * Returns middleware that checks if rate limit exceeded
 */
const createRateLimitChecker = (maxRequests = 100, windowMs = 60000) => {
  const requestMap = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestMap.has(key)) {
      requestMap.set(key, []);
    }

    const requests = requestMap.get(key);
    // Remove old requests outside window
    const recentRequests = requests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    recentRequests.push(now);
    requestMap.set(key, recentRequests);
    next();
  };
};

module.exports = {
  sanitizeString,
  validateEmail,
  validatePhone,
  detectSQLInjection,
  validateRequestSize,
  sanitizeInputs,
  validateContentType,
  securityHeaders,
  createRateLimitChecker,
};
