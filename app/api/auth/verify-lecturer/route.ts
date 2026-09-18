import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email address.',
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
          error: 'Please enter a valid email address.',
          code: 'auth/invalid-email'
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();
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

    // Check account status
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

    // Check if account is already claimed and active
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

    // Verified successfully: minimum data returned for UI display and password setup
    const resolvedLecturerId = matchedData.lecturerId || matchedDoc.id;

    return NextResponse.json(
      {
        success: true,
        verified: true,
        lecturerId: resolvedLecturerId,
        fullName: matchedData.fullName || 'Faculty Member',
        department: matchedData.department || '',
        email: cleanEmail
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[VerifyLecturer API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal server error occurred while verifying the email. Please try again.',
        code: 'auth/server-error'
      },
      { status: 500 }
    );
  }
}
