import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;
    const password = body?.password;
    const providedLecturerId = body?.lecturerId;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email address is required.',
          code: 'auth/invalid-email'
        },
        { status: 400 }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid email address.',
          code: 'auth/invalid-email'
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'auth/weak-password'
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // 1. Live Firestore re-verification of the lecturer record
    const lecturersSnap = await db.collection('lecturers').get();
    if (lecturersSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not found in the faculty directory.',
          code: 'auth/lecturer-not-found'
        },
        { status: 404 }
      );
    }

    let matchedDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let matchedData: any = null;

    for (const docSnap of lecturersSnap.docs) {
      const data = docSnap.data();
      const officeEmail = (data.officeEmail || '').toString().trim().toLowerCase();
      const personalEmail = (data.email || '').toString().trim().toLowerCase();

      if (officeEmail === cleanEmail || personalEmail === cleanEmail) {
        matchedDoc = docSnap;
        matchedData = data;
        break;
      }
    }

    if (!matchedDoc || !matchedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not found in the faculty directory.',
          code: 'auth/lecturer-not-found'
        },
        { status: 404 }
      );
    }

    const resolvedLecturerId = matchedData.lecturerId || matchedDoc.id;

    // Verify lecturerId if supplied by client to prevent tampering
    if (providedLecturerId && providedLecturerId.trim() !== resolvedLecturerId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lecturer identifier mismatch. Please re-verify your institutional email.',
          code: 'auth/id-mismatch'
        },
        { status: 400 }
      );
    }

    // 2. Check suspension
    const accountStatus = matchedData.accountStatus || (matchedData.authUid ? 'active' : 'unclaimed');
    if (accountStatus === 'suspended') {
      return NextResponse.json(
        {
          success: false,
          error: 'This faculty account is currently suspended. Please contact your department administrator.',
          code: 'auth/account-suspended'
        },
        { status: 403 }
      );
    }

    // 3. Check if already claimed and active
    if (matchedData.authUid && accountStatus === 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'This lecturer account is already active. Please sign in with your password.',
          code: 'auth/already-registered'
        },
        { status: 409 }
      );
    }

    // 4. Create Firebase Auth account via Admin SDK
    let authUser: any;
    try {
      authUser = await auth.createUser({
        email: cleanEmail,
        password: password,
        displayName: matchedData.fullName || 'Faculty Member'
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        return NextResponse.json(
          {
            success: false,
            error: 'An authentication account with this email already exists. Please sign in with your password.',
            code: 'auth/email-already-in-use'
          },
          { status: 409 }
        );
      }
      console.error('[ActivateLecturer API] Error creating Auth user:', authErr);
      return NextResponse.json(
        {
          success: false,
          error: authErr.message || 'Failed to create faculty authentication account.',
          code: 'auth/creation-failed'
        },
        { status: 500 }
      );
    }

    // 5. Atomic Firestore linkage (/users/{uid} and /lecturers/{lecturerId}) with compensating rollback
    const nowIso = new Date().toISOString();
    try {
      const batch = db.batch();

      // Create /users/{uid} document
      const userDocRef = db.collection('users').doc(authUser.uid);
      batch.set(
        userDocRef,
        {
          id: authUser.uid,
          name: matchedData.fullName || 'Faculty Member',
          email: cleanEmail,
          avatar: matchedData.avatar || '',
          role: 'lecturer',
          lecturerId: resolvedLecturerId,
          institution: matchedData.department || 'University of Ghana',
          createdAt: nowIso
        },
        { merge: true }
      );

      // Update existing /lecturers/{docId} document
      const lecturerDocRef = db.collection('lecturers').doc(matchedDoc.id);
      batch.update(lecturerDocRef, {
        authUid: authUser.uid,
        accountStatus: 'active',
        registeredAt: nowIso
      });

      await batch.commit();
    } catch (dbErr: any) {
      console.error('[ActivateLecturer API] Firestore linking failed, rolling back Auth user:', dbErr);
      // Compensating deletion of the newly created Auth user
      try {
        await auth.deleteUser(authUser.uid);
      } catch (delErr) {
        console.error('[ActivateLecturer API] CRITICAL: Rollback user deletion failed for UID:', authUser.uid, delErr);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Account could not be linked due to a database sync error. Please try again.',
          code: 'auth/linking-failed'
        },
        { status: 500 }
      );
    }

    // 6. Generate Custom Token for immediate client sign-in
    let customToken: string;
    try {
      customToken = await auth.createCustomToken(authUser.uid);
    } catch (tokenErr: any) {
      console.error('[ActivateLecturer API] Failed to create custom token:', tokenErr);
      return NextResponse.json(
        {
          success: false,
          error: 'Account activated, but sign-in token could not be generated. Please sign in with your password.',
          code: 'auth/token-generation-failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        customToken,
        uid: authUser.uid,
        lecturerId: resolvedLecturerId,
        targetRoute: '/lecturer'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[ActivateLecturer API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal server error occurred while activating the account. Please try again.',
        code: 'auth/server-error'
      },
      { status: 500 }
    );
  }
}
