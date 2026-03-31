/**
 * Centralized admin configuration
 * Single source of truth for admin emails across the application
 *
 * To add/remove admins, update the ADMIN_EMAILS array below.
 * Changes will be reflected immediately across all modules that import this.
 *
 * Used by:
 * - backend/middleware/auth.js (verifyAdmin middleware)
 * - backend/routes/appointments.js (admin notifications)
 * - frontend/src/context/AuthContext.js (admin role checking)
 */

const ADMIN_EMAILS = [
  "charukesava.k@gmail.com",
  "admin@health-assistant.com",
  "hospital.admin@gmail.com",
  "support@health-assistant.com",
];

// Convert to Set for O(1) lookup performance (normalized to lowercase)
const ADMIN_EMAILS_SET = new Set(ADMIN_EMAILS.map(e => e.toLowerCase()));

/**
 * Check if an email is an admin
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is in admin list
 */
const isAdminEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return ADMIN_EMAILS_SET.has(email.toLowerCase());
};

module.exports = {
  ADMIN_EMAILS,
  ADMIN_EMAILS_SET,
  isAdminEmail,
};
