import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { store } from "@/lib/store";

/**
 * Helper to ensure the request is from an authenticated 'owner'
 */
async function authenticateOwner(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("ancwave_token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload) return null;

  // Real-time check from DB if possible
  try {
    const db = await connectDB();
    if (db) {
      const dbUser =
        (await UserModel.findById(payload.userId)) ||
        (await UserModel.findOne({ email: payload.email.toLowerCase() }));
      if (dbUser && dbUser.role === "owner") {
        return { ...payload, role: "owner" as const };
      }
    } else {
      const storeUser =
        store.findUserById(payload.userId) || store.findUserByEmail(payload.email);
      if (storeUser && storeUser.role === "owner") {
        return { ...payload, role: "owner" as const };
      }
    }
  } catch {
    // fallback to payload
  }

  if (payload.role === "owner") {
    return payload;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ownerPayload = await authenticateOwner(req);
    if (!ownerPayload) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Denied. Only the verified Owner can search employees and manage team access.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();

    // 1. Try MongoDB
    const db = await connectDB();
    if (db) {
      const filter = query
        ? {
            $or: [
              { email: { $regex: query, $options: "i" } },
              { name: { $regex: query, $options: "i" } },
            ],
          }
        : {};

      const users = await UserModel.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      return NextResponse.json({
        success: true,
        users: users.map((u) => ({
          id: (u as any)._id.toString(),
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: (u as any).createdAt || new Date().toISOString(),
        })),
      });
    }

    // 2. In-Memory Store Fallback
    const storeUsers = store.searchUsers(query);
    return NextResponse.json({
      success: true,
      users: storeUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Team search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during team search." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ownerPayload = await authenticateOwner(req);
    if (!ownerPayload) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Denied. Only the verified Owner can grant or revoke employee admin permissions.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, newRole } = body;

    if (!email || !newRole) {
      return NextResponse.json(
        { success: false, error: "Email and newRole ('admin' | 'user') are required." },
        { status: 400 }
      );
    }

    if (newRole !== "admin" && newRole !== "user") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid target role. You can only assign 'admin' or revoke to 'user'.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prevent modifying the caller's own owner account or other owners
    if (cleanEmail === ownerPayload.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot revoke your own Owner role from the website.",
        },
        { status: 400 }
      );
    }

    // 1. Try MongoDB
    const db = await connectDB();
    if (db) {
      const targetUser = await UserModel.findOne({ email: cleanEmail });
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: `No user found with email: ${cleanEmail}` },
          { status: 404 }
        );
      }

      if (targetUser.role === "owner") {
        return NextResponse.json(
          {
            success: false,
            error: "Target user is an Owner. Owner roles can only be modified in MongoDB Atlas.",
          },
          { status: 403 }
        );
      }

      targetUser.role = newRole;
      await targetUser.save();

      // Also sync store
      store.updateUserRole(cleanEmail, newRole);

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${targetUser.name} (${cleanEmail}) to role '${newRole}'.`,
        user: {
          id: targetUser._id.toString(),
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
        },
      });
    }

    // 2. In-Memory Store Fallback
    const targetStoreUser = store.findUserByEmail(cleanEmail);
    if (!targetStoreUser) {
      return NextResponse.json(
        { success: false, error: `No user found with email: ${cleanEmail}` },
        { status: 404 }
      );
    }

    if (targetStoreUser.role === "owner") {
      return NextResponse.json(
        {
          success: false,
          error: "Target user is an Owner. Owner roles can only be modified in MongoDB Atlas.",
        },
        { status: 403 }
      );
    }

    const updated = store.updateUserRole(cleanEmail, newRole);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updated?.name} (${cleanEmail}) to role '${newRole}'.`,
      user: updated,
    });
  } catch (error) {
    console.error("Team role update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during team role assignment." },
      { status: 500 }
    );
  }
}
