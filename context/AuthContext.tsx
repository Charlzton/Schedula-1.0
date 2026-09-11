'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  updateProfile,
  updatePassword,
  fbSignOut, 
  onAuthStateChanged,
  FirebaseUser 
} from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Lecturer, INITIAL_LECTURERS } from '@/lib/dataset';
import { 
  createAdministratorAccount, 
  getAdministratorAccounts, 
  updateAdministratorRole, 
  deleteUserAccount,
  AdminUserRecord 
} from '@/lib/adminAuthService';
import { uploadProfileImageToStorage } from '@/lib/storage';

export type UserRole = 'super_admin' | 'admin' | 'lecturer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: UserRole;
  institution?: string;
  provider: 'email' | 'google';
  lecturerId?: string;
}

interface AuthContextType {
  user: User | null;
  lecturerProfile: Lecturer | null;
  isLoading: boolean;
  isSigningOut: boolean;
  signInWithEmail: (email: string, password: string, portalRole?: UserRole) => Promise<{ success: boolean; error?: string; unverified?: boolean; email?: string; code?: string; targetRoute?: string }>;
  signUpWithEmail: (name: string, email: string, password: string, institution?: string, portalRole?: UserRole) => Promise<{ success: boolean; error?: string; code?: string; targetRoute?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  signInWithGoogle: (portalRole?: UserRole) => Promise<{ success: boolean; error?: string; code?: string; targetRoute?: string }>;
  updateUserProfile: (nameOrData: string | { name?: string; avatar?: any }, avatar?: any) => Promise<{ success: boolean; error?: string }>;
  updateLecturerProfile: (details: Partial<Lecturer>) => Promise<{ success: boolean; error?: string }>;
  updateLecturerProfileDetails: (details: Partial<Lecturer>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  removeProfilePicture: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  createAdmin: (params: { fullName: string; email: string; password: string; role: 'admin' | 'super_admin'; institution?: string }) => Promise<{ success: boolean; error?: string }>;
  updateAdminRole: (userId: string, newRole: 'admin' | 'super_admin') => Promise<{ success: boolean; error?: string }>;
  deleteAdminAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteCurrentUserAccount: () => Promise<{ success: boolean; error?: string }>;
  getAdministrators: () => Promise<AdminUserRecord[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'schedula-auth-user';
const LECTURER_STORAGE_KEY = 'schedula-auth-lecturer';

async function findLecturerById(lecturerId: string): Promise<Lecturer | null> {
  const cleanId = lecturerId.trim();
  if (!cleanId) return null;

  try {
    const docSnap = await getDoc(doc(db, 'lecturers', cleanId));
    if (docSnap.exists()) {
      const data = docSnap.data() as Lecturer;
      return {
        ...data,
        lecturerId: data.lecturerId || docSnap.id,
        accountStatus: data.accountStatus || (data.authUid ? 'active' : 'unclaimed')
      };
    }
  } catch (err) {
    console.warn('Firestore lecturer search by ID note:', err);
  }

  return null;
}

/**
 * Helper to match an email against the lecturer catalog in Firestore
 */
async function findLecturerByEmail(email: string): Promise<Lecturer | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const lecturersSnap = await getDocs(collection(db, 'lecturers'));
    if (!lecturersSnap.empty) {
      for (const docSnap of lecturersSnap.docs) {
        const data = docSnap.data() as Lecturer;
        const offEmail = (data.officeEmail || '').trim().toLowerCase();
        const persEmail = (data.email || '').trim().toLowerCase();
        if (offEmail === cleanEmail || persEmail === cleanEmail) {
          return {
            ...data,
            lecturerId: data.lecturerId || docSnap.id,
            accountStatus: data.accountStatus || (data.authUid ? 'active' : 'unclaimed')
          };
        }
      }
    }
  } catch (err) {
    console.warn('Firestore lecturer search note:', err);
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lecturerProfile, setLecturerProfile] = useState<Lecturer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  useEffect(() => {
    let unsubUserDoc: Unsubscribe | null = null;
    let unsubLecturerDoc: Unsubscribe | null = null;
    let activeLecturerIdSubscribed: string | null = null;
    let isTerminatingSession = false;
    let initialUserDocResolved = false;

    const cleanupListeners = () => {
      if (unsubUserDoc) {
        try { unsubUserDoc(); } catch {}
        unsubUserDoc = null;
      }
      if (unsubLecturerDoc) {
        try { unsubLecturerDoc(); } catch {}
        unsubLecturerDoc = null;
      }
      activeLecturerIdSubscribed = null;
      initialUserDocResolved = false;
    };

    const terminateSession = async (reason?: string) => {
      if (isTerminatingSession) return;
      isTerminatingSession = true;
      cleanupListeners();

      setUser(null);
      setLecturerProfile(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(LECTURER_STORAGE_KEY);
      } catch {}

      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Real-time session termination notice:', err);
      } finally {
        setIsLoading(false);
        isTerminatingSession = false;
      }
    };

    const subscribeToLecturerDoc = (lecturerId: string) => {
      const cleanId = (lecturerId || '').trim();
      if (!cleanId || activeLecturerIdSubscribed === cleanId) return;

      if (unsubLecturerDoc) {
        try { unsubLecturerDoc(); } catch {}
        unsubLecturerDoc = null;
      }

      activeLecturerIdSubscribed = cleanId;
      const lecturerDocRef = doc(db, 'lecturers', cleanId);

      unsubLecturerDoc = onSnapshot(
        lecturerDocRef,
        (lecSnap) => {
          if (!lecSnap.exists()) {
            terminateSession('Your lecturer profile was removed by an administrator');
            return;
          }
          const lecData = lecSnap.data() as Lecturer;

          // 1. Account suspension detection:
          // Immediately terminate session if lecturer is suspended
          if (lecData.accountStatus === 'suspended') {
            terminateSession('Lecturer account suspended');
            return;
          }

          // 2. Normal profile updates (name, avatar, title, department, email, phone, etc.)
          // Seamlessly update lecturer profile and app user without terminating session
          setLecturerProfile(prev => {
            const updated: Lecturer = {
              ...(prev || {}),
              ...lecData,
              lecturerId: lecData.lecturerId || lecSnap.id,
              accountStatus: lecData.accountStatus || 'active'
            };
            try {
              localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });

          setUser(prev => {
            if (!prev) return null;
            const updated: User = {
              ...prev,
              name: lecData.fullName || prev.name,
              avatar: lecData.avatar !== undefined ? lecData.avatar : prev.avatar
            };
            try {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        },
        (error) => {
          console.warn('Real-time lecturer doc listener notice:', error);
        }
      );
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Clean up any stale listeners from previous account
        cleanupListeners();

        const cleanEmail = (firebaseUser.email || '').toLowerCase().trim();
        const isPrimarySuperAdmin = cleanEmail === 'charlestonkyeremeh6@gmail.com';

        let fetchedAvatar = firebaseUser.photoURL || undefined;
        let fetchedName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        let fetchedRole: UserRole = 'lecturer'; // Default role, resolved authoritatively via Firestore
        let cachedLecturer: Lecturer | null = null;

        // Check local storage cache as the first source of truth for custom settings before Firestore responds
        try {
          const cached = localStorage.getItem(AUTH_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id === firebaseUser.uid) {
              if (parsed.avatar) fetchedAvatar = parsed.avatar;
              if (parsed.name) fetchedName = parsed.name;
              if (parsed.role) {
                const r = String(parsed.role).toLowerCase();
                if (r === 'super_admin') fetchedRole = 'super_admin';
                else if (r === 'admin') fetchedRole = 'admin';
                else if (r === 'lecturer') fetchedRole = 'lecturer';
              }
            }
          }
          const cachedLec = localStorage.getItem(LECTURER_STORAGE_KEY);
          if (cachedLec) {
            cachedLecturer = JSON.parse(cachedLec);
          }
        } catch {}

        if (cachedLecturer) {
          setLecturerProfile(cachedLecturer);
          if (cachedLecturer.lecturerId) {
            subscribeToLecturerDoc(cachedLecturer.lecturerId);
          }
        }

        const appUser: User = {
          id: firebaseUser.uid,
          name: fetchedName,
          email: firebaseUser.email || 'user@example.com',
          avatar: fetchedAvatar,
          role: fetchedRole,
          provider: firebaseUser.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email',
          lecturerId: cachedLecturer?.lecturerId
        };

        // Immediately update auth context to unblock the router and render the UI instantly
        setUser(appUser);
        setIsLoading(false);

        // Attach real-time snapshot listener on /users/{uid}
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubUserDoc = onSnapshot(
          userDocRef,
          async (userDocSnap) => {
            // Handle deletion of /users/{uid}
            if (!userDocSnap.exists()) {
              if (initialUserDocResolved) {
                // User document was deleted in real time by an administrator
                terminateSession('User document deleted');
                return;
              }

              // Initial snapshot grace period to prevent race condition during active sign-up
              setTimeout(() => {
                if (!initialUserDocResolved && !isTerminatingSession) {
                  getDoc(userDocRef).then((checkSnap) => {
                    if (!checkSnap.exists() && !isTerminatingSession) {
                      if (isPrimarySuperAdmin) {
                        setDoc(userDocRef, {
                          id: firebaseUser.uid,
                          name: fetchedName || 'Lead Academic Administrator',
                          email: cleanEmail,
                          role: 'super_admin',
                          institution: 'University of Ghana'
                        }, { merge: true }).catch(() => {});
                      } else {
                        terminateSession('User document not found');
                      }
                    }
                  }).catch(() => {});
                }
              }, 1500);
              return;
            }

            initialUserDocResolved = true;
            const userData = userDocSnap.data();

            // 1. Suspension check on /users/{uid}
            if (userData?.status === 'suspended' || userData?.accountStatus === 'suspended') {
              terminateSession('User account suspended');
              return;
            }

            // 2. Resolve authoritative role
            let finalRole: UserRole = fetchedRole;
            if (isPrimarySuperAdmin) {
              finalRole = 'super_admin';
              if (userData?.role !== 'super_admin') {
                setDoc(userDocRef, {
                  id: firebaseUser.uid,
                  name: userData?.name || fetchedName || 'Lead Academic Administrator',
                  email: cleanEmail,
                  role: 'super_admin',
                  institution: 'University of Ghana'
                }, { merge: true }).catch(() => {});
              }
            } else if (userData?.role) {
              const r = String(userData.role).toLowerCase();
              if (r === 'super_admin') finalRole = 'super_admin';
              else if (r === 'admin') finalRole = 'admin';
              else if (r === 'lecturer') finalRole = 'lecturer';
            }

            const finalName = userData?.name || fetchedName;
            const finalAvatar = userData?.avatar !== undefined ? userData.avatar : fetchedAvatar;

            // 3. Resolve and listen to associated lecturer directory record
            let currentLecturerId = userData?.lecturerId;
            if (!currentLecturerId && cleanEmail) {
              try {
                const matched = await findLecturerByEmail(cleanEmail);
                if (matched) {
                  currentLecturerId = matched.lecturerId;
                  setDoc(userDocRef, { lecturerId: matched.lecturerId }, { merge: true }).catch(() => {});
                }
              } catch {}
            }

            if (currentLecturerId) {
              subscribeToLecturerDoc(currentLecturerId);
            }

            // 4. Update user state smoothly for profile edits (name, avatar, title, department, institution)
            setUser(prev => {
              const updated: User = {
                id: firebaseUser.uid,
                name: finalName,
                email: firebaseUser.email || cleanEmail || 'user@example.com',
                avatar: finalAvatar,
                role: finalRole,
                provider: firebaseUser.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email',
                institution: userData?.institution || prev?.institution,
                lecturerId: currentLecturerId || prev?.lecturerId
              };
              try {
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });

            setIsLoading(false);
          },
          (error) => {
            console.warn('Real-time user doc listener notice:', error);
            if (error.code === 'permission-denied' && initialUserDocResolved) {
              terminateSession('Access revoked');
            }
          }
        );
      } else {
        cleanupListeners();
        setUser(null);
        setLecturerProfile(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(LECTURER_STORAGE_KEY);
        } catch {}
        setIsLoading(false);
      }
    });

    return () => {
      cleanupListeners();
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (
    email: string, 
    password: string, 
    portalRole: UserRole = 'admin'
  ): Promise<{ success: boolean; error?: string; unverified?: boolean; email?: string; code?: string; targetRoute?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your email address.', code: 'auth/missing-email' };
      }
      if (!password) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your password.', code: 'auth/missing-password' };
      }

      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      // 2. Fetch authoritative user document from Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let finalUserData = userDocSnap.exists() ? userDocSnap.data() : null;

      // Determine user's assigned role in Firestore
      const isPrimarySuperAdmin = cleanEmail.toLowerCase() === 'charlestonkyeremeh6@gmail.com';
      if (!finalUserData && isPrimarySuperAdmin) {
        const bootstrapRecord = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Lead Academic Administrator',
          email: cleanEmail,
          role: 'super_admin' as const,
          institution: 'University of Ghana',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, bootstrapRecord);
        finalUserData = bootstrapRecord;
      }

      const rawStoredRole = (finalUserData?.role || 'lecturer').toLowerCase();
      const isSuperAdminUser = rawStoredRole === 'super_admin';
      const isAdminUser = isSuperAdminUser || rawStoredRole === 'admin';
      const isExplicitLecturerUser = rawStoredRole === 'lecturer';

      // 3. Find if user email or stored lecturerId is in the verified /lecturers directory
      let matchedLecturer: Lecturer | null = null;
      if (finalUserData?.lecturerId) {
        matchedLecturer = await findLecturerById(finalUserData.lecturerId);
      }
      if (!matchedLecturer) {
        matchedLecturer = await findLecturerByEmail(cleanEmail);
      }

      // Check account suspension
      if (matchedLecturer && matchedLecturer.accountStatus === 'suspended') {
        await fbSignOut(auth);
        setIsLoading(false);
        return {
          success: false,
          error: 'This faculty account is currently suspended. Please contact your department administrator.',
          code: 'auth/account-suspended'
        };
      }

      // 4. ROLE-BASED ACCESS CONTROL VALIDATION
      if (portalRole === 'admin') {
        // ADMIN PORTAL VALIDATION:
        // Must be an admin or super_admin account. If it is a lecturer-only account without admin privileges, deny access.
        if (isExplicitLecturerUser && !isAdminUser) {
          await fbSignOut(auth);
          setIsLoading(false);
          return {
            success: false,
            error: 'Access denied: This account is registered as a Lecturer and cannot access the Administrator Dashboard. Please select "Lecturer" on the login screen.',
            code: 'auth/unauthorized-role'
          };
        }
      } else if (portalRole === 'lecturer') {
        // LECTURER PORTAL VALIDATION:
        // Must match a verified lecturer record in /lecturers OR have role: 'lecturer'
        if (!matchedLecturer && !isExplicitLecturerUser) {
          await fbSignOut(auth);
          setIsLoading(false);
          return {
            success: false,
            error: 'Access denied: No faculty profile was found matching this email address in the university lecturer directory. Please select "Admin" if you are an administrator, or contact academic scheduling support.',
            code: 'auth/not-a-lecturer'
          };
        }
      }

      let fetchedAvatar = fbUser.photoURL || finalUserData?.avatar || undefined;
      let fetchedName = fbUser.displayName || finalUserData?.name || fbUser.email?.split('@')[0] || 'User';

      if (matchedLecturer) {
        // Link authUid and set status to active if unclaimed
        if (!matchedLecturer.authUid || matchedLecturer.accountStatus === 'unclaimed') {
          try {
            const lecturerDocRef = doc(db, 'lecturers', matchedLecturer.lecturerId);
            await setDoc(lecturerDocRef, {
              authUid: fbUser.uid,
              accountStatus: 'active',
              registeredAt: matchedLecturer.registeredAt || new Date().toISOString()
            }, { merge: true });
            matchedLecturer = {
              ...matchedLecturer,
              authUid: fbUser.uid,
              accountStatus: 'active'
            };
          } catch (e) {
            console.warn('Auto-link lecturer on sign-in note:', e);
          }
        }

        setLecturerProfile(matchedLecturer);
        try {
          localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
        } catch {}
        if (userDocSnap.exists() && finalUserData?.lecturerId !== matchedLecturer.lecturerId) {
          await setDoc(userDocRef, { lecturerId: matchedLecturer.lecturerId }, { merge: true });
        }
      } else {
        setLecturerProfile(null);
        try {
          localStorage.removeItem(LECTURER_STORAGE_KEY);
        } catch {}
      }

      const activeRole: UserRole = portalRole === 'lecturer' 
        ? 'lecturer' 
        : (isSuperAdminUser ? 'super_admin' : (isAdminUser ? 'admin' : 'admin'));

      const appUser: User = {
        id: fbUser.uid,
        name: matchedLecturer?.fullName || fetchedName,
        email: fbUser.email || cleanEmail,
        avatar: fetchedAvatar,
        role: activeRole,
        provider: 'email',
        lecturerId: matchedLecturer?.lecturerId
      };

      setUser(appUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      } catch {}

      setIsLoading(false);
      const targetRoute = portalRole === 'lecturer' ? '/lecturer' : '/dashboard';
      return { success: true, targetRoute };
    } catch (err: any) {
      setIsLoading(false);
      
      let errorMsg = 'Incorrect email or password. Please try again.';
      const code = err?.code || '';

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        errorMsg = 'Incorrect email or password. Please check your credentials or reset your password.';
      } else if (code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password sign-in is disabled in your Firebase console. Please sign in with Google or enable Email/Password provider in the Firebase Console (Authentication > Sign-in method).';
      } else if (code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address. Please sign up or check your email.';
      } else if (code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (code === 'auth/user-disabled') {
        errorMsg = 'This account has been disabled. Please contact support.';
      } else if (code === 'auth/too-many-requests') {
        errorMsg = 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
      } else if (code === 'auth/network-request-failed') {
        errorMsg = 'Network connection failed. Please check your internet connection.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      return { success: false, error: errorMsg, code };
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
    institution?: string,
    portalRole: UserRole = 'lecturer'
  ): Promise<{ success: boolean; error?: string; code?: string; targetRoute?: string }> => {
    setIsLoading(true);
    try {
      // 1. Explicitly disallow public Admin self-registration
      if (portalRole === 'admin') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Administrator accounts cannot be created here. Please sign in with an authorized administrator account.',
          code: 'auth/admin-registration-disabled'
        };
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        setIsLoading(false);
        return { success: false, error: 'Please enter all required fields.', code: 'auth/missing-fields' };
      }

      // 2. Lecturer verification check against /lecturers directory
      const matchedLecturer = await findLecturerByEmail(cleanEmail);
      if (!matchedLecturer) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Registration rejected: Your email is not registered in the university faculty directory. Please contact your department administrator.',
          code: 'auth/not-a-lecturer'
        };
      }

      // 3. Check existing account status on lecturer profile
      if (matchedLecturer.accountStatus === 'active' || matchedLecturer.authUid) {
        setIsLoading(false);
        return {
          success: false,
          error: 'This lecturer already has an account. Please sign in instead.',
          code: 'auth/already-registered'
        };
      }

      if (matchedLecturer.accountStatus === 'suspended') {
        setIsLoading(false);
        return {
          success: false,
          error: 'This faculty account is currently suspended. Please contact your department administrator.',
          code: 'auth/account-suspended'
        };
      }

      // 4. Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        await sendEmailVerification(fbUser);
      } catch {}

      const assignedRole: UserRole = 'lecturer';
      const nowIso = new Date().toISOString();

      // 5. Atomic profile creation & bidirectional linking with rollback
      try {
        // A. Create /users/{uid} document
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          name: name || matchedLecturer.fullName || cleanEmail.split('@')[0] || 'User',
          email: cleanEmail,
          avatar: '',
          role: assignedRole,
          lecturerId: matchedLecturer.lecturerId,
          institution: institution || 'University of Ghana',
          createdAt: nowIso
        }, { merge: true });

        // B. Bidirectionally update /lecturers/{lecturerId} document
        const lecturerDocRef = doc(db, 'lecturers', matchedLecturer.lecturerId);
        await setDoc(lecturerDocRef, {
          authUid: fbUser.uid,
          accountStatus: 'active',
          registeredAt: nowIso
        }, { merge: true });
      } catch (dbErr: any) {
        console.error('Firestore rollback triggered due to linking failure:', dbErr);
        try {
          await deleteUser(fbUser);
        } catch (delErr) {
          console.warn('Rollback user delete failed:', delErr);
        }
        setIsLoading(false);
        return {
          success: false,
          error: 'Account creation could not be completed due to a database sync error. Please try again.',
          code: 'auth/linking-failed'
        };
      }

      const activeLecturer: Lecturer = {
        ...matchedLecturer,
        authUid: fbUser.uid,
        accountStatus: 'active',
        registeredAt: nowIso
      };

      setLecturerProfile(activeLecturer);
      try {
        localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(activeLecturer));
      } catch {}

      const appUser: User = {
        id: fbUser.uid,
        name: name || activeLecturer.fullName || cleanEmail.split('@')[0] || 'User',
        email: cleanEmail,
        institution: institution || undefined,
        role: assignedRole,
        provider: 'email',
        lecturerId: activeLecturer.lecturerId
      };
      setUser(appUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      } catch {}

      setIsLoading(false);
      const targetRoute = '/lecturer';
      return { success: true, targetRoute };
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please sign in.', code };
      } else if (code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Email/Password sign-up is disabled in your Firebase console. Please sign in with Google or enable Email/Password provider in the Firebase Console.', code };
      } else if (code === 'auth/weak-password') {
        return { success: false, error: 'Password should be at least 6 characters.', code };
      } else if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.', code };
      }
      return { success: false, error: err?.message || 'Failed to create account. Please try again.', code };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        return { success: false, error: 'Please enter your email address.', code: 'auth/missing-email' };
      }
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address.', code };
      } else if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.', code };
      }
      return { success: false, error: err?.message || 'Failed to send password reset email.', code };
    }
  };

  const signInWithGoogle = async (portalRole: UserRole = 'admin'): Promise<{ success: boolean; error?: string; code?: string; targetRoute?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const cleanEmail = (fbUser.email || '').trim().toLowerCase();

      // Check Firestore user doc
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let finalUserData = userDocSnap.exists() ? userDocSnap.data() : null;

      const isPrimarySuperAdmin = cleanEmail === 'charlestonkyeremeh6@gmail.com';
      if (!finalUserData && isPrimarySuperAdmin) {
        const bootstrapRecord = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Lead Academic Administrator',
          email: cleanEmail,
          role: 'super_admin' as const,
          institution: 'University of Ghana',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, bootstrapRecord);
        finalUserData = bootstrapRecord;
      }

      const rawStoredRole = (finalUserData?.role || '').toLowerCase();
      const isSuperAdminUser = rawStoredRole === 'super_admin';
      const isAdminUser = isSuperAdminUser || rawStoredRole === 'admin';
      const isExplicitLecturerUser = rawStoredRole === 'lecturer';

      // Find lecturer profile match
      let matchedLecturer: Lecturer | null = null;
      if (finalUserData?.lecturerId) {
        matchedLecturer = await findLecturerById(finalUserData.lecturerId);
      }
      if (!matchedLecturer) {
        matchedLecturer = await findLecturerByEmail(cleanEmail);
      }

      // Check suspended state
      if (matchedLecturer && matchedLecturer.accountStatus === 'suspended') {
        await fbSignOut(auth);
        setIsLoading(false);
        return {
          success: false,
          error: 'This faculty account is currently suspended. Please contact your department administrator.',
          code: 'auth/account-suspended'
        };
      }

      // ROLE-BASED ACCESS CONTROL VALIDATION FOR GOOGLE SIGN-IN
      if (portalRole === 'admin') {
        // Only existing admin users in Firestore or users without explicit lecturer-only role can sign in
        if (!finalUserData && !isAdminUser) {
          // If a new user signs in with Google while Admin is selected, deny if not an authorized administrator
          await fbSignOut(auth);
          setIsLoading(false);
          return {
            success: false,
            error: 'Administrator accounts cannot be created here. Please sign in with an authorized administrator account.',
            code: 'auth/unauthorized-admin'
          };
        }

        if (isExplicitLecturerUser && !isAdminUser) {
          await fbSignOut(auth);
          setIsLoading(false);
          return {
            success: false,
            error: 'Access denied: This Google account is registered as a Lecturer and cannot access the Administrator Dashboard. Please select "Lecturer" on the login screen.',
            code: 'auth/unauthorized-role'
          };
        }
      } else if (portalRole === 'lecturer') {
        if (!matchedLecturer && !isExplicitLecturerUser) {
          await fbSignOut(auth);
          setIsLoading(false);
          return {
            success: false,
            error: 'Access denied: No faculty profile was found matching this Google account email in the university lecturer directory. Please select "Admin" if you are an administrator, or contact academic scheduling support.',
            code: 'auth/not-a-lecturer'
          };
        }
      }

      let fetchedAvatar = fbUser.photoURL || finalUserData?.avatar || undefined;
      let fetchedName = fbUser.displayName || finalUserData?.name || 'User';

      if (matchedLecturer) {
        // Auto-link unclaimed lecturer to this Google account
        if (!matchedLecturer.authUid || matchedLecturer.accountStatus === 'unclaimed') {
          try {
            const lecturerDocRef = doc(db, 'lecturers', matchedLecturer.lecturerId);
            await setDoc(lecturerDocRef, {
              authUid: fbUser.uid,
              accountStatus: 'active',
              registeredAt: matchedLecturer.registeredAt || new Date().toISOString()
            }, { merge: true });
            matchedLecturer = {
              ...matchedLecturer,
              authUid: fbUser.uid,
              accountStatus: 'active'
            };
          } catch (e) {
            console.warn('Auto-link lecturer on Google sign-in note:', e);
          }
        }

        setLecturerProfile(matchedLecturer);
        try {
          localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
        } catch {}
      }

      const activeRole: UserRole = portalRole === 'lecturer' 
        ? 'lecturer' 
        : (isSuperAdminUser ? 'super_admin' : (isAdminUser ? 'admin' : 'admin'));

      const googleUser: User = {
        id: fbUser.uid,
        name: matchedLecturer?.fullName || fetchedName,
        email: cleanEmail || 'user@example.com',
        avatar: fetchedAvatar,
        role: activeRole,
        provider: 'google',
        lecturerId: matchedLecturer?.lecturerId
      };

      setUser(googleUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
      } catch {}

      // Save user doc if not exists (only as lecturer for new authorized faculty)
      if (!userDocSnap.exists() && portalRole === 'lecturer') {
        try {
          await setDoc(userDocRef, {
            id: fbUser.uid,
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.avatar || '',
            role: 'lecturer',
            lecturerId: matchedLecturer?.lecturerId,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore Google sign-in doc save note:', dbErr);
        }
      }

      setIsLoading(false);
      const targetRoute = portalRole === 'lecturer' ? '/lecturer' : '/dashboard';
      return { success: true, targetRoute };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err?.message || 'Google sign-in failed';
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        errorMsg = "Unauthorized Domain Error: This domain is not currently authorized for Google Sign-In. Schedula's deployment domains must be manually added to Firebase Console > Authentication > Settings > Authorized domains.";
      }
      return { success: false, error: errorMsg, code };
    }
  };

  const updateUserProfile = async (
    nameOrData: string | { name?: string; avatar?: any }, 
    avatarInput?: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let cleanName = '';
      let avatar: any = avatarInput;

      if (typeof nameOrData === 'object' && nameOrData !== null) {
        if (nameOrData.name !== undefined) {
          cleanName = nameOrData.name.trim();
        } else if (user?.name) {
          cleanName = user.name;
        }
        if (nameOrData.avatar !== undefined) {
          avatar = nameOrData.avatar;
        }
      } else {
        cleanName = (nameOrData || '').trim();
      }

      if (!cleanName && user?.name) {
        cleanName = user.name;
      }

      if (!cleanName) {
        return { success: false, error: 'Display name cannot be empty.' };
      }

      let avatarUrl = typeof avatar === 'string' ? avatar : undefined;

      if (auth.currentUser) {
        if (avatar && typeof avatar !== 'string') {
          try {
            avatarUrl = await uploadProfileImageToStorage(avatar, auth.currentUser.uid);
          } catch (storageErr: any) {
            console.error('Firebase Storage upload failed:', storageErr);
            return {
              success: false,
              error: storageErr?.message || 'Failed to upload profile image to cloud storage.'
            };
          }
        } else if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
          // If a base64 data URI was provided, convert it to a Blob and upload to Firebase Storage
          try {
            const response = await fetch(avatar);
            const blob = await response.blob();
            avatarUrl = await uploadProfileImageToStorage(blob, auth.currentUser.uid);
          } catch (blobErr: any) {
            console.error('Failed to convert and upload image to Firebase Storage:', blobErr);
            return {
              success: false,
              error: 'Failed to process and upload profile image to storage.'
            };
          }
        }

        try {
          await updateProfile(auth.currentUser, {
            displayName: cleanName,
            ...(avatarUrl !== undefined ? { photoURL: avatarUrl } : {})
          });
        } catch (fbErr) {
          console.warn('Firebase profile update note:', fbErr);
        }

        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, {
            name: cleanName,
            ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {})
          }, { merge: true });

          // Also update lecturer directory document if user is linked to a faculty profile
          if (lecturerProfile?.lecturerId) {
            const cleanId = lecturerProfile.lecturerId.replace(/[\/\s#$[\]]/g, '_');
            const lecDocRef = doc(db, 'lecturers', cleanId);
            await setDoc(lecDocRef, {
              fullName: cleanName,
              ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {})
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn('Firestore profile save note:', dbErr);
        }
      }

      setUser(prev => {
        if (!prev) return null;
        const updated: User = {
          ...prev,
          name: cleanName,
          ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {})
        };
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (lecturerProfile) {
        setLecturerProfile(prev => prev ? {
          ...prev,
          fullName: cleanName,
          ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {})
        } : prev);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update profile.' };
    }
  };

  const removeProfilePicture = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            photoURL: ''
          });
        } catch (fbErr) {
          console.warn('Firebase photoURL reset note:', fbErr);
        }

        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, {
            avatar: ''
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore profile picture remove note:', dbErr);
        }
      }

      setUser(prev => {
        if (!prev) return null;
        const updated: User = {
          ...prev,
          avatar: undefined
        };
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to remove profile picture.' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      if (!auth.currentUser) {
        return { success: false, error: 'You must be signed in to change your password.' };
      }

      try {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/requires-recent-login') {
          if (auth.currentUser.email) {
            await sendPasswordResetEmail(auth, auth.currentUser.email);
            return { 
              success: true, 
              error: 'For security, changing password directly requires recent login. A secure password reset link has been dispatched to your email address.' 
            };
          }
          return { success: false, error: 'This operation is sensitive and requires recent authentication. Please sign out and sign back in before retrying.' };
        } else if (code === 'auth/weak-password') {
          return { success: false, error: 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.' };
        }
        return { success: false, error: err?.message || 'Failed to update password. Please try again.' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to change password.' };
    }
  };

  const updateLecturerProfileDetails = async (details: Partial<Lecturer>): Promise<{ success: boolean; error?: string }> => {
    try {
      const current = lecturerProfile || {
        lecturerId: user?.lecturerId || `LEC-${user?.id?.slice(0, 6) || 'UG'}`,
        fullName: user?.name || 'Faculty Member',
        title: 'Lecturer',
        officeEmail: user?.email || '',
        email: user?.email || '',
        department: 'Computer Science',
      };

      const updated: Lecturer = {
        ...current,
        ...details,
        fullName: details.fullName?.trim() || current.fullName,
        department: details.department?.trim() || current.department,
        email: details.email?.trim() || details.officeEmail?.trim() || current.email,
        officeEmail: details.officeEmail?.trim() || details.email?.trim() || current.officeEmail,
        phone: details.phone !== undefined ? details.phone.trim() : current.phone,
        officeLocation: details.officeLocation !== undefined ? details.officeLocation.trim() : current.officeLocation,
      };

      setLecturerProfile(updated);
      try {
        localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      // Save to Firestore lecturers collection
      try {
        const docId = (updated.lecturerId || 'unknown').replace(/[^\w-]/g, '_');
        await setDoc(doc(db, 'lecturers', docId), updated, { merge: true });
      } catch (fErr) {
        console.warn('Firestore lecturer save note:', fErr);
      }

      // If user is logged in, also update user display name and user doc in Firestore
      if (user && updated.fullName && updated.fullName !== user.name) {
        setUser(prev => prev ? { ...prev, name: updated.fullName } : null);
        try {
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: updated.fullName });
          }
          await setDoc(doc(db, 'users', user.id), { name: updated.fullName }, { merge: true });
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update lecturer profile.' };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsSigningOut(true);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Error signing out from Firebase Auth:', err);
    } finally {
      setUser(null);
      setLecturerProfile(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(LECTURER_STORAGE_KEY);
      } catch {}
      setIsSigningOut(false);
      setIsLoading(false);
    }
  };

  const createAdmin = async (params: {
    fullName: string;
    email: string;
    password: string;
    role: 'admin' | 'super_admin';
    institution?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized: Only a Super Administrator can provision new administrator accounts.'
      };
    }
    return await createAdministratorAccount(user.role, user.id, params);
  };

  const updateAdminRole = async (userId: string, newRole: 'admin' | 'super_admin'): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized: Only a Super Administrator can modify administrator privilege levels.'
      };
    }
    return await updateAdministratorRole(user.role, userId, newRole);
  };

  const deleteAdminAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'super_admin') {
      return {
        success: false,
        error: 'Unauthorized: Only a Super Administrator can permanently delete administrator accounts.'
      };
    }
    return await deleteUserAccount(userId, { deleteLecturerRecord: false });
  };

  const deleteCurrentUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user found.' };
    }
    const targetUserId = user.id;
    const res = await deleteUserAccount(targetUserId, { deleteLecturerRecord: false });
    if (res.success) {
      await signOut();
    }
    return res;
  };

  const getAdministrators = async (): Promise<AdminUserRecord[]> => {
    return await getAdministratorAccounts(user?.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        lecturerProfile,
        isLoading,
        isSigningOut,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signInWithGoogle,
        updateUserProfile,
        updateLecturerProfile: updateLecturerProfileDetails,
        updateLecturerProfileDetails,
        changePassword,
        removeProfilePicture,
        signOut,
        createAdmin,
        updateAdminRole,
        deleteAdminAccount,
        deleteCurrentUserAccount,
        getAdministrators,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
