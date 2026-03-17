/**
 * Frontend Security Utilities
 * Provides security best practices for React application
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== "string") return "";

  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate email format on frontend
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, score: number, feedback: string[] }
 */
export const validatePasswordStrength = (password) => {
  const feedback = [];
  let score = 0;

  if (!password || typeof password !== "string") {
    return { isValid: false, score: 0, feedback: ["Password is required"] };
  }

  // Length check
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push("Minimum 8 characters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 25;
  } else {
    feedback.push("Missing uppercase letter");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 25;
  } else {
    feedback.push("Missing lowercase letter");
  }

  // Number check
  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push("Missing number");
  }

  // Special character check
  if (/[!@#$%^&*]/.test(password)) {
    score += 10;
  } else {
    feedback.push("Missing special character");
  }

  return {
    isValid: score >= 75,
    score: Math.min(score, 100),
    feedback,
  };
};

/**
 * Store sensitive data securely
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 */
export const storeSecurely = (key, data, useSession = false) => {
  try {
    const storage = useSession ? sessionStorage : localStorage;

    // Never store sensitive data like passwords
    const sensitiveKeys = ["password", "pin", "secret", "token"];
    const isSensitive = sensitiveKeys.some((s) =>
      key.toLowerCase().includes(s),
    );

    if (isSensitive && typeof data === "string" && data.length < 100) {
      console.warn(
        `⚠️ Warning: Storing sensitive data in ${useSession ? "session" : "local"} storage`,
      );
    }

    storage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Storage error:", err);
  }
};

/**
 * Retrieve data from secure storage
 * @param {string} key - Storage key
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 * @returns {any} - Retrieved data or null
 */
export const getFromSecureStorage = (key, useSession = false) => {
  try {
    const storage = useSession ? sessionStorage : localStorage;
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Storage retrieval error:", err);
    return null;
  }
};

/**
 * Clear sensitive data from storage
 * @param {string} key - Storage key
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 */
export const clearSecureStorage = (key, useSession = false) => {
  try {
    const storage = useSession ? sessionStorage : localStorage;
    storage.removeItem(key);
  } catch (err) {
    console.error("Storage clear error:", err);
  }
};

/**
 * Validate that user is on HTTPS in production
 */
export const checkHttpSecure = () => {
  if (
    process.env.NODE_ENV === "production" &&
    window.location.protocol !== "https:"
  ) {
    console.warn(
      "⚠️ WARNING: Application is not using HTTPS. This is a security risk in production.",
    );
  }
};

/**
 * Get auth token securely (from sessionStorage, never localStorage for tokens)
 * @returns {string|null} - Auth token or null
 */
export const getAuthToken = () => {
  return getFromSecureStorage("auth_token", true); // Use sessionStorage
};

/**
 * Store auth token securely (in sessionStorage, not localStorage)
 * @param {string} token - Auth token
 */
export const storeAuthToken = (token) => {
  storeSecurely("auth_token", token, true); // Use sessionStorage
};

/**
 * Clear auth token
 */
export const clearAuthToken = () => {
  clearSecureStorage("auth_token", true);
};

/**
 * Validate API response for suspicious patterns
 * @param {any} response - API response data
 * @returns {boolean} - True if response looks safe
 */
export const validateApiResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  // Check for suspicious scripts or markup
  const jsonStr = JSON.stringify(response);
  const dangerousPatterns = [
    "<script",
    // eslint-disable-next-line no-script-url
    "javascript:",
    "onerror=",
    "onclick=",
    "eval(",
  ];

  return !dangerousPatterns.some((pattern) =>
    jsonStr.toLowerCase().includes(pattern),
  );
};

/**
 * Override console in production to prevent sensitive data logging
 */
export const secureConsole = () => {
  if (process.env.NODE_ENV === "production") {
    const noop = () => {};
    window.console = {
      log: noop,
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
  }
};
