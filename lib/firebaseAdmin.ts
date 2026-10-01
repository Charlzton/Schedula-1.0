import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "schedula-bc58e";

  if (serviceAccountVar) {
    try {
      const serviceAccount = typeof serviceAccountVar === "string" ? JSON.parse(serviceAccountVar) : serviceAccountVar;
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back to credentials/projectId:", e);
      adminApp = initializeApp({
        projectId: projectId
      });
    }
  } else if (clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n")
        }),
        projectId: projectId
      });
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin with clientEmail/privateKey:", e);
      adminApp = initializeApp({
        projectId: projectId
      });
    }
  } else {
    adminApp = initializeApp({
      projectId: projectId
    });
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}

/**
 * Helper to authenticate and authorize an incoming API request.
 * Returns the decoded token and caller data if valid, or throws/returns error response.
 */
export async function authenticateApiCaller(authHeader: string | null): Promise<{
  uid: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'lecturer';
  callerDocData: any;
}> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid authorization header");
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  const idToken = authHeader.substring(7);
  const decodedToken = await auth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  const email = (decodedToken.email || "").toLowerCase().trim();

  // Primary super admin fallback
  const isPrimarySuperAdmin = email === "charlestonkyeremeh6@gmail.com";

  const userDocSnap = await db.collection("users").doc(uid).get();
  let callerDocData = userDocSnap.exists ? userDocSnap.data() : null;

  let role: 'super_admin' | 'admin' | 'lecturer' = 'lecturer';
  if (isPrimarySuperAdmin) {
    role = 'super_admin';
  } else if (callerDocData?.role) {
    const r = String(callerDocData.role).toLowerCase();
    if (r === 'super_admin' || r === 'admin' || r === 'lecturer') {
      role = r;
    }
  }

  return {
    uid,
    email,
    role,
    callerDocData
  };
}
