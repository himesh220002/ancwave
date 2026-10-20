import { NextRequest, NextResponse } from "next/server";
import { signJWT, DEMO_ADMIN, DEMO_CUSTOMER } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Check built-in demo admin account
    if (
      email.toLowerCase() === DEMO_ADMIN.email.toLowerCase() &&
      (password === "adminpassword123" || password === "admin")
    ) {
      const token = signJWT({
        userId: DEMO_ADMIN.id,
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        role: "admin",
      });

      const response = NextResponse.json({
        success: true,
        user: DEMO_ADMIN,
        token,
      });

      response.cookies.set("ancwave_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2. Check built-in demo customer account
    if (
      email.toLowerCase() === DEMO_CUSTOMER.email.toLowerCase() &&
      (password === "password123" || password === "customer")
    ) {
      const token = signJWT({
        userId: DEMO_CUSTOMER.id,
        email: DEMO_CUSTOMER.email,
        name: DEMO_CUSTOMER.name,
        role: "customer",
      });

      const response = NextResponse.json({
        success: true,
        user: DEMO_CUSTOMER,
        token,
      });

      response.cookies.set("ancwave_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 3. Check MongoDB database if connected
    const db = await connectDB();
    if (db) {
      const dbUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (dbUser) {
        const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
        if (isMatch) {
          const userObj = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          };
          const token = signJWT({
            userId: userObj.id,
            email: userObj.email,
            name: userObj.name,
            role: userObj.role,
          });

          const response = NextResponse.json({
            success: true,
            user: userObj,
            token,
          });

          response.cookies.set("ancwave_token", token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });

          return response;
        }
      }
    }

    // Fallback: If not matched and not in DB, provide helpful error or create customer session
    return NextResponse.json(
      {
        success: false,
        error: "Invalid credentials. Use admin@ancwave.com / adminpassword123 or alex@example.com / password123",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
