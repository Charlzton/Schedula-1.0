import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import appletConfig from "@/firebase-applet-config.json";

// Firebase configuration from firebase-applet-config.json with exact project settings
const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyAJlg589_YKwgqoESAz6wsh_i6qbI4D9EU",
  authDomain: appletConfig.authDomain || "schedula-bc58e.firebaseapp.com",
  projectId: appletConfig.projectId || "schedula-bc58e",
  storageBucket: appletConfig.storageBucket || "schedula-bc58e.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "816524197887",
  appId: appletConfig.appId || "1:816524197887:web:f25fd9b2b291ae406a31ca"
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
  updateProfile,
  updatePassword,
  fbSignOut, 
  onAuthStateChanged
};
export type { FirebaseUser };
