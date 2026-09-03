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
  updateProfile,
  updatePassword,
  fbSignOut, 
  onAuthStateChanged,
  FirebaseUser 
} from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Lecturer, INITIAL_LECTURERS } from '@/lib/dataset';

export type UserRole = 'admin' | 'lecturer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
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
  signUpWithEmail: (name: string, email: string, password: string, institution?: string, portalRole?: UserRole) => Promise<{ success: boolean; error?: string; code?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  signInWithGoogle: (portalRole?: UserRole) => Promise<{ success: boolean; error?: string; code?: string; targetRoute?: string }>;
  updateUserProfile: (name: string, avatar?: any) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  removeProfilePicture: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'schedula-auth-user';
const LECTURER_STORAGE_KEY = 'schedula-auth-lecturer';

/**
 * Helper to match an email against the lecturer catalog (Firestore first, then INITIAL_LECTURERS fallback)
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
            lecturerId: data.lecturerId || docSnap.id
          };
        }
      }
    }
  } catch (err) {
    console.warn('Firestore lecturer search note:', err);
  }

  // Fallback to static catalog if Firestore is offline or empty
  const match = INITIAL_LECTURERS.find(l => 
    (l.officeEmail && l.officeEmail.trim().toLowerCase() === cleanEmail) ||
    (l.email && l.email.trim().toLowerCase() === cleanEmail)
  );

  return match || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lecturerProfile, setLecturerProfile] = useState<Lecturer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let fetchedAvatar = firebaseUser.photoURL || undefined;
        let fetchedName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        let fetchedRole = 'admin';
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
                fetchedRole = r.includes('lecturer') ? 'lecturer' : 'admin';
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

        // Fetch user profile & check lecturer linkage from Firestore asynchronously in the background
        (async () => {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            let finalRole = fetchedRole;
            let finalAvatar = fetchedAvatar;
            let finalName = fetchedName;

            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              if (data.role) {
                const r = String(data.role).toLowerCase();
                finalRole = r.includes('lecturer') ? 'lecturer' : 'admin';
              }
              if (!fetchedAvatar && data.avatar) {
                finalAvatar = data.avatar;
              }
              if (!fetchedName && data.name) {
                finalName = data.name;
              }
            }

            // Also check if user email is associated with a lecturer record
            const userEmail = firebaseUser.email || '';
            const matchedLecturer = await findLecturerByEmail(userEmail);
            if (matchedLecturer) {
              setLecturerProfile(matchedLecturer);
              try {
                localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
              } catch {}
            }

            const updatedUser: User = {
              ...appUser,
              name: finalName,
              avatar: finalAvatar,
              role: finalRole,
              lecturerId: matchedLecturer?.lecturerId || appUser.lecturerId
            };
            setUser(updatedUser);
            try {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
            } catch {}
          } catch (dbErr) {
            console.warn('Firestore active user background fetch warning:', dbErr);
          }
        })();
      } else {
        setUser(null);
        setLecturerProfile(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(LECTURER_STORAGE_KEY);
        } catch {}
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (
    email: string, 
    password: string, 
    portalRole: UserRole = 'admin'
  ): Promise<{ success: boolean; error?: string; unverified?: boolean; email?: string; code?: string; targetRoute?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
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
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      // Determine user's assigned role in Firestore (default 'admin' if existing administrator profile, or fallback)
      const rawStoredRole = (userData?.role || 'admin').toLowerCase();
      const isAdminUser = rawStoredRole.includes('admin');
      const isExplicitLecturerUser = rawStoredRole.includes('lecturer');

      // 3. Find if user email is in the verified /lecturers directory
      const matchedLecturer = await findLecturerByEmail(cleanEmail);

      // 4. ROLE-BASED ACCESS CONTROL VALIDATION
      if (portalRole === 'admin') {
        // ADMIN PORTAL VALIDATION:
        // Must be an admin account. If it is a lecturer-only account without admin privileges, deny access.
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

      let fetchedAvatar = fbUser.photoURL || userData?.avatar || undefined;
      let fetchedName = fbUser.displayName || userData?.name || fbUser.email?.split('@')[0] || 'User';

      if (matchedLecturer) {
        setLecturerProfile(matchedLecturer);
        try {
          localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
        } catch {}
      }

      const activeRole: UserRole = portalRole === 'lecturer' ? 'lecturer' : (isAdminUser ? 'admin' : (userData?.role?.toLowerCase() || 'admin'));

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
  ): Promise<{ success: boolean; error?: string; code?: string }> => {
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

      const cleanEmail = email.trim();
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

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        await sendEmailVerification(fbUser);
      } catch {}

      const assignedRole: UserRole = 'lecturer';

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          name: name || matchedLecturer.fullName || cleanEmail.split('@')[0] || 'User',
          email: cleanEmail,
          avatar: '',
          role: assignedRole,
          institution: institution || 'University of Ghana',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore initial profile creation note:', dbErr);
      }

      if (matchedLecturer) {
        setLecturerProfile(matchedLecturer);
        try {
          localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
        } catch {}
      }

      const appUser: User = {
        id: fbUser.uid,
        name: name || matchedLecturer.fullName || cleanEmail.split('@')[0] || 'User',
        email: cleanEmail,
        institution: institution || undefined,
        role: assignedRole,
        provider: 'email',
        lecturerId: matchedLecturer.lecturerId
      };
      setUser(appUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      } catch {}

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists.', code };
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
      const cleanEmail = fbUser.email || '';

      // Check Firestore user doc
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      const rawStoredRole = (userData?.role || '').toLowerCase();
      const isAdminUser = rawStoredRole.includes('admin');
      const isExplicitLecturerUser = rawStoredRole.includes('lecturer');

      // Find lecturer profile match
      const matchedLecturer = await findLecturerByEmail(cleanEmail);

      // ROLE-BASED ACCESS CONTROL VALIDATION FOR GOOGLE SIGN-IN
      if (portalRole === 'admin') {
        // Only existing admin users in Firestore or users without explicit lecturer-only role can sign in
        if (!userDocSnap.exists() && !isAdminUser) {
          // If a new user signs in with Google while Admin is selected, deny if not an authorized administrator
          // Allow existing legacy admins or let them access if already configured in Firestore as admin
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

      let fetchedAvatar = fbUser.photoURL || userData?.avatar || undefined;
      let fetchedName = fbUser.displayName || userData?.name || 'User';

      if (matchedLecturer) {
        setLecturerProfile(matchedLecturer);
        try {
          localStorage.setItem(LECTURER_STORAGE_KEY, JSON.stringify(matchedLecturer));
        } catch {}
      }

      const activeRole: UserRole = portalRole === 'lecturer' ? 'lecturer' : (isAdminUser ? 'admin' : 'lecturer');

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

  const updateUserProfile = async (name: string, avatar?: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanName = name.trim();
      if (!cleanName) {
        return { success: false, error: 'Display name cannot be empty.' };
      }

      let avatarUrl = typeof avatar === 'string' ? avatar : undefined;

      if (auth.currentUser) {
        if (avatar && typeof avatar !== 'string') {
          try {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const storage = getStorage();
            const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile_${Date.now()}.jpg`);
            const uploadResult = await uploadBytes(storageRef, avatar);
            avatarUrl = await getDownloadURL(uploadResult.ref);
          } catch (storageErr: any) {
            console.warn('Firebase Storage upload failed, trying base64 fallback:', storageErr);
            try {
              avatarUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(avatar);
              });
            } catch (fallbackErr) {
              console.error('Base64 fallback encoding failed:', fallbackErr);
            }
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
        changePassword,
        removeProfilePicture,
        signOut,
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
