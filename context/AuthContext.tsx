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
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  institution?: string;
  provider: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSigningOut: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean; email?: string; code?: string }>;
  signUpWithEmail: (name: string, email: string, password: string, institution?: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; code?: string }>;
  updateUserProfile: (name: string, avatar?: any) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  removeProfilePicture: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'schedula-auth-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let fetchedAvatar = firebaseUser.photoURL || undefined;
        let fetchedName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

        // Check local storage cache as the first source of truth for custom settings before Firestore responds
        try {
          const cached = localStorage.getItem(AUTH_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id === firebaseUser.uid) {
              if (parsed.avatar) fetchedAvatar = parsed.avatar;
              if (parsed.name) fetchedName = parsed.name;
            }
          }
        } catch {}

        const appUser: User = {
          id: firebaseUser.uid,
          name: fetchedName,
          email: firebaseUser.email || 'user@example.com',
          avatar: fetchedAvatar,
          role: 'Administrator',
          provider: firebaseUser.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email',
        };

        // Immediately update auth context to unblock the router and render the UI instantly
        setUser(appUser);
        setIsLoading(false);

        // Fetch user profile from Firestore asynchronously in the background
        (async () => {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              let updated = false;
              let finalAvatar = fetchedAvatar;
              let finalName = fetchedName;

              // Treat the Firebase Auth profile (displayName and photoURL) as the absolute authority.
              // We only fall back to Firestore if they are not defined on the auth account.
              if (!fetchedAvatar && data.avatar) {
                finalAvatar = data.avatar;
                updated = true;
              }
              if (!fetchedName && data.name) {
                finalName = data.name;
                updated = true;
              }

              if (updated) {
                const updatedUser: User = {
                  ...appUser,
                  name: finalName,
                  avatar: finalAvatar,
                };
                setUser(updatedUser);
                try {
                  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
                } catch {}
              }
            } else {
              // Lazy-init Firestore user doc
              await setDoc(userDocRef, {
                id: firebaseUser.uid,
                name: fetchedName,
                email: firebaseUser.email || '',
                avatar: fetchedAvatar || '',
                role: 'Administrator',
                createdAt: new Date().toISOString()
              }, { merge: true });
            }
          } catch (dbErr) {
            console.warn('Firestore active user background fetch warning:', dbErr);
          }
        })();
      } else {
        setUser(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {}
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string; unverified?: boolean; email?: string; code?: string }> => {
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

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      let fetchedAvatar = fbUser.photoURL || undefined;
      let fetchedName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';

      // Check local storage cache as the first source of truth for custom settings before Firestore responds
      try {
        const cached = localStorage.getItem(AUTH_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === fbUser.uid) {
            if (parsed.avatar) fetchedAvatar = parsed.avatar;
            if (parsed.name) fetchedName = parsed.name;
          }
        }
      } catch {}

      const appUser: User = {
        id: fbUser.uid,
        name: fetchedName,
        email: fbUser.email || cleanEmail,
        avatar: fetchedAvatar,
        role: 'Administrator',
        provider: 'email',
      };
      setUser(appUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      } catch {}
      setIsLoading(false);
      return { success: true };
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
    institution?: string
  ): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        setIsLoading(false);
        return { success: false, error: 'Please enter all required fields.', code: 'auth/missing-fields' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        await sendEmailVerification(fbUser);
      } catch {}

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          name: name || cleanEmail.split('@')[0] || 'User',
          email: cleanEmail,
          avatar: '',
          role: 'Administrator',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore initial profile creation note:', dbErr);
      }

      const appUser: User = {
        id: fbUser.uid,
        name: name || cleanEmail.split('@')[0] || 'User',
        email: cleanEmail,
        institution: institution || undefined,
        role: 'Administrator',
        provider: 'email',
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
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your email address.', code: 'auth/missing-email' };
      }
      await sendPasswordResetEmail(auth, cleanEmail);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address.', code };
      } else if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.', code };
      }
      return { success: false, error: err?.message || 'Failed to send password reset email.', code };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      let fetchedAvatar = fbUser.photoURL || undefined;
      let fetchedName = fbUser.displayName || 'User';

      // Check local storage cache as the first source of truth for custom settings before Firestore responds
      try {
        const cached = localStorage.getItem(AUTH_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === fbUser.uid) {
            if (parsed.avatar) fetchedAvatar = parsed.avatar;
            if (parsed.name) fetchedName = parsed.name;
          }
        }
      } catch {}

      const googleUser: User = {
        id: fbUser.uid,
        name: fetchedName,
        email: fbUser.email || 'user@example.com',
        avatar: fetchedAvatar,
        role: 'Administrator',
        provider: 'google',
      };
      setUser(googleUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
      } catch {}
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err?.message || 'Google sign-in failed';
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        errorMsg = "Unauthorized Domain Error: This domain is not currently authorized for Google Sign-In. Schedula's deployment domains (such as ais-dev-hunfervowg4wnk33yegtjt-629066384423.europe-west2.run.app and ais-pre-hunfervowg4wnk33yegtjt-629066384423.europe-west2.run.app) must be manually added to Firebase Console > Authentication > Settings > Authorized domains. Once done, Google Sign-In will connect immediately!";
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
        // If avatar is a File or Blob, upload it to Firebase Storage
        if (avatar && typeof avatar !== 'string') {
          try {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const storage = getStorage();
            // Store with a unique path using the UID and a timestamp to avoid caching issues
            const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile_${Date.now()}.jpg`);
            const uploadResult = await uploadBytes(storageRef, avatar);
            avatarUrl = await getDownloadURL(uploadResult.ref);
          } catch (storageErr: any) {
            console.warn('Firebase Storage upload failed, trying base64 fallback:', storageErr);
            // If storage fails (e.g. unconfigured, permission denied, etc.), encode the blob as base64.
            // Since we compress the blob beforehand, the base64 string is tiny (~10-20KB), which will fit in Auth and Firestore instantly.
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
          // If requires recent login, send a secure password reset link instead
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
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      setIsSigningOut(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
