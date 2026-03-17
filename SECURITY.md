# 🔐 Security Guidelines for Health Assistant

## Table of Contents

1. [Overview](#overview)
2. [Backend Security](#backend-security)
3. [Frontend Security](#frontend-security)
4. [Data Protection](#data-protection)
5. [Deployment Security](#deployment-security)
6. [Incident Response](#incident-response)

---

## Overview

This document outlines security best practices and implementation details for the Health Assistant application. Security is implemented at multiple layers:

- **Backend**: Authentication, authorization, input validation, rate limiting, audit logging
- **Frontend**: Input validation, XSS prevention, secure storage, HTTPS enforcement
- **Network**: CORS, HTTPS, security headers, CSP
- **Data**: Encryption, secure storage, no hardcoded credentials

---

## Backend Security

### 1. Authentication & Authorization

#### Email Verification

- All users must verify their email before login
- Firebase handles email verification flow
- **File**: `frontend/src/context/AuthContext.js`

#### Token Verification

- All protected endpoints require valid Firebase ID token
- Tokens are verified server-side with Firebase Admin SDK
- **File**: `backend/middleware/auth.js`

#### Admin Access Control

- Centralized admin email list in `backend/config/adminConfig.js`
- Admin emails checked against Firebase user email
- All admin endpoints require `verifyAdmin` middleware

### 2. Input Validation & Sanitization

#### Validation Patterns (Regex)

All inputs validated against strict regex patterns:

```
Date: /^\d{4}-\d{2}-\d{2}$/
Time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
Phone: /^[\d\s\-+()]{10,15}$/
Name: /^[a-zA-Z\s\-']{2,100}$/
```

**File**: `backend/routes/appointments.js` and others

#### Sanitization

- All string inputs sanitized to remove angle brackets, quotes
- XSS vectors blocked before database storage
- **File**: `backend/middleware/security.js`

### 3. Rate Limiting

#### Endpoint-Specific Limits

```
General API:        100 requests / 15 minutes
Auth Endpoints:     5 attempts / 15 minutes  (prevents brute force)
Admin Operations:   10 requests / hour
Appointments:       10 requests / hour
AI Chat:            20 messages / minute
Feedback:           5 submissions / hour
Emergency Alerts:   10 / hour
```

**File**: `backend/config/rateLimits.js`

### 4. Security Headers

#### Helmet Configuration

- **CSP (Content Security Policy)**: Prevents XSS, injection attacks
- **HSTS**: Forces HTTPS (1 year; includes subdomains)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **Referrer-Policy**: no-referrer
- **Permissions-Policy**: Restricts camera, microphone access

**File**: `backend/server.js`

### 5. CORS Configuration

#### Allowed Origins

- Whitelist only trusted origins (frontend domain)
- Development: localhost:3000, localhost:3001
- Production: ALLOWED_ORIGINS environment variable
- Rejected origins logged to console

**File**: `backend/server.js`

### 6. Error Handling

#### Production Error Messages

- Detailed errors logged server-side
- Generic error message sent to client in production
- Stack traces hidden from client in production
- **File**: `backend/server.js`

### 7. Environment Variables

#### Required Variables (Validated on Startup)

```
GEMINI_API_KEY        (AI service)
ALLOWED_ORIGINS       (CORS whitelist)
PORT                  (Server port)
FIREBASE_SERVICE_ACCOUNT or serviceAccountKey.json
```

#### Secrets Never Logged

- GEMINI_API_KEY
- FIREBASE_SERVICE_ACCOUNT
- Use `getSafeEnvVar()` to access safely

**File**: `backend/config/envValidator.js`

### 8. Security Audit Logging

#### Logged Events

- Authentication failures (with reason and IP)
- Unauthorized admin access attempts (CRITICAL)
- All admin actions (with user ID, timestamp, IP)
- Suspicious patterns detected

#### Audit Log

- Location: `backend/logs/audit.log`
- Persistent audit trail for forensics
- Critical events logged to console
- **File**: `backend/middleware/auditLog.js`

---

## Frontend Security

### 1. Secure Storage

#### SessionStorage (Temporary - Session Lifetime)

- **Use for**: Auth tokens, session data
- **Cleared**: When browser tab closes
- Never visible to other tabs/windows

```javascript
import { storeAuthToken, getAuthToken, clearAuthToken } from "./utils/security";

// Store
storeAuthToken(token);

// Retrieve
const token = getAuthToken();

// Clear
clearAuthToken();
```

#### localStorage (Persistent - NOT for Tokens)

- **Use for**: User preferences, non-sensitive settings
- Never store passwords, tokens, or API keys

**File**: `frontend/src/utils/security.js`

### 2. Input Validation

#### Email Validation

```javascript
import { validateEmailFormat } from "./utils/security";

if (!validateEmailFormat(email)) {
  // Show error
}
```

#### Password Validation

```javascript
import { validatePasswordStrength } from "./utils/security";

const { isValid, score, feedback } = validatePasswordStrength(password);
```

**File**: `frontend/src/utils/security.js`

### 3. XSS Prevention

#### Sanitization

- Use `sanitizeHtml()` for user-generated content
- React escapes text by default (use `dangerouslySetInnerHTML` sparingly)
- **File**: `frontend/src/utils/security.js`

#### Response Validation

```javascript
import { validateApiResponse } from "./utils/security";

if (!validateApiResponse(response)) {
  // Don't render response
}
```

### 4. HTTPS Check

```javascript
import { checkHttpSecure } from "./utils/security";

useEffect(() => {
  checkHttpSecure(); // Warns if not HTTPS in production
}, []);
```

**File**: `frontend/src/utils/security.js`

### 5. Console Restrictions

In production, console is disabled to prevent sensitive data logging:

```javascript
import { secureConsole } from "./utils/security";

// Call once on app startup
secureConsole();
```

---

## Data Protection

### 1. Encryption in Transit

- **HTTPS/TLS**: All data encrypted during transmission
- **Certificate**: Must use valid SSL/TLS certificate in production
- **Redirect**: HTTP requests redirected to HTTPS

### 2. Encryption at Rest

- Firebase Firestore: Encrypted by default
- Local storage: No sensitive data stored
- Audit logs: Plain text (access controls sufficient)

### 3. Sensitive Data Handling

#### Never Store

- Plaintext passwords
- Full credit card numbers
- Social security numbers
- Medical records (unless encrypted)

#### What's Stored

- User email and UID (Firebase)
- Appointment details (non-medical)
- Feedback ratings and comments
- Audit logs (non-personal)

### 4. Data Deletion

Users have right to delete their data:

1. Firebase Authentication - automatic deletion
2. Firestore - implement deletion endpoints
3. Audit logs - retention policy (recommend 90 days)

---

## Deployment Security

### 1. Environment Variables

#### Before Deployment

```bash
# Ensure all required variables are set
PORT=5000
GEMINI_API_KEY=<your-key>
ALLOWED_ORIGINS=https://yourdomain.com
FIREBASE_SERVICE_ACCOUNT=<your-credentials>
NODE_ENV=production
```

#### Never in Version Control

- `.env` (local development)
- `serviceAccountKey.json`
- `.env.local`, `.env.*.local`
- All included in `.gitignore`

### 2. HTTPS Configuration

#### Production Must-Haves

- Valid SSL/TLS certificate (Let's Encrypt free option)
- Redirect HTTP → HTTPS
- HSTS header set (already in Helmet config)
- Certificate auto-renewal

### 3. Firewall & Network

- Restrict backend access to frontend CDN only
- Use VPC/private subnets for databases
- Enable WAF (Web Application Firewall)
- DDoS protection enabled

### 4. API Keys & Secrets

- Store in secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate regularly (90 days recommended)
- Monitor usage for anomalies
- Revoke compromised keys immediately

### 5. Monitoring & Alerting

- Monitor error rates and patterns
- Alert on authentication failures
- Alert on rate limit violations
- Alert on unauthorized admin access
- Check audit logs regularly

---

## Incident Response

### 1. Security Breach Detected

#### Immediate Actions

1. **Isolate**: Take affected systems offline if necessary
2. **Assess**: Determine scope and data affected
3. **Notify**: Alert affected users (required by law in many places)
4. **Document**: Create detailed incident report

#### Recovery Steps

```bash
# 1. Revoke compromised credentials
# In Firebase Console: Regenerate service account key

# 2. Rotate all API keys
GEMINI_API_KEY=<rotate-in-env>

# 3. Reset all user sessions
# Invalidate all Firebase ID tokens

# 4. Review audit logs
tail -100 backend/logs/audit.log

# 5. Deploy fixes
npm run build
npm start
```

### 2. Credential Compromise

#### If Service Account Key Leaked

1. Regenerate in Firebase Console
2. Update FIREBASE_SERVICE_ACCOUNT immediately
3. Rotate all other credentials
4. Review audit logs for unauthorized access
5. Deploy changes to all environments

#### If Gemini API Key Leaked

1. Regenerate in Google Cloud Console
2. Update GEMINI_API_KEY immediately
3. Monitor usage for anomalies
4. Deploy immediately

### 3. Suspicious Activity

#### Warning Signs

- Sudden spike in API requests
- Failed authentication attempts from multiple IPs
- Unauthorized admin access attempts
- Data exfiltration patterns

#### Response

1. Check audit logs: `tail -f backend/logs/audit.log`
2. Identify source IP and user
3. Block IP if necessary
4. Contact user or investigate
5. Escalate if needed

---

## Security Checklist

### Before Production Deployment

- [ ] All environment variables configured
- [ ] HTTPS certificate installed
- [ ] CORS whitelist updated (no localhost)
- [ ] Rate limiting enabled and tuned
- [ ] Error messages don't expose stack traces
- [ ] Audit logging enabled
- [ ] Database access restricted
- [ ] API keys rotated
- [ ] Security headers verified
- [ ] Input validation tested
- [ ] Penetration testing completed
- [ ] Backup & disaster recovery plan in place

### Ongoing Monitoring

- [ ] Review audit logs daily
- [ ] Monitor rate limit violations
- [ ] Check for failed auth attempts
- [ ] Verify HTTPS certificate expiration
- [ ] Update dependencies monthly
- [ ] Security patches applied within 24 hours
- [ ] User data access logged
- [ ] Backups tested monthly

---

## Resources

### Firebase Security

- https://firebase.google.com/docs/security
- https://firebase.google.com/docs/auth/security-best-practices

### OWASP Top 10

- https://owasp.org/Top10/

### Web Security Headers

- https://securityheaders.com

### Rate Limiting Best Practices

- https://owasp.org/www-community/attacks/Brute_force_attack

---

## Questions & Support

For security concerns or questions:

1. Review this document
2. Check security middleware files
3. Review audit logs
4. Contact security team
5. Submit security issues privately (don't post publicly)

---

**Last Updated**: March 17, 2026
**Next Review**: March 17, 2027
