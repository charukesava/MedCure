/**
 * Security audit logging middleware
 * Logs security-related events (auth failures, admin actions, suspicious patterns)
 */

const fs = require("fs");
const path = require("path");

// Audit log file path
const auditLogPath = path.join(__dirname, "../logs/audit.log");

// Ensure logs directory exists
const logsDir = path.dirname(auditLogPath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log security event to audit trail
 * @param {string} eventType - Type of event (auth_failure, admin_action, suspicious, etc.)
 * @param {string} userId - User ID (if authenticated)
 * @param {string} ip - Request IP address
 * @param {string} details - Additional details
 * @param {number} severity - Severity level (0=info, 1=warning, 2=critical)
 */
const auditLog = (
  eventType,
  userId = "unknown",
  ip = "unknown",
  details = "",
  severity = 0,
) => {
  const timestamp = new Date().toISOString();
  const severityLabels = ["INFO", "WARNING", "CRITICAL"];
  const logEntry = `[${timestamp}] [${severityLabels[severity]}] Event: ${eventType} | User: ${userId} | IP: ${ip} | Details: ${details}\n`;

  // Write to file
  fs.appendFile(auditLogPath, logEntry, (err) => {
    if (err) {
      console.error("[Audit Log Error]", err.message);
    }
  });

  // Also log to console for critical events
  if (severity >= 2) {
    console.error(`[SECURITY ALERT] ${logEntry.trim()}`);
  }
};

/**
 * Middleware to track request details for auditing
 */
const auditMiddleware = (req, res, next) => {
  // Attach audit info to request
  req.auditInfo = {
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    timestamp: new Date(),
    userId: null, // Will be set after auth verification
  };

  // If user is authenticated, set userId
  if (req.uid) {
    req.auditInfo.userId = req.uid;
  }

  next();
};

/**
 * Log authentication failure
 */
const logAuthFailure = (req, reason = "Invalid token", severity = 1) => {
  const ip = req.ip || req.connection.remoteAddress;
  auditLog("auth_failure", "unknown", ip, reason, severity);
};

/**
 * Log admin action
 */
const logAdminAction = (req, action, details = "", severity = 1) => {
  const userId = req.uid || "unknown";
  const ip = req.ip || req.connection.remoteAddress;
  auditLog(
    "admin_action",
    userId,
    ip,
    `Action: ${action} | ${details}`,
    severity,
  );
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (
  req,
  reason = "Suspicious pattern detected",
  severity = 1,
) => {
  const userId = req.uid || "unknown";
  const ip = req.ip || req.connection.remoteAddress;
  auditLog("suspicious_activity", userId, ip, reason, severity);
};

/**
 * Get audit logs (admin only)
 * @param {number} limitLines - Number of recent lines to return
 * @returns {string[]} - Array of audit log lines
 */
const getAuditLogs = (limitLines = 100) => {
  try {
    if (!fs.existsSync(auditLogPath)) {
      return ["No audit logs found"];
    }

    const content = fs.readFileSync(auditLogPath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.slice(-limitLines);
  } catch (err) {
    console.error("[Audit Log Read Error]", err.message);
    return ["Error reading audit logs"];
  }
};

/**
 * Clear audit logs (use with caution)
 */
const clearAuditLogs = () => {
  try {
    if (fs.existsSync(auditLogPath)) {
      fs.truncateSync(auditLogPath, 0);
      auditLog(
        "audit_logs_cleared",
        "admin",
        "system",
        "Audit logs cleared",
        2,
      );
      return true;
    }
  } catch (err) {
    console.error("[Audit Log Clear Error]", err.message);
    return false;
  }
};

module.exports = {
  auditLog,
  auditMiddleware,
  logAuthFailure,
  logAdminAction,
  logSuspiciousActivity,
  getAuditLogs,
  clearAuditLogs,
};
