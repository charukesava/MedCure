/**
 * Centralized admin configuration for frontend
 * Single source of truth for admin emails
 *
 * To add/remove admins, update the ADMIN_EMAILS array below.
 * Changes will be reflected immediately in AuthContext.js
 *
 * Must be kept in sync with backend/config/adminConfig.js
 */

export const ADMIN_EMAILS = [
  "charukesava.k@gmail.com",
  "admin@health-assistant.com",
  "hospital.admin@gmail.com",
  "support@health-assistant.com",
];

/**
 * Check if an email is an admin
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is in admin list
 */
export const isAdminEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
