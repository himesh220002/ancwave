import { NextRequest, NextResponse } from "next/server";
import { signJWT, DEMO_OWNER, DEMO_ADMIN, DEMO_CUSTOMER } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { store } from "@/lib/store";
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

    // 1. Check built-in demo owner account
    if (
      cleanEmail === DEMO_OWNER.email.toLowerCase() &&
      (password === "ownerpassword123" || password === "owner")
    ) {
      const token = signJWT({
        userId: DEMO_OWNER.id,
        email: DEMO_OWNER.email,
        name: DEMO_OWNER.name,
        role: "owner",
      });

      const response = NextResponse.json({
        success: true,
        user: DEMO_OWNER,
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

    // 2. Check built-in demo admin account
    if (
      cleanEmail === DEMO_ADMIN.email.toLowerCase() &&
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

    // 3. Check built-in demo customer/user account
    if (
      cleanEmail === DEMO_CUSTOMER.email.toLowerCase() &&
      (password === "password123" || password === "customer" || password === "user")
    ) {
      const token = signJWT({
        userId: DEMO_CUSTOMER.id,
        email: DEMO_CUSTOMER.email,
        name: DEMO_CUSTOMER.name,
        role: DEMO_CUSTOMER.role,
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

    // 4. Check MongoDB Atlas if connected
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
            role: dbUser.role, // Reflects whatever is in MongoDB (including manual change to 'owner'!)
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

    // 5. Check in-memory store registered users
    const storeUser = store.findUserByEmail(cleanEmail);
    if (storeUser && storeUser.passwordHash) {
      const isMatch = await bcrypt.compare(password, storeUser.passwordHash);
      if (isMatch) {
        const userObj = {
          id: storeUser.id,
          email: storeUser.email,
          name: storeUser.name,
          role: storeUser.role,
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

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid email or password. You can sign up a new account, or use demo accounts (owner@ancwave.com, admin@ancwave.com, alex@example.com).",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
