import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, authenticateApiCaller } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let caller;
    try {
      caller = await authenticateApiCaller(authHeader);
    } catch (authErr: any) {
      return NextResponse.json({ success: false, error: authErr.message || "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, deleteLecturerRecord = false } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Target user ID is required" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Protect primary super admin
    const targetDocSnap = await adminDb.collection("users").doc(targetUserId).get();
    const targetData = targetDocSnap.exists ? targetDocSnap.data() : null;

    if (targetData?.email?.toLowerCase() === "charlestonkyeremeh6@gmail.com") {
      return NextResponse.json(
        { success: false, error: "The primary Super Administrator account cannot be deleted" },
        { status: 403 }
      );
    }

    // Permission checks
    const isSelf = caller.uid === targetUserId;
    const isSuperAdmin = caller.role === "super_admin";
    const isAdmin = caller.role === "admin";
    const targetIsAdmin = targetData?.role === "admin" || targetData?.role === "super_admin";

    // Standard Admin can only delete lecturer accounts, not other admins or super admins
    if (isAdmin && !isSuperAdmin && !isSelf) {
      if (targetIsAdmin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Standard Administrators cannot delete administrative accounts" },
          { status: 403 }
        );
      }
    }

    if (!isSelf && !isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not have permission to delete this account" },
        { status: 403 }
      );
    }

    // 1. Delete user from Firebase Auth
    try {
      await adminAuth.deleteUser(targetUserId);
    } catch (authDeleteErr: any) {
      console.warn(`[API Delete User] Firebase Auth user delete warning for ${targetUserId}:`, authDeleteErr?.message);
      // If user doesn't exist in Auth, continue to clean up Firestore
    }

    // 2. Unlink or clean up associated lecturer directory profile
    const associatedLecturerId = targetData?.lecturerId;
    if (associatedLecturerId) {
      const lecturerRef = adminDb.collection("lecturers").doc(associatedLecturerId);
      if (deleteLecturerRecord) {
        await lecturerRef.delete();
      } else {
        await lecturerRef.update({
          authUid: null,
          accountStatus: "unclaimed"
        }).catch(async () => {
          // If update fails because doc structure, try merge
          await lecturerRef.set({ authUid: null, accountStatus: "unclaimed" }, { merge: true });
        });
      }
    }

    // If targetUserId is linked by authUid in any lecturer record, unlink it
    try {
      const lecQuery = await adminDb.collection("lecturers").where("authUid", "==", targetUserId).get();
      for (const lecDoc of lecQuery.docs) {
        if (deleteLecturerRecord) {
          await lecDoc.ref.delete();
        } else {
          await lecDoc.ref.update({
            authUid: null,
            accountStatus: "unclaimed"
          });
        }
      }
    } catch (lecQueryErr) {
      console.warn("[API Delete User] Lecturer query cleanup warning:", lecQueryErr);
    }

    // 3. Delete user document from Firestore `/users/{uid}`
    await adminDb.collection("users").doc(targetUserId).delete();

    // 4. Log system activity
    try {
      await adminDb.collection("activities").add({
        id: `act-${Date.now()}`,
        type: "system",
        description: `User account (${targetData?.email || targetUserId}) was permanently deleted by ${caller.email || caller.uid}`,
        timestamp: new Date().toISOString(),
        user: caller.email || "Administrator"
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("[API] Delete User error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
