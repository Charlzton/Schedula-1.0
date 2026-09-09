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

    if (caller.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only a Super Administrator has permission to provision administrative accounts" },
        { status: 403 }
      );
    }

    const { fullName, email, password, role, institution } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (fullName || "").trim();
    const cleanPassword = password || "";

    if (!cleanEmail || !cleanName || !cleanPassword) {
      return NextResponse.json({ success: false, error: "Full name, email address, and password are required" }, { status: 400 });
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters in length" }, { status: 400 });
    }

    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Create user in Firebase Auth
    let newUser;
    try {
      newUser = await adminAuth.createUser({
        email: cleanEmail,
        password: cleanPassword,
        displayName: cleanName,
      });
    } catch (err: any) {
      let message = err?.message || "Failed to create Auth user";
      if (err?.code === "auth/email-already-exists" || err?.message?.includes("email already exists")) {
        message = "An account with this email address already exists";
      }
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    // Create authoritative user profile document in Firestore `/users/{uid}`
    const userDocRef = adminDb.collection("users").doc(newUser.uid);
    const newAdminRecord = {
      id: newUser.uid,
      name: cleanName,
      email: cleanEmail,
      role: role,
      institution: (institution || "University of Ghana").trim(),
      createdAt: new Date().toISOString(),
      createdBy: caller.uid
    };

    await userDocRef.set(newAdminRecord, { merge: true });

    return NextResponse.json({ success: true, userId: newUser.uid });

  } catch (error: any) {
    console.error("[API] Provision Admin error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
