import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Read config from Next.js env variables with safe defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCitdvef0nFnrxlUrw0zC1WQGxaf2osFig",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "menu-resto-ph.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "menu-resto-ph",
  // Accept either a bucket name or a gs:// URL; normalize if needed
  storageBucket: (() => {
    const raw = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "menu-resto-ph.firebasestorage.app";
    return raw.startsWith("gs://") ? raw.replace(/^gs:\/\//, "") : raw;
  })(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "xxxxxxxx",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:603076512823:web:bf700986987815a37a43b2",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;


