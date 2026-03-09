import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Read from environment variables (set in .env.local for production).
// Falls back to hardcoded values so local dev keeps working without .env.local.
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAqxPmPvDwF2bSaB3W2rN2yPVeO8Dg5hSo",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "health-assistant-9807.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "health-assistant-9807",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "health-assistant-9807.appspot.com",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "976285621510",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:976285621510:web:2dfb474fef67686dbc1287",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MCPG6TP0XG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Guard analytics initialization (may fail in some dev environments)
// Initialize analytics as a side-effect (result intentionally unused)
try {
  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    getAnalytics(app);
  }
} catch (e) {
  // ignore analytics errors in development
}

export const auth = getAuth(app);
