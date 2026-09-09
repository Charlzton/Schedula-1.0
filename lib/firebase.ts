import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
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
import { getFirestore, Firestore } from "firebase/firestore";
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

// Initialize Firestore
const firestoreDbId = (appletConfig as any)?.firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
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
