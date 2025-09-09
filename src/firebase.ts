import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Read config from Vite env variables with safe defaults
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) ?? "AIzaSyCitdvef0nFnrxlUrw0zC1WQGxaf2osFig",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ?? "menu-resto-ph.firebaseapp.com",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ?? "menu-resto-ph",
  // Accept either a bucket name or a gs:// URL; normalize if needed
  storageBucket: (() => {
    const raw = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ?? "menu-resto-ph.firebasestorage.app";
    return raw.startsWith("gs://") ? raw.replace(/^gs:\/\//, "") : raw;
  })(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ?? "xxxxxxxx",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) ?? "1:603076512823:web:bf700986987815a37a43b2",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;


