// Firebase Authentication helpers
// All auth operations go through this module — keeps the UI layer thin.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  AuthError,
} from "firebase/auth";
import { auth } from "./firebase";

// ─── Error message mapper ────────────────────────────────────────────────────
export function firebaseErrorMessage(err: unknown): string {
  const code = (err as AuthError)?.code ?? "";
  const messages: Record<string, string> = {
    "auth/invalid-email":           "That doesn't look like a valid email address.",
    "auth/user-not-found":          "No account found with that email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/too-many-requests":       "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed":  "Network error. Check your connection and try again.",
    "auth/invalid-credential":      "Invalid email or password.",
    "auth/operation-not-allowed":   "Email/Password sign-in is not enabled. Check Firebase console.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function firebaseSignUp(email: string, password: string, displayName?: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export async function firebaseSignIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function firebaseSendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  await signOut(auth);
}

// ─── Current user (sync snapshot) ────────────────────────────────────────────
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}
