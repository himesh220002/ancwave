import { NextRequest, NextResponse } from "next/server";
import { signJWT } from "@/lib/auth";
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

    const cleanEmail = email.toLowerCase().trim();

    // Authenticate strictly against MongoDB Atlas users collection
    const db = await connectDB();
    if (db) {
      const dbUser = await UserModel.findOne({ email: cleanEmail });
      if (dbUser) {
        const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
        if (isMatch) {
          const userObj = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as "owner" | "admin" | "user" | "customer",
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

    return NextResponse.json(
      {
        success: false,
        error: "Invalid email or password. Please verify your credentials or register a new account.",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
