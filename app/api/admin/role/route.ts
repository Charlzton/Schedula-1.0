import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, authenticateApiCaller } from "@/lib/firebaseAdmin";

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
        { success: false, error: "Unauthorized: Only a Super Administrator has permission to modify administrator roles" },
        { status: 403 }
      );
    }

    const { userId, newRole } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Target user ID is required" }, { status: 400 });
    }

    if (newRole !== "admin" && newRole !== "super_admin" && newRole !== "lecturer") {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const targetDoc = await adminDb.collection("users").doc(userId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    const targetData = targetDoc.data();
    if (targetData?.email?.toLowerCase() === "charlestonkyeremeh6@gmail.com" && newRole !== "super_admin") {
      return NextResponse.json({ success: false, error: "Primary Super Administrator privilege cannot be revoked" }, { status: 403 });
    }

    await adminDb.collection("users").doc(userId).update({
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: caller.uid
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Update Role error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
