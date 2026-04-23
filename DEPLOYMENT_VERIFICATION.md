# 🚀 DEPLOYMENT & VERIFICATION GUIDE

**Critical Fixes Version**: 1.0  
**Deployment Date**: April 21, 2026

---

## ⚡ PRE-DEPLOYMENT CHECKLIST

Before deploying these critical fixes, verify:

- [ ] All files committed to git (backup created)
- [ ] `.env` file has `DATA_ENCRYPTION_KEY` set (64 hex chars)
- [ ] Backend dependencies up to date (`npm install`)
- [ ] Frontend dependencies up to date (`npm install`)
- [ ] No uncommitted changes that could conflict
- [ ] Development database backed up (if using real data)
- [ ] Team notified of deployment

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Generate Encryption Key

```bash
# Generate a new 256-bit encryption key
node -e "console.log('DATA_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# DATA_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 2: Update Backend Environment

**For local development**:
```bash
# Edit backend/.env
DATA_ENCRYPTION_KEY=<paste_output_from_step_1>
```

**For production**:
```bash
# Add to secret manager (AWS, GCP, Azure, etc.)
# Export as environment variable before starting service
export DATA_ENCRYPTION_KEY=<secure_key>
npm start
```

### Step 3: Verify Backend Startup

```bash
cd backend
npm install  # Install any new dependencies
npm start    # Start server

# Expected output:
# ✅ All required environment variables are configured
# ✅ Firebase initialized
# 📋 Environment Configuration:
#    NODE_ENV: development
#    PORT: 5000
#    ALLOWED_ORIGINS: http://localhost:3000,...
#    GEMINI_API_KEY: ✓ SET
#    FIREBASE_SERVICE_ACCOUNT: ✓ SET
#    DATA_ENCRYPTION_KEY: ✓ SET  <-- NEW
```

### Step 4: Verify Frontend Startup

```bash
cd frontend
npm install
npm start

# App should start with no errors
# Check browser console for any warnings
```

### Step 5: Test Critical Fixes

**Test #1: Email Verification**
```
1. Go to http://localhost:3000/signup
2. Sign up with test email
3. Should NOT be logged in automatically
4. Try logging in with unverified email
5. Should see: "Email not verified. Check your inbox..."
6. Click "Resend Verification Email" (new button)
7. Verify email in Firebase console or email inbox
8. Login should now work
```

**Test #2: Appointment Encryption**
```
1. Create new appointment: POST /api/appointments
   Body: {
     userId: "test-user-1",
     hospitalName: "Test Hospital",
     date: "2026-05-01",
     time: "14:00",
     patientName: "John Doe",
     phone: "9876543210",
     notes: "Test appointment"
   }
2. Check backend logs for: [INFO] Event: APPOINTMENT_CREATED
3. Retrieve appointments: GET /api/appointments
4. Should receive decrypted data (can read patientName, phone, notes)
5. Check raw database/memory store (if possible)
   - patientName, phone, notes should be encrypted objects
   - Should have { encrypted: "...", iv: "...", authTag: "..." } structure
```

**Test #3: Emergency Endpoint**
```
1. Spam emergency endpoint: POST /api/emergency (multiple times)
   Body: { location: "123 Main St", message: "Test" }
2. All should succeed (200 response)
3. Should NOT see "Too many requests" error
4. Check audit.log for: [CRITICAL] Event: EMERGENCY_ALERT_POSTED
```

**Test #4: Audit Logging**
```
1. Check backend/logs/audit.log file
2. Should contain entries like:
   - [INFO] Event: APPOINTMENT_CREATED
   - [INFO] Event: DATA_ACCESS:appointments
   - [CRITICAL] Event: EMERGENCY_ALERT_POSTED
3. Each entry should have: timestamp, event type, user ID, IP address
```

---

## 🔍 VERIFICATION TESTS

### Automated Tests (When Ready)

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Both should pass 100%
```

### Manual Verification

**Check 1: Backend Starts Without Errors**
```bash
cd backend
npm start

# Look for:
# ✅ All required environment variables are configured
# ✅ Firebase initialized
# [Express] Server running on port 5000

# Should NOT have:
# ❌ DATA_ENCRYPTION_KEY not set
# ❌ Error during startup
```

**Check 2: Encryption Key is Loaded**
```bash
# Add this temporary code to server.js to verify:
const { getEncryptionKey } = require('./utils/encryption');
try {
  const key = getEncryptionKey();
  console.log('✅ Encryption key loaded successfully');
} catch (error) {
  console.error('❌ Encryption key error:', error.message);
  process.exit(1);
}

# Run npm start, should see: ✅ Encryption key loaded successfully
```

**Check 3: Appointments Are Encrypted**
```bash
# Create appointment via API
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "hospitalName": "Hospital A",
    "date": "2026-05-01",
    "time": "10:00",
    "patientName": "John Doe",
    "phone": "9876543210"
  }'

# Response should have encrypted fields:
{
  "id": 1,
  "patientName": {
    "encrypted": "abc123def456...",
    "iv": "xyz789uvw012...",
    "authTag": "123456789abcdef..."
  },
  "phone": { ... encrypted ...},
  ...
}

# Get appointment (should be decrypted):
curl http://localhost:5000/api/appointments/user/test-user

# Response should have plaintext fields:
{
  "id": 1,
  "patientName": "John Doe",  # <-- Decrypted!
  "phone": "9876543210",       # <-- Decrypted!
  ...
}
```

---

## 🆘 TROUBLESHOOTING

### Issue: "DATA_ENCRYPTION_KEY not set in environment"

**Solution**:
```bash
# 1. Check if key is set
echo $DATA_ENCRYPTION_KEY

# 2. If empty, add to backend/.env
DATA_ENCRYPTION_KEY=a1b2c3d4e5f6...

# 3. If using Docker, verify env var is passed
docker run -e DATA_ENCRYPTION_KEY=a1b2c3d4... health-assistant

# 4. Restart server
npm start
```

### Issue: "Invalid encrypted object structure"

**Solution**:
```
This means decryption is being attempted on non-encrypted data.
Possible causes:
1. Database has old non-encrypted appointments
2. Mixed encrypted and non-encrypted data
3. Different encryption key between sessions

Actions:
1. Clear test data and start fresh
2. Verify same encryption key is used throughout
3. Check database for existing encrypted/non-encrypted records
```

### Issue: "Failed to decrypt data - may be corrupted or using wrong key"

**Solution**:
```
Encryption key doesn't match the data. This can happen if:
1. Used different key to encrypt than decrypt
2. Key was rotated but old data still uses old key
3. Data was corrupted

Actions:
1. Verify DATA_ENCRYPTION_KEY matches what was used to encrypt
2. If keys differ, need to re-encrypt all data with new key
3. For development: delete test data and start fresh
4. For production: implement key rotation migration
```

### Issue: "EMAIL VERIFICATION NOT ENFORCED"

**Solution**:
```
Check that firebase.js and AuthContext.js have email verification enabled:

1. In browser console, test:
   const user = auth.currentUser;
   console.log('Email verified:', user.emailVerified);

2. Try logging in without verified email
   Should see error: "Please verify your email before logging in."

3. If not working, check:
   - AuthContext.js has: if (!cred.user.emailVerified) { throw error; }
   - Firebase auth settings allow email verification
```

---

## 🔄 ROLLBACK PROCEDURE

If critical issue found after deployment:

**Quick Rollback (Restore Previous Version)**:
```bash
# 1. Stop running services
# 2. Revert git commits
git revert HEAD~1  # Revert last 6 changes

# 3. Remove encryption key from .env
# 4. Clear test appointments (or re-encrypt with old process)
# 5. Restart services
npm start
```

**Partial Rollback (Keep Some Fixes, Revert Others)**:
```bash
# Revert only appointments encryption, keep emergency fix:
git diff HEAD~6 backend/routes/appointments.js > rollback.patch
git apply -R rollback.patch
```

---

## 📊 MONITORING POST-DEPLOYMENT

**Monitor these metrics**:

1. **Error Rate**: Should remain < 1%
2. **Audit Logs**: Should have entries for each action
3. **Encryption**: All appointments should have encrypted fields
4. **Email Verification**: All new users should be verified before login
5. **Emergency Endpoint**: Should have no rate limit errors

**Commands to Check**:
```bash
# Check logs for errors
tail -f backend/logs/audit.log

# Count appointments (should show some encrypted)
curl http://localhost:5000/api/appointments | grep "encrypted"

# Test emergency endpoint (should all succeed)
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/emergency \
    -H "Content-Type: application/json" \
    -d '{"location":"test"}' &
done
```

---

## ✅ POST-DEPLOYMENT SIGN-OFF

Once deployment is verified and working:

```
Deployment Verification Checklist:
- [ ] Backend starts without encryption key errors
- [ ] Frontend loads without errors
- [ ] Email verification enforced (tested)
- [ ] Appointments encrypted (verified in database)
- [ ] Audit logs created (entries present)
- [ ] Emergency endpoint not rate-limited (tested)
- [ ] No errors in audit.log file
- [ ] All manual tests passed
- [ ] Monitoring alerts configured
- [ ] Team notified of changes

Signature: _____________________ Date: __________
```

---

## 📞 SUPPORT

If issues occur:

1. Check troubleshooting section above
2. Review `CRITICAL_FIXES_SUMMARY.md` for implementation details
3. Check `backend/logs/audit.log` for error details
4. Verify `DATA_ENCRYPTION_KEY` is properly set
5. Review `COMPREHENSIVE_ARCHITECTURE_AUDIT.md` for security context

---

*Deployment Guide - Critical Security Fixes v1.0*  
*For questions, refer to security team or architecture documentation*
