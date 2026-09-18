import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signInWithCustomToken,
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import appletConfig from "@/firebase-applet-config.json";

// Firebase configuration supporting process.env overrides with appletConfig fallbacks
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || appletConfig.apiKey || "AIzaSyAJlg589_YKwgqoESAz6wsh_i6qbI4D9EU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "schedula-bc58e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || appletConfig.projectId || "schedula-bc58e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "schedula-bc58e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "816524197887",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || appletConfig.appId || "1:816524197887:web:f25fd9b2b291ae406a31ca"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with robust Long Polling settings for sandboxed iframe/proxy environments
const firestoreDbId = (appletConfig as any)?.firestoreDatabaseId;
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
  }, firestoreDbId || undefined);
} catch {
  firestoreInstance = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
}
export const db = firestoreInstance;

// Initialize Firebase Storage
export const storage = getStorage(app);

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signInWithCustomToken,
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  updateProfile,
  updatePassword,
  fbSignOut, 
  onAuthStateChanged
};
export type { FirebaseUser };
