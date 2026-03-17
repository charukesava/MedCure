# 🧪 End-to-End Security Testing Guide

## Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- All environment variables configured
- `.env` files created in both backend and frontend

---

## ✅ Step 1: Backend Startup Verification

### 1.1 Start Backend

```bash
cd backend
npm start
```

**Expected Output:**

```
🔐 Starting Security Validation...
✅ All required environment variables are configured
✅ Firebase configured via serviceAccountKey.json
✅ All security validations passed!
Server is running on port 5000
```

**What's Being Tested:**

- Environment variable validation
- Security middleware loading
- Rate limiter initialization
- Helmet security headers setup

---

## ✅ Step 2: Rate Limiting Tests

### 2.1 Test Authentication Rate Limit (5 attempts per 15 min)

**Using Curl (or Postman):**

```bash
# Attempt 1-5: Should succeed
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Attempt 6: Should return 429 (Too Many Requests)
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Pass Criteria:**

- ✅ First 5 requests get normal responses (200/400)
- ✅ Request 6+ gets `429 Too Many Requests`
- ✅ Response includes `Retry-After` header

### 2.2 Test Feedback Rate Limit (5 per hour)

```bash
# Attempt 1-5: Should succeed
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/feedback \
    -H "Content-Type: application/json" \
    -d '{"rating": 5, "comment": "Good service"}'
done

# Attempt 6: Should get 429
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Good service"}'
```

**Pass Criteria:**

- ✅ First 5 return `{ success: true }`
- ✅ Request 6+ returns `429` with rate limit message

### 2.3 Test AI Chat Rate Limit (20 per minute)

```bash
# Rapid-fire 20 requests should work
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/ai \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}' &
done
wait

# 21st request should get 429
curl -X POST http://localhost:5000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

**Pass Criteria:**

- ✅ 20 requests succeed
- ✅ Request 21+ gets `429`

---

## ✅ Step 3: Input Validation Tests

### 3.1 Test SQL Injection Prevention

**Attempt SQL Injection:**

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "hospitalName": "Hospital",
    "date": "2024-12-25",
    "time": "10:00",
    "patientName": "x'; DROP TABLE appointments; --",
    "phone": "9876543210"
  }'
```

**Pass Criteria:**

- ✅ Request is sanitized
- ✅ Malicious input is rejected or cleaned
- ✅ No SQL injection payload executed

### 3.2 Test XSS Prevention

**Attempt XSS Injection:**

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "<script>alert(\"XSS\")</script>"
  }'
```

**Pass Criteria:**

- ✅ Malicious script tags are removed or escaped
- ✅ Feedback is saved with cleaned content
- ✅ No script execution occurs

### 3.3 Test Invalid Format Rejection

**Send Invalid Date:**

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "hospitalName": "Hospital",
    "date": "invalid-date",
    "time": "25:99",
    "patientName": "Test"
  }'
```

**Pass Criteria:**

- ✅ Returns `400` with validation error
- ✅ Error message is descriptive
- ✅ Error doesn't expose system internals

---

## ✅ Step 4: Authentication & Authorization Tests

### 4.1 Test Token Verification

**Without Token:**

```bash
curl http://localhost:5000/api/appointments
```

**Expected:**

- ✅ Returns `401 Unauthorized` or similar

**With Valid Token:**

```bash
# Get token from Firebase auth, then:
curl http://localhost:5000/api/appointments \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Expected:**

- ✅ Request is processed
- ✅ Audit log captures the request

### 4.2 Test Admin-Only Endpoints

**Without Admin Credentials:**

```bash
curl -X POST http://localhost:5000/api/hospital-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NON_ADMIN_TOKEN>" \
  -d '{"hospitalName": "Test", "title": "Update"}'
```

**Expected:**

- ✅ Returns `403 Forbidden`
- ✅ Request is logged as unauthorized attempt

---

## ✅ Step 5: Audit Logging Tests

### 5.1 Check Audit Logs

```bash
# On server, check audit log
tail -f backend/logs/audit.log
```

**Expected Log Entries:**

```
[2024-12-17T10:30:45...] [INFO] Event: login_attempt | User: user@example.com | IP: 127.0.0.1
[2024-12-17T10:30:46...] [CRITICAL] Event: unauthorized_admin_access | User: regular@user.com | IP: 127.0.0.1
[2024-12-17T10:30:50...] [INFO] Event: password_reset_request | User: user@example.com
```

**Pass Criteria:**

- ✅ Logs contain timestamp, severity, event type
- ✅ User info is included
- ✅ IP address is recorded

---

## ✅ Step 6: Error Handling Tests

### 6.1 Test Error Masking in Production

**Development Mode:**

```bash
NODE_ENV=development npm start
# Make error - should show stack trace
curl http://localhost:5000/api/nonexistent
```

**Expected:** Detailed error with stack trace

**Production Mode:**

```bash
NODE_ENV=production npm start
# Make error - should hide details
curl http://localhost:5000/api/nonexistent
```

**Expected:** Generic error message like `"An error occurred. Please try again later."`

---

## ✅ Step 7: Frontend Security Tests

### 7.1 Start Frontend

```bash
cd frontend
npm start
```

**Expected:**

- ✅ App loads at `http://localhost:3000`
- ✅ Browser console shows HTTPS check (development warning is OK)

### 7.2 Test Password Strength Validation

1. Go to Signup page
2. Enter password `123` (too weak)
3. **Expected:** Red "Very Weak" indicator, submit button disabled
4. Enter password `MyP@ssw0rd!` (strong)
5. **Expected:** Green "Good" indicator, submit enabled

### 7.3 Test Secure Token Storage

1. Login with valid credentials
2. Open browser DevTools → Application → SessionStorage
3. **Expected:** Session data present, tokens in sessionStorage
4. Open Application → LocalStorage
5. **Expected:** Auth tokens NOT in localStorage (security check)

### 7.4 Test Session Clearing

1. Login and get authenticated
2. Close the browser tab
3. Open new tab, go to app
4. **Expected:** Session cleared, need to login again (proves sessionStorage works)

---

## ✅ Step 8: Security Checklist Script

### 8.1 Run Pre-Deployment Checklist

```bash
# On Windows PowerShell:
bash scripts/security-checklist.sh

# Expected output should show:
# ✓ Environment variables present
# ✓ No hardcoded secrets
# ✓ Rate limits configured
# ✓ Audit logging enabled
# ✓ Firebase config valid
# ✗ HTTPS not yet enabled (OK for dev)
```

---

## 📋 Manual Test Checklist

Use this to track all tests:

### Backend Security

- [ ] Server starts with security validation
- [ ] Rate limiting blocks after N requests
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are cleaned/blocked
- [ ] Invalid format inputs are rejected
- [ ] Admin endpoints reject non-admin users
- [ ] Audit logs are created
- [ ] Production mode hides error details

### Frontend Security

- [ ] Signup shows password strength
- [ ] Weak passwords are rejected
- [ ] Strong passwords are accepted
- [ ] Tokens stored in sessionStorage only
- [ ] Session clears on tab close
- [ ] HTTPS warning in production (expected)

### Rate Limiting

- [ ] Appointments limited to 10/hour
- [ ] Feedback limited to 5/hour
- [ ] AI chat limited to 20/minute
- [ ] General API limited to 100/15min
- [ ] Emergency alerts limited to 10/hour

---

## 🔴 Common Issues & Solutions

### Issue: "FIREBASE_SERVICE_ACCOUNT not set"

- **Cause:** Environment variable not configured
- **Fix:** Ensure `.env` has `FIREBASE_SERVICE_ACCOUNT=path/to/serviceAccountKey.json`

### Issue: Rate limiter not working

- **Cause:** Rate limiter not applied to route
- **Fix:** Check that route has limiter: `router.post("/", limiter, handler)`

### Issue: "Port 5000 already in use"

- **Cause:** Backend already running
- **Fix:** Kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux) or check Windows Task Manager

### Issue: CORS errors in frontend

- **Cause:** Frontend URL not in `ALLOWED_ORIGINS`
- **Fix:** Add frontend URL to `backend/.env` ALLOWED_ORIGINS

### Issue: Password validation not showing

- **Cause:** Module not imported
- **Fix:** Check Signup.js has `import { validatePasswordStrength } from "../utils/security"`

---

## ✅ When All Tests Pass

1. ✅ All manual tests pass
2. ✅ Pre-deployment checklist shows green
3. ✅ No console errors
4. ✅ Audit logs are being created
5. ✅ Rate limits are enforced
6. ✅ Errors are properly masked in production

**Then you're ready for deployment!** 🚀

---

## 📞 Next Steps

1. **Configure SSL/TLS** for production HTTPS
2. **Set environment variables** on production server
3. **Enable database backups**
4. **Set up monitoring** for audit logs
5. **Deploy with confidence**

---

## 🆘 Need Help?

- Check `SECURITY.md` for architecture details
- Check `DEVELOPER_SECURITY_GUIDE.md` for code examples
- Review `backend/logs/audit.log` for security events
- Check `backend/.env` configuration
