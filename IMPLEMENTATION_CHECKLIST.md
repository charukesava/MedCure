# 🏥 HEALTH ASSISTANT - IMPLEMENTATION CHECKLIST

## 📋 WEEK 1: CRITICAL SECURITY FIXES (Target: 5 working days)

### Issue #1: Email Verification Enforcement ✅ (1 hour)
- [ ] Read: `frontend/src/context/AuthContext.js` lines 1-50
- [ ] **Fix**: Add `emailVerified` check in login function
- [ ] Code change location:
  ```javascript
  // Around line 25-30 in AuthContext.js
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // ADD THIS CHECK:
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
      throw new Error('Please verify your email before logging in');
    }
    setUser(result.user);
  };
  ```
- [ ] Test: Try logging in without verified email (should fail)
- [ ] Verify: Check Firebase Auth console for verification emails sent

---

### Issue #2: Image Upload File Validation ✅ (2 hours)
- [ ] Read: `backend/routes/imageAnalyze.js` entire file
- [ ] **Fix**: Add MIME type and magic number validation
- [ ] Install package: `npm install file-type`
- [ ] Code change location:
  ```javascript
  // Entire imageAnalyze.js route needs rewrite
  const FileType = require('file-type');
  
  app.post('/api/image-analyze', multer({ storage }).single('image'), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Image required' });
    
    // 1. Check MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }
    
    // 2. Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
    
    // 3. Validate magic numbers (true file type)
    const fileType = await FileType.fromBuffer(file.data);
    if (!allowedMimes.includes(fileType?.mime)) {
      return res.status(400).json({ error: 'Invalid file format' });
    }
    
    // Continue with actual analysis...
  });
  ```
- [ ] Test: Try uploading non-image files (should fail)
- [ ] Test: Try uploading 10MB image (should fail)
- [ ] Test: Try uploading valid image (should pass)

---

### Issue #3: Emergency Endpoint Rate Limiting ✅ (30 minutes)
- [ ] Read: `backend/config/rateLimits.js` entire file
- [ ] Read: `backend/routes/emergency.js` entire file
- [ ] **Fix**: Remove rate limiting from emergency endpoint
- [ ] Code location in `server.js`:
  ```javascript
  // BEFORE (line ~80):
  app.post('/api/emergency', emergencyLimiter, async (req, res) => { ... });
  
  // AFTER (remove emergencyLimiter):
  app.post('/api/emergency', async (req, res) => { ... });
  ```
- [ ] Also: Add CRITICAL-level audit logging
  ```javascript
  app.post('/api/emergency', async (req, res) => {
    auditLog('EMERGENCY_ALERT_POSTED', 'CRITICAL', {
      location: req.body.location,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    // ... rest of handler
  });
  ```
- [ ] Test: Rapid emergency requests should NOT be rate limited

---

### Issue #4: Medical Data Encryption ✅ (3 hours)
- [ ] Install: `npm install crypto` (built-in) or `npm install tweetnacl`
- [ ] Create new file: `backend/utils/encryption.js`
  ```javascript
  const crypto = require('crypto');
  
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const ALGORITHM = 'aes-256-gcm';
  
  exports.encrypt = (data) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  };
  
  exports.decrypt = (encryptedObj) => {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(encryptedObj.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
    let decrypted = decipher.update(encryptedObj.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  };
  ```
- [ ] Update `.env.example`: Add `ENCRYPTION_KEY=<random-64-char-hex>`
- [ ] Modify `backend/routes/appointments.js`:
  ```javascript
  const { encrypt, decrypt } = require('../utils/encryption');
  
  // When creating appointment:
  const appointmentData = {
    patientName: decrypt(encrypt(req.body.patientName)), // Test
    phone: decrypt(encrypt(req.body.phone)),
    symptoms: decrypt(encrypt(req.body.symptoms)),
    email: req.body.email, // Keep for contact
    // ... other fields
  };
  
  // Save: auto-encrypt before Firestore
  await db.collection('appointments').add({
    patientName: encrypt(appointmentData.patientName),
    phone: encrypt(appointmentData.phone),
    symptoms: encrypt(appointmentData.symptoms),
    email: appointmentData.email,
    createdAt: new Date()
  });
  ```
- [ ] Test: Verify encrypted data in Firestore (should be hex string)
- [ ] Test: Verify decryption works for admin viewing

---

### Issue #5: Audit Trail for Data Access ✅ (2 hours)
- [ ] Modify: `backend/middleware/auditLog.js`
  ```javascript
  // Add new function
  exports.logDataAccess = (collection, userId, ip) => {
    const timestamp = new Date().toISOString();
    auditLog(`DATA_ACCESS:${collection}`, 'INFO', {
      userId,
      collection,
      ip,
      timestamp
    });
  };
  ```
- [ ] Update all GET endpoints (read operations):
  ```javascript
  app.get('/api/appointments/user/:uid', (req, res) => {
    logDataAccess('appointments', req.uid, req.ip);
    // ... rest of handler
  });
  ```
- [ ] Verify: Check `backend/logs/audit.log` for DATA_ACCESS entries
- [ ] Test: Query appointment and verify log entry created

---

### Issue #6: Unbounded Audit Logs ✅ (1 hour)
- [ ] Install: `npm install log-rotate` or `npm install pino-rotating-file`
- [ ] Create: `backend/utils/logRotation.js`
  ```javascript
  const schedule = require('node-cron');
  const fs = require('fs');
  const path = require('path');
  
  // Rotate audit logs at midnight daily
  exports.setupLogRotation = () => {
    schedule.scheduleJob('0 0 * * *', () => {
      const auditLogPath = path.join(__dirname, '../logs/audit.log');
      if (fs.existsSync(auditLogPath)) {
        const timestamp = new Date().toISOString().split('T')[0];
        const backupPath = path.join(
          __dirname,
          `../logs/audit.${timestamp}.log`
        );
        fs.renameSync(auditLogPath, backupPath);
      }
    });
  };
  
  // Clean logs older than 90 days
  exports.cleanOldLogs = () => {
    schedule.scheduleJob('0 1 * * *', () => {
      const logsDir = path.join(__dirname, '../logs');
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      
      fs.readdirSync(logsDir).forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < ninetyDaysAgo) {
          fs.unlinkSync(filePath);
        }
      });
    });
  };
  ```
- [ ] Update `backend/server.js`:
  ```javascript
  const { setupLogRotation, cleanOldLogs } = require('./utils/logRotation');
  
  // After app initialization
  setupLogRotation();
  cleanOldLogs();
  ```
- [ ] Test: Verify logs are rotated daily

---

### Issue #7: Admin Session Management ✅ (2 hours)
- [ ] Create: `backend/utils/sessionManager.js`
  ```javascript
  const sessions = new Map(); // In production: use Redis
  
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  exports.createSession = (adminId) => {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      adminId,
      createdAt: Date.now(),
      lastActivityTime: Date.now(),
      isActive: true
    });
    return sessionId;
  };
  
  exports.validateSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    const timeSinceActivity = Date.now() - session.lastActivityTime;
    if (timeSinceActivity > SESSION_TIMEOUT) {
      session.isActive = false;
      return false;
    }
    
    session.lastActivityTime = Date.now();
    return true;
  };
  
  exports.endSession = (sessionId) => {
    sessions.delete(sessionId);
  };
  ```
- [ ] Create admin login endpoint:
  ```javascript
  app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Verify admin email
    if (!ADMIN_EMAILS_SET.has(email)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Verify with Firebase
    const user = await auth.getUserByEmail(email);
    const sessionId = createSession(user.uid);
    
    res.json({ sessionId, sessionTimeout: SESSION_TIMEOUT });
  });
  ```
- [ ] Add middleware to admin routes:
  ```javascript
  const verifyAdminSession = (req, res, next) => {
    const sessionId = req.headers['x-admin-session'];
    if (!validateSession(sessionId)) {
      return res.status(401).json({ error: 'Session expired' });
    }
    next();
  };
  
  app.get('/api/appointments', verifyAdminSession, verifyAdmin, (req, res) => {
    // ...
  });
  ```
- [ ] Test: Admin session expires after 30 min of inactivity

---

### Issue #8: Rate Limiting Memory Leak ✅ (3 hours)
- [ ] Install: `npm install redis rate-limit-redis`
- [ ] Create Redis connection in `backend/config/redis.js`:
  ```javascript
  const redis = require('redis');
  
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
  
  client.on('error', (err) => console.error('Redis error:', err));
  
  module.exports = client;
  ```
- [ ] Update `backend/config/rateLimits.js`:
  ```javascript
  const RedisStore = require('rate-limit-redis');
  const redis = require('./redis');
  const rateLimit = require('express-rate-limit');
  
  exports.apiLimiter = rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    keyGenerator: (req) => `${req.ip}:${req.path}`
  });
  
  // ... other limiters
  ```
- [ ] Update `backend/server.js` to use Redis limiters
- [ ] Test: Verify rate limits persist across server restarts

---

### Issue #9: Symptom Analysis Disclaimer ✅ (30 minutes)
- [ ] Update `backend/routes/analyze.js`:
  ```javascript
  app.post('/api/analyze', generalLimiter, (req, res) => {
    const symptoms = sanitizeInputs(req.body.symptoms);
    const analysis = ruleEngine.analyze(symptoms);
    
    // ADD DISCLAIMER
    res.json({
      condition: analysis.condition,
      severity: analysis.severity,
      firstAid: analysis.firstAid,
      consultDoctor: analysis.consultDoctor,
      disclaimer: "⚠️ IMPORTANT: This is preliminary screening only. Do not delay seeking professional medical evaluation. In case of emergency, call 911 immediately.",
      confidence: 0.65,
      requiresProfessionalReview: true
    });
  });
  ```
- [ ] Update frontend to display disclaimer prominently
- [ ] Test: Verify disclaimer appears in all responses

---

### Issue #10: Backup Strategy ✅ (2 hours)
- [ ] Install: `npm install @google-cloud/firestore-backup-restore`
- [ ] Create: `backend/utils/backup.js`
  ```javascript
  const backup = require('@google-cloud/firestore-backup-restore');
  const schedule = require('node-cron');
  
  const backupFirestore = async () => {
    try {
      console.log('Starting Firestore backup...');
      await backup.backup({
        projectId: process.env.FIREBASE_PROJECT_ID,
        bucketName: process.env.BACKUP_BUCKET_NAME,
        pathPrefix: `backup-${new Date().toISOString().split('T')[0]}`,
        databaseId: '(default)'
      });
      console.log('Backup completed successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      // Send alert
    }
  };
  
  // Schedule daily at 2 AM
  exports.setupBackupSchedule = () => {
    schedule.scheduleJob('0 2 * * *', backupFirestore);
  };
  ```
- [ ] Update `.env.example`: Add `BACKUP_BUCKET_NAME=health-assistant-backups`
- [ ] Create GCS bucket: `gsutil mb gs://health-assistant-backups`
- [ ] Test: Run backup manually and verify in GCS

---

## ✅ WEEK 1 VERIFICATION CHECKLIST

- [ ] All 10 critical issues implemented
- [ ] No existing functionality broken
- [ ] Audit logs show encrypted data access
- [ ] Email verification gates users
- [ ] Emergency endpoint never rate-limited
- [ ] Backup runs daily
- [ ] Rate limits persist across restarts
- [ ] Admin sessions timeout after 30 min
- [ ] Image upload validates file type
- [ ] All tests passing
- [ ] Deployment successful

---

## 🚀 NEXT: WEEK 2-3 CHECKLIST (HIGH-PRIORITY ISSUES)

( See AUDIT_QUICK_REFERENCE.md for Week 2-3 tasks )

---

## 📞 SUPPORT & QUESTIONS

For questions about specific issues:
1. **Security Questions**: See SECURITY.md
2. **Architecture Questions**: See COMPREHENSIVE_ARCHITECTURE_AUDIT.md
3. **Code Examples**: Check AUDIT_QUICK_REFERENCE.md
4. **Quick Overview**: This file (IMPLEMENTATION_CHECKLIST.md)

---

*Created: April 2026 | Status: Ready for Implementation*
