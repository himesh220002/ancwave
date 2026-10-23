import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("ancwave_token")?.value;

    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const payload = verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    let liveRole = payload.role;
    let liveName = payload.name;

    // Check MongoDB for real-time role updates (e.g. manual Atlas modification to 'owner' or teammate promotion)
    try {
      const db = await connectDB();
      if (db) {
        const dbUser =
          (await UserModel.findById(payload.userId)) ||
          (await UserModel.findOne({ email: payload.email.toLowerCase() }));
        if (dbUser) {
          liveRole = dbUser.role;
          liveName = dbUser.name;
        }
      } else {
        const storeUser =
          store.findUserById(payload.userId) ||
          store.findUserByEmail(payload.email);
        if (storeUser) {
          liveRole = storeUser.role;
          liveName = storeUser.name;
        }
      }
    } catch {
      // In case of transient DB error, fall back to payload
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: liveName,
        role: liveRole,
      },
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("ancwave_token");
  response.cookies.delete("ancwave_day_token");
  return response;
}
