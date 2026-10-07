import { doc, getDocs, collection, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  institution?: string;
  createdAt: string;
  createdBy?: string;
}

/**
 * Creates an administrator account (Admin or Super Admin) in Firebase Auth
 * and saves their role and profile in Firestore /users/{uid}.
 * 
 * Uses the secure server-side API route /api/admin/provision.
 */
export async function createAdministratorAccount(
  callerRole: string | undefined,
  callerUid: string | undefined,
  params: {
    fullName: string;
    email: string;
    password: string;
    role: 'admin' | 'super_admin';
    institution?: string;
  }
): Promise<{ success: boolean; error?: string; userId?: string }> {
  if (callerRole !== 'super_admin') {
    return {
      success: false,
      error: 'Unauthorized: Only a Super Administrator has permission to provision administrative accounts.'
    };
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim();
  const cleanPassword = params.password;

  if (!cleanEmail || !cleanName || !cleanPassword) {
    return { success: false, error: 'Full name, email address, and password are required.' };
  }

  if (cleanPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters in length.' };
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch('/api/admin/provision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        fullName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: params.role,
        institution: params.institution
      })
    });

    const rawText = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = null;
    }

    if (response.ok && result?.success) {
      return { success: true, userId: result.userId };
    }

    return { success: false, error: result?.error || 'Failed to create administrator account.' };
  } catch (error: any) {
    console.error('[AdminAuthService] API call error creating administrator:', error);
    return { success: false, error: error?.message || 'Failed to create administrator account.' };
  }
}

/**
 * Retrieves all administrator accounts (Super Admins and Admins) from Firestore
 */
export async function getAdministratorAccounts(callerRole?: string): Promise<AdminUserRecord[]> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const admins: AdminUserRecord[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const role = (data.role || '').toLowerCase();
      if (role === 'admin' || role === 'super_admin') {
        admins.push({
          id: docSnap.id,
          name: data.name || data.fullName || 'Administrator',
          email: data.email || '',
          role: role as 'admin' | 'super_admin',
          institution: data.institution || 'University of Ghana',
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy
        });
      }
    });

    // Also ensure the primary system admin email is represented if not in list
    const primaryAdminEmail = 'charlestonkyeremeh6@gmail.com';
    const hasPrimary = admins.some(a => a.email.toLowerCase() === primaryAdminEmail);
    if (!hasPrimary) {
      admins.unshift({
        id: 'primary-super-admin',
        name: 'Lead Academic Administrator',
        email: primaryAdminEmail,
        role: 'super_admin',
        institution: 'University of Ghana',
        createdAt: '2026-08-01T00:00:00.000Z'
      });
    }

    return admins;
  } catch (error) {
    console.warn('[AdminAuthService] Warning loading administrator list:', error);
    return [];
  }
}

/**
 * Updates a user's role (Lecturer, Admin, Super Admin) via secure server-side API route /api/admin/role
 * with direct client-side Firestore fallback if the API endpoint returns an error or non-JSON.
 */
export async function updateAdministratorRole(
  callerRole: string | undefined,
  targetUserId: string,
  newRole: 'admin' | 'super_admin' | 'lecturer',
  metadata?: { lecturerId?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  if (callerRole !== 'super_admin') {
    return {
      success: false,
      error: 'Unauthorized: Only a Super Administrator has permission to modify roles.'
    };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: 'User is not authenticated.' };
  }

  let apiErrorMsg: string | null = null;

  // 1. Try server-side API endpoint
  try {
    const idToken = await currentUser.getIdToken(true);

    const response = await fetch('/api/admin/role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId: targetUserId || undefined,
        lecturerId: metadata?.lecturerId,
        email: metadata?.email,
        newRole
      })
    });

    const rawText = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = null;
    }

    if (response.ok && result?.success) {
      return { success: true };
    }

    // If server responded with explicit permission error or self-demotion block, honor it
    if (result && result.error && response.status === 403) {
      return { success: false, error: result.error };
    }

    apiErrorMsg = result?.error || null;
  } catch (apiError: any) {
    console.warn('[AdminAuthService] API role update failed, attempting Firestore fallback:', apiError);
  }

  // 2. Direct Firestore Fallback for Super Admin
  try {
    if (targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      await setDoc(userRef, {
        role: newRole,
        ...(metadata?.email ? { email: metadata.email } : {}),
        ...(metadata?.lecturerId ? { lecturerId: metadata.lecturerId } : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      }, { merge: true });
    }

    if (metadata?.lecturerId) {
      const lecRef = doc(db, 'lecturers', metadata.lecturerId);
      await setDoc(lecRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return { success: true };
  } catch (fsError: any) {
    console.error('[AdminAuthService] Direct Firestore role update error:', fsError);
    return {
      success: false,
      error: apiErrorMsg || fsError?.message || 'Failed to update user role in database.'
    };
  }
}

/**
 * Permanently deletes a user account from Firebase Auth and Firestore via server-side API
 */
export async function deleteUserAccount(
  targetUserId: string,
  options?: { deleteLecturerRecord?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        targetUserId,
        deleteLecturerRecord: options?.deleteLecturerRecord ?? false
      })
    });

    const rawText = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = null;
    }

    if (response.ok && result?.success) {
      return { success: true };
    }

    return { success: false, error: result?.error || 'Failed to delete user account.' };
  } catch (error: any) {
    console.error('[AdminAuthService] Error deleting user account:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete user account.'
    };
  }
}
