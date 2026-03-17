/**
 * Firebase auth middleware with security audit logging
 * Verifies the Firebase ID token sent in the Authorization header.
 *
 * Usage:
 *   router.get('/secret', verifyToken, (req, res) => { ... })
 *   req.uid      → verified Firebase UID
 *   req.email    → verified email
 *   req.isAdmin  → true if email is in ADMIN_EMAILS (from config/adminConfig)
 */

const admin = require("firebase-admin");
const { ADMIN_EMAILS_SET } = require("../config/adminConfig");
const { logAuthFailure, logAdminAction } = require("./auditLog");

/**
 * Verifies Firebase ID token from "Authorization: Bearer <token>" header.
 * Attaches req.uid, req.email, req.isAdmin on success.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    logAuthFailure(req, "Missing or invalid Bearer token");
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    req.email = decoded.email || "";
    req.isAdmin = ADMIN_EMAILS_SET.has(req.email);

    // Update audit info with authenticated user
    if (req.auditInfo) {
      req.auditInfo.userId = req.uid;
      req.auditInfo.email = req.email;
    }

    next();
  } catch (err) {
    const reason =
      err.code === "auth/id-token-expired"
        ? "Token expired"
        : "Invalid or malformed token";
    logAuthFailure(req, reason, 1);
    console.error("[Auth] Token verification failed:", err.code || err.message);
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};

/**
 * Must be used AFTER verifyToken.
 * Blocks the request if the authenticated user is not an admin.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    const details = `Unauthorized admin access attempt by ${req.email}`;
    logAuthFailure(req, details, 2); // CRITICAL severity
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }

  // Log successful admin action preparation
  logAdminAction(req, "Admin endpoint accessed", `Path: ${req.path}`, 0);

  next();
};

module.exports = { verifyToken, verifyAdmin };
