const admin = require("firebase-admin");

// In production, use the FIREBASE_SERVICE_ACCOUNT env var (JSON string).
// In development, fall back to the local serviceAccountKey.json file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("../serviceAccountKey.json");

// Prevent re-initialization on hot-reload
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Test Firestore connectivity on startup (non-blocking)
db.collection("_health_check")
  .limit(1)
  .get()
  .then(() => console.log("[Firestore] Connected successfully"))
  .catch((err) => {
    console.error(
      "[Firestore] Connection failed - code:",
      err.code,
      "| message:",
      err.message,
    );
    if (
      err.code === 16 ||
      (err.message && err.message.includes("UNAUTHENTICATED"))
    ) {
      console.error(
        "[Firestore] Fix: Go to https://console.cloud.google.com/iam-admin/iam?project=" +
          serviceAccount.project_id +
          "\n  Find service account: " +
          serviceAccount.client_email +
          "\n  Add role: Cloud Datastore User\n",
      );
    }
  });

module.exports = db;
