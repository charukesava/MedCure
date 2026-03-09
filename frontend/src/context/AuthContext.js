import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../config/firebase";

// 🔐 CREATE CONTEXT — exported so Feedback.js and other consumers can use it directly
export const AuthContext = createContext();

// 🔑 ADMIN EMAIL LIST — Set gives O(1) .has() vs Array O(n) .includes()
const ADMIN_EMAILS = new Set([
  "charukesava.k@gmail.com",
  "admin@health-assistant.com",
  "hospital.admin@gmail.com",
  "support@health-assistant.com",
]);

// 🔒 PROVIDER
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 TRACK AUTH STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ✅ SIGN UP WITH EMAIL VERIFICATION
  const signup = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth); // 🔒 block access until verified
  };

  // 🔐 LOGIN — BLOCK IF EMAIL NOT VERIFIED
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        await signOut(auth);
        const err = new Error("Please verify your email before logging in.");
        err.code = "auth/email-not-verified";
        throw err;
      }

      return cred;
    } catch (error) {
      throw error;
    }
  };

  // 🔵 GOOGLE LOGIN
  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await signOut(auth);
  };

  // 📧 UPDATE EMAIL
  const changeEmail = async (currentPassword, newEmail) => {
    if (!user) throw new Error("No user logged in");

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // 🔐 UPDATE PASSWORD
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error("No user logged in");

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // 🧠 ADMIN CHECK — memoized so it only recomputes when `user` changes
  const isAdmin = useMemo(
    () => (user ? ADMIN_EMAILS.has(user.email) : false),
    [user],
  );

  // 📦 CONTEXT VALUE
  const value = {
    user,
    loading,
    signup,
    login,
    googleLogin,
    logout,
    isAdmin,
    changeEmail,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ CUSTOM HOOK
export function useAuth() {
  return useContext(AuthContext);
}
