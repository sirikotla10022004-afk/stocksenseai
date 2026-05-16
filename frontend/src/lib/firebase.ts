// Firebase App Initialization
// Configure via .env.local — never hard-code credentials in source.

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key_here") {
    throw new Error("Firebase API key is missing or placeholder.");
  }
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Fallback to a dummy app/auth if needed to prevent total crash
  // But for now, we'll just export nulls and handle them in the UI
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { auth };
export default app;
