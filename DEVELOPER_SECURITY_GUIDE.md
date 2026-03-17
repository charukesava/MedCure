# 🔐 Security Best Practices for Developers

This guide provides quick reference for common security tasks and best practices when working on the Health Assistant project.

## Quick Start

### Setup Development Environment Securely

```bash
# 1. Clone repository
git clone https://github.com/your-org/health-assistant.git
cd health-assistant

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Get Firebase credentials
# Download serviceAccountKey.json from Firebase Console
# Place in backend/ directory (NOT committed to git)

# 5. Validate security
npm run security-check  # (or bash scripts/security-checklist.sh)

# 6. Start development
cd backend && npm start
# In another terminal
cd frontend && npm start
```

## Common Tasks

### How to: Validate User Input

**Pattern**: Use regex validation + sanitization

```javascript
// Backend
const { validateField, sanitize } = require("../middleware/security");

try {
  validateField(userEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email");
  validateField(phone, /^[\d\s\-+()]{10,15}$/, "phone");

  const cleanEmail = sanitize(userEmail);
  const cleanPhone = sanitize(phone);

  // Use cleaned inputs
} catch (err) {
  return res.status(400).json({ error: err.message });
}

// Frontend
import { validateEmailFormat } from "./utils/security";

if (!validateEmailFormat(email)) {
  setEmailError("Invalid email format");
  return;
}
```

### How to: Add a New Protected Endpoint

```javascript
// backend/routes/myRoute.js
const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const { logAdminAction } = require("../middleware/auditLog");
const { appointmentLimiter } = require("../config/rateLimits");

// Public endpoint (no auth required)
router.get("/", (req, res) => {
  try {
    res.json({ data: "public" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// Protected endpoint (user must be authenticated)
router.post("/", verifyToken, appointmentLimiter, (req, res) => {
  try {
    // Code here executes only for authenticated users
    // req.uid and req.email available
    res.json({ userId: req.uid });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// Admin-only endpoint
router.delete("/:id", verifyToken, verifyAdmin, (req, res) => {
  try {
    logAdminAction(req, "delete_item", `ID: ${req.params.id}`);
    // Only admins reach here
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
```

### How to: Store Sensitive Data Securely (Frontend)

```javascript
// ❌ WRONG - Never do this
localStorage.setItem("password", userPassword); // Visible to anyone with browser access

// ✅ RIGHT - Use sessionStorage for temporary sensitive data
import { storeAuthToken, clearAuthToken } from "./utils/security";

// Store token (auto-cleared when tab closes)
storeAuthToken(firebaseIdToken);

// Retrieve
const token = getAuthToken();

// Clear on logout
clearAuthToken();

// NEVER store passwords, PINs, or secrets anywhere
```

### How to: Log Security Events

```javascript
// backend/middleware/auditLog.js
const {
  logAuthFailure,
  logAdminAction,
  logSuspiciousActivity,
} = require("../middleware/auditLog");

// Log authentication failure
logAuthFailure(req, "Invalid password attempt", 1);

// Log admin action
logAdminAction(req, "deleted_user", `User ID: 123`, 1);

// Log suspicious activity
logSuspiciousActivity(req, "Excessive failed logins", 2); // CRITICAL
```

### How to: Apply Rate Limiting to New Endpoint

```javascript
// backend/routes/myRoute.js
const { myNewLimiter } = require("../config/rateLimits");

// Option 1: Use existing rate limiter
router.post("/", appointmentLimiter, (req, res) => {
  // Limited to 10 per hour
});

// Option 2: Create custom limiter
const rateLimit = require("express-rate-limit");
const customLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests
  message: { error: "Too many requests" },
});

router.post("/sensitive", customLimiter, verifyToken, (req, res) => {
  // Custom rate limit applied
});
```

### How to: Add a New Admin

⚠️ Centralized in one place:

```javascript
// backend/config/adminConfig.js
const ADMIN_EMAILS = [
  "charukesava.k@gmail.com",
  "admin@health-assistant.com",
  "hospital.admin@gmail.com",
  "support@health-assistant.com",
  "new-admin@gmail.com", // ← Add here
];
```

**Changes apply immediately** to:

- `backend/middleware/auth.js`
- `backend/routes/appointments.js`
- `frontend/src/context/AuthContext.js`

### How to: Handle Sensitive Errors

```javascript
// ❌ WRONG - Exposes internals
catch (err) {
  res.status(500).json({ error: err.stack });  // Shows file paths, code
}

// ✅ RIGHT - Generic in production, detailed in dev
catch (err) {
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: isDev ? err.message : 'An error occurred',
    ...(isDev && { stack: err.stack })
  });
}
```

### How to: Prevent SQL Injection

```javascript
// ❌ WRONG - Never concatenate SQL
const query = `SELECT * FROM users WHERE email = '${email}'`;
db.query(query);

// ✅ RIGHT (if using SQL) - Use parameterized queries
const query = "SELECT * FROM users WHERE email = ?";
db.query(query, [email]);

// ✅ BETTER - Use Firestore (NoSQL) - automatically safe
const snapshot = await db.collection("users").where("email", "==", email).get();
```

### How to: Check Request Source (CORS)

The backend **automatically blocks** requests from unauthorized origins:

```
❌ Request from: https://malicious.com
   → Blocked by CORS

✓ Request from: https://yourdomain.com
  → Allowed (in ALLOWED_ORIGINS env var)
```

**Configure in backend/.env:**

```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### How to: Review Security Audit Logs

```bash
# View recent audit events
tail -100 backend/logs/audit.log

# Monitor in real-time
tail -f backend/logs/audit.log

# Search for specific events
grep "admin_action" backend/logs/audit.log
grep "auth_failure" backend/logs/audit.log
grep "CRITICAL" backend/logs/audit.log
```

**Audit log format:**

```
[2024-03-17T10:30:45.123Z] [CRITICAL] Event: auth_failure | User: unknown | IP: 192.168.1.1 | Details: Token expired
```

## Security Checklist for Code Review

When reviewing PRs, check for:

- [ ] **Input validation**: All user inputs validated with regex
- [ ] **Sanitization**: Strings sanitized before storage/display
- [ ] **Auth**: Protected endpoints have `verifyToken` or `verifyAdmin`
- [ ] **Errors**: No sensitive details in error messages (production)
- [ ] **Logging**: Sensitive data not logged (passwords, tokens, keys)
- [ ] **Rate limiting**: Sensitive endpoints have rate limits
- [ ] **Database**: No raw SQL queries (use parameterized or Firestore)
- [ ] **No hardcoded secrets**: No API keys, passwords, or credentials in code
- [ ] **HTTPS only**: Production URLs use HTTPS
- [ ] **Admin actions**: Logged with `logAdminAction()`

## Common Security Issues

### Issue: "Token verification failed"

**Solution**:

1. Check token is sent: `Authorization: Bearer <token>`
2. Verify token not expired
3. Check Firebase credentials loaded

### Issue: "CORS blocked"

**Solution**:

1. Add frontend URL to `ALLOWED_ORIGINS` in backend/.env
2. Verify format: `https://yourdomain.com` (no trailing slash)
3. Restart backend server

### Issue: "Too many requests"

**Solution**:

1. Normal - rate limiting working
2. Wait 15 minutes for reset
3. If legitimate, increase rate limit in `config/rateLimits.js`

### Issue: "Audit logs growing too large"

**Solution**:

1. Archive logs periodically
2. Set `AUDIT_LOG_RETENTION=90` to auto-delete after 90 days
3. Deploy: `npm start`

## Resources

- [SECURITY.md](./SECURITY.md) - Full security documentation
- [OWASP Top 10](https://owasp.org/Top10/) - Web security risks
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/start)

## Need Help?

1. Check SECURITY.md for detailed information
2. Review audit logs for error context
3. Search GitHub issues for similar problems
4. Contact security team for sensitive issues

---

**Remember**: Security is everyone's responsibility. If you see a potential vulnerability, report it immediately (don't post publicly).
