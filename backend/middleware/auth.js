/**
 * Firebase auth middleware
 * Verifies the Firebase ID token sent in the Authorization header.
 *
 * Usage:
 *   router.get('/secret', verifyToken, (req, res) => { ... })
 *   req.uid      → verified Firebase UID
 *   req.email    → verified email
 *   req.isAdmin  → true if email is in ADMIN_EMAILS
 */

const admin = require("firebase-admin");

// Keep in sync with appointments.js and AuthContext.js
const ADMIN_EMAILS = new Set([
  "charukesava.k@gmail.com",
  "admin@health-assistant.com",
  "hospital.admin@gmail.com",
  "support@health-assistant.com",
]);

/**
 * Verifies Firebase ID token from "Authorization: Bearer <token>" header.
 * Attaches req.uid, req.email, req.isAdmin on success.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    req.email = decoded.email || "";
    req.isAdmin = ADMIN_EMAILS.has(req.email);
    next();
  } catch (err) {
    console.error("[Auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};

/**
 * Must be used AFTER verifyToken.
 * Blocks the request if the authenticated user is not an admin.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
