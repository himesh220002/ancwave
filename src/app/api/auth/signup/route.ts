import { NextRequest, NextResponse } from "next/server";
import { signJWT, hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // 1. Try MongoDB Atlas if connected
    const db = await connectDB();
    if (db) {
      const existingUser = await UserModel.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      // Default role is strictly 'user' as requested
      const newUserDoc = await UserModel.create({
        email: cleanEmail,
        passwordHash: hashedPassword,
        name: cleanName,
        role: "user",
      });

      const userObj = {
        id: newUserDoc._id.toString(),
        email: newUserDoc.email,
        name: newUserDoc.name,
        role: newUserDoc.role as "user",
      };

      const token = signJWT({
        userId: userObj.id,
        email: userObj.email,
        name: userObj.name,
        role: userObj.role,
      });

      const response = NextResponse.json({
        success: true,
        message: "Account created successfully with role 'user'.",
        user: userObj,
        token,
      });

      response.cookies.set("ancwave_token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. In-memory fallback if MongoDB is not yet connected
    const existingInStore = store.findUserByEmail(cleanEmail);
    if (existingInStore) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const storeUser = store.registerUser({
      email: cleanEmail,
      name: cleanName,
      passwordHash: hashedPassword,
      role: "user",
    });

    const userObj = {
      id: storeUser.id,
      email: storeUser.email,
      name: storeUser.name,
      role: storeUser.role as "user",
    };

    const token = signJWT({
      userId: userObj.id,
      email: userObj.email,
      name: userObj.name,
      role: userObj.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully with role 'user'.",
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
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
