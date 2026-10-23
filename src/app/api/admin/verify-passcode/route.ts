import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, verifyDayToken, signDayToken, verifyDailyAdminPasscode } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the caller first
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("ancwave_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in first." },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session. Please re-authenticate." },
        { status: 401 }
      );
    }

    let userRole = payload.role;
    try {
      const { connectDB } = await import("@/lib/db");
      const { UserModel } = await import("@/lib/models");
      const { store } = await import("@/lib/store");

      const db = await connectDB();
      if (db) {
        const dbUser =
          (await UserModel.findById(payload.userId)) ||
          (await UserModel.findOne({ email: payload.email.toLowerCase() }));
        if (dbUser) userRole = dbUser.role as "owner" | "admin" | "user" | "customer";
      } else {
        const storeUser =
          store.findUserById(payload.userId) || store.findUserByEmail(payload.email);
        if (storeUser) userRole = storeUser.role;
      }
    } catch {
      // fallback to payload
    }

    // Role check: Only Owner or Admin can request a Day-Token
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied. Only accounts with 'owner' or 'admin' roles can enter the dashboard.",
        },
        { status: 403 }
      );
    }

    // 2. Validate the Daily Operations Passcode
    const { passcode } = await req.json();
    if (!passcode || !verifyDailyAdminPasscode(passcode)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Daily Operations Passcode. Check DAILY_ADMIN_PASSCODE in your environment.",
        },
        { status: 401 }
      );
    }

    // 3. Issue 24-Hour Day-Token
    const dayToken = signDayToken({
      userId: payload.userId,
      email: payload.email,
      role: userRole as "owner" | "admin",
    });

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const response = NextResponse.json({
      success: true,
      message: "24-Hour Operational Day-Token verified and issued successfully.",
      token: dayToken,
      expiresAt,
      role: userRole,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: userRole,
      },
    });

    // Set 24-Hour cookie
    response.cookies.set("ancwave_day_token", dayToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 86400 seconds = 1 day
    });

    return response;
  } catch (error) {
    console.error("Daily passcode verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during passcode validation." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieDayToken = req.cookies.get("ancwave_day_token")?.value;
    const headerDayToken = req.headers.get("x-ancwave-day-token");
    const token = cookieDayToken || headerDayToken;

    if (!token) {
      return NextResponse.json({ valid: false, error: "No day-token present" }, { status: 200 });
    }

    const payload = verifyDayToken(token);
    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Day-token expired or invalid" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      payload,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Dashboard operational session locked.",
  });
  response.cookies.delete("ancwave_day_token");
  return response;
}
