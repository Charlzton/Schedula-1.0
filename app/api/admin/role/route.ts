import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, authenticateApiCaller } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let caller;
    try {
      caller = await authenticateApiCaller(authHeader);
    } catch (authErr: any) {
      return NextResponse.json({ success: false, error: authErr.message || "Unauthorized" }, { status: 401 });
    }

    if (caller.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only a Super Administrator has permission to modify roles" },
        { status: 403 }
      );
    }

    const { userId, lecturerId, email, newRole } = await req.json();

    if (!userId && !lecturerId && !email) {
      return NextResponse.json(
        { success: false, error: "Target identifier (userId, lecturerId, or email) is required" },
        { status: 400 }
      );
    }

    if (newRole !== "admin" && newRole !== "super_admin" && newRole !== "lecturer") {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();

    let resolvedUserId: string | null = userId || null;
    let targetDocSnap: FirebaseFirestore.DocumentSnapshot | null = null;
    let targetData: any = null;

    // 1. If userId is provided, attempt to locate user document
    if (resolvedUserId) {
      const snap = await adminDb.collection("users").doc(resolvedUserId).get();
      if (snap.exists) {
        targetDocSnap = snap;
        targetData = snap.data();
      }
    }

    // 2. If not found by userId, try finding by lecturerId
    if (!targetDocSnap && lecturerId) {
      const qSnap = await adminDb.collection("users").where("lecturerId", "==", lecturerId).limit(1).get();
      if (!qSnap.empty) {
        targetDocSnap = qSnap.docs[0];
        resolvedUserId = targetDocSnap.id;
        targetData = targetDocSnap.data();
      }
    }

    // 3. If not found, try finding by email
    const cleanEmail = (email || targetData?.email || "").toString().trim().toLowerCase();
    if (!targetDocSnap && cleanEmail) {
      const qSnap = await adminDb.collection("users").where("email", "==", cleanEmail).limit(1).get();
      if (!qSnap.empty) {
        targetDocSnap = qSnap.docs[0];
        resolvedUserId = targetDocSnap.id;
        targetData = targetDocSnap.data();
      }
    }

    // 4. Also check if the lecturer directory has the lecturer record
    let resolvedLecturerId = lecturerId || targetData?.lecturerId || null;
    let lecturerData: any = null;
    if (resolvedLecturerId) {
      const lecSnap = await adminDb.collection("lecturers").doc(resolvedLecturerId).get();
      if (lecSnap.exists) {
        lecturerData = lecSnap.data();
        if (!cleanEmail && (lecturerData?.email || lecturerData?.officeEmail)) {
          // If we had no email, grab from lecturer record
        }
      }
    }

    const effectiveEmail = cleanEmail || targetData?.email || lecturerData?.email || lecturerData?.officeEmail || "";

    // 5. Protection Checks:
    // A. Primary Super Admin protection
    if (effectiveEmail.toLowerCase() === "charlestonkyeremeh6@gmail.com" && newRole !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Primary Super Administrator privilege cannot be revoked" },
        { status: 403 }
      );
    }

    // B. Self-demotion protection
    const isCallerTarget = (resolvedUserId && resolvedUserId === caller.uid) || 
      (caller.email && effectiveEmail && caller.email.toLowerCase() === effectiveEmail.toLowerCase());
    
    if (isCallerTarget && newRole !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Self-demotion protection: You cannot revoke or downgrade your own Super Administrator status." },
        { status: 403 }
      );
    }

    // 6. Update or provision the user record in /users
    let finalAuthUid = resolvedUserId;

    if (!targetDocSnap && effectiveEmail) {
      // Check Firebase Auth to see if account exists with this email
      try {
        const authRecord = await adminAuth.getUserByEmail(effectiveEmail);
        finalAuthUid = authRecord.uid;
      } catch {
        // User hasn't registered in Firebase Auth yet
      }
    }

    const targetDocId = resolvedUserId || finalAuthUid || (resolvedLecturerId ? `user_${resolvedLecturerId}` : null);

    if (targetDocId) {
      await adminDb.collection("users").doc(targetDocId).set({
        id: targetDocId,
        role: newRole,
        ...(effectiveEmail ? { email: effectiveEmail } : {}),
        ...(resolvedLecturerId ? { lecturerId: resolvedLecturerId } : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: caller.uid
      }, { merge: true });
    }

    // 7. Update lecturer record in /lecturers without mutating teaching data
    if (resolvedLecturerId) {
      await adminDb.collection("lecturers").doc(resolvedLecturerId).set({
        role: newRole,
        ...(finalAuthUid ? { authUid: finalAuthUid } : {}),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      updatedRole: newRole,
      userId: targetDocId,
      lecturerId: resolvedLecturerId
    });
  } catch (error: any) {
    console.error("[API] Update Role error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
