import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, DEMO_ADMIN } from "@/lib/auth";

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

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
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
  return response;
}
