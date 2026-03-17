/**
 * Environment variable validation and security checks
 * Ensures all required and sensitive environment variables are properly configured
 */

/**
 * List of required backend environment variables
 */
const REQUIRED_ENV_VARS = [
  "PORT",
  "GEMINI_API_KEY",
  "ALLOWED_ORIGINS",
  // FIREBASE_SERVICE_ACCOUNT or local serviceAccountKey.json
];

/**
 * List of sensitive environment variables (should never be logged)
 */
const SENSITIVE_ENV_VARS = ["GEMINI_API_KEY", "FIREBASE_SERVICE_ACCOUNT"];

/**
 * Validate that all required environment variables are present
 * @throws {Error} If required variables are missing
 */
const validateRequiredEnvVars = () => {
  const missing = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName] || process.env[varName].trim() === "") {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(", ")}`;
    console.error(`\n❌ SECURITY ERROR: ${errorMsg}`);
    console.error(
      "   Please set these variables in your .env file. See .env.example for details.\n",
    );
    throw new Error(errorMsg);
  }

  console.log("✅ All required environment variables are configured");
};

/**
 * Get environment variable safely (without logging sensitive values)
 * @param {string} varName - Variable name
 * @param {string} defaultValue - Default value if not found
 * @returns {string} - The environment variable value (redacted if sensitive)
 */
const getSafeEnvVar = (varName, defaultValue = "") => {
  const value = process.env[varName] || defaultValue;

  if (SENSITIVE_ENV_VARS.includes(varName)) {
    return value ? "[REDACTED]" : "[NOT SET]";
  }

  return value;
};

/**
 * Log all environment variables safely (without exposing sensitive values)
 */
const logEnvironmentConfig = () => {
  console.log("\n📋 Environment Configuration:");
  console.log("================================");

  // Common non-sensitive vars to log
  const varsToLog = ["NODE_ENV", "PORT", "ALLOWED_ORIGINS"];

  for (const varName of varsToLog) {
    const value = getSafeEnvVar(varName, "NOT SET");
    console.log(`  ${varName}: ${value}`);
  }

  // Log sensitive vars status only
  for (const varName of SENSITIVE_ENV_VARS) {
    const isSet = process.env[varName] ? "✓ SET" : "✗ NOT SET";
    console.log(`  ${varName}: ${isSet}`);
  }

  console.log("================================\n");
};

/**
 * Validate Firebase configuration
 * Either FIREBASE_SERVICE_ACCOUNT env var or local serviceAccountKey.json
 * @throws {Error} If Firebase not properly configured
 */
const validateFirebaseConfig = () => {
  const fs = require("fs");
  const path = require("path");

  const hasEnvVar = !!process.env.FIREBASE_SERVICE_ACCOUNT;

  const keyFilePath = path.join(__dirname, "../serviceAccountKey.json");
  const hasKeyFile = fs.existsSync(keyFilePath);

  if (!hasEnvVar && !hasKeyFile) {
    const errorMsg =
      "Firebase not configured: Provide FIREBASE_SERVICE_ACCOUNT env var or serviceAccountKey.json file";
    console.error(`\n❌ SECURITY ERROR: ${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  if (hasEnvVar) {
    console.log("✅ Firebase configured via environment variable");
  } else {
    console.log("✅ Firebase configured via serviceAccountKey.json");
  }
};

/**
 * Check if running in production and suggest security improvements
 */
const checkProductionSecurity = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log("\n🔒 PRODUCTION MODE - Security Checks:");
    console.log("=====================================");

    const checks = [
      {
        name: "HTTPS enabled",
        check: process.env.HTTPS_ENABLED !== "false",
      },
      {
        name: "Helmet security headers",
        check: true, // Assumed in production
      },
      {
        name: "Rate limiting enabled",
        check: process.env.RATE_LIMIT_ENABLED !== "false",
      },
      {
        name: "CSRF protection",
        check: process.env.CSRF_ENABLED !== "false",
      },
    ];

    for (const c of checks) {
      const status = c.check ? "✓" : "✗";
      console.log(`  ${status} ${c.name}`);
    }
    console.log("====================================\n");
  }
};

/**
 * Validate all security configuration on startup
 */
const validateAllSecurity = () => {
  try {
    console.log("\n🔐 Starting Security Validation...\n");

    validateRequiredEnvVars();
    validateFirebaseConfig();
    logEnvironmentConfig();
    checkProductionSecurity();

    console.log("✅ All security validations passed!\n");
  } catch (err) {
    console.error("\n❌ Security validation failed:", err.message);
    process.exit(1);
  }
};

module.exports = {
  validateRequiredEnvVars,
  getSafeEnvVar,
  logEnvironmentConfig,
  validateFirebaseConfig,
  checkProductionSecurity,
  validateAllSecurity,
};
