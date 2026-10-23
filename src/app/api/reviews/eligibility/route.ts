import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { OrderModel, ReviewModel } from "@/lib/models";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "form-01";

    // 1. Verify User Session (JWT)
    const cookieToken = req.cookies.get("ancwave_token")?.value;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({
        eligible: false,
        reason: "NOT_LOGGED_IN",
        message: "Sign in to submit a verified owner acoustic review.",
        hasReviewed: false,
      });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({
        eligible: false,
        reason: "NOT_LOGGED_IN",
        message: "Your session has expired. Please sign in again.",
        hasReviewed: false,
      });
    }

    const userId = payload.userId;
    const userEmail = payload.email.toLowerCase();

    // 2. Query Orders to verify completed transaction matching productId
    let hasPurchased = false;

    // Check MongoDB first if connected
    const db = await connectDB();
    if (db) {
      try {
        const order = await OrderModel.findOne({
          $or: [
            { userId },
            { "customer.email": { $regex: new RegExp(`^${userEmail}$`, "i") } },
          ],
          paymentStatus: "paid",
          "items.productId": { $in: [productId, productId.toLowerCase(), "form-01", "ANC-FORM-01"] },
        });

        if (order) {
          hasPurchased = true;
        }
      } catch (err) {
        console.warn("DB purchase lookup error, falling back to store:", err);
      }
    }

    // Fallback to in-memory store
    if (!hasPurchased) {
      hasPurchased = store.hasUserPurchased(userId, userEmail, productId);
    }

    if (!hasPurchased) {
      return NextResponse.json({
        eligible: false,
        reason: "NO_PURCHASE",
        message:
          "Verified buyer reviews are reserved for customers with completed orders of this audio platform.",
        hasReviewed: false,
        user: { id: userId, email: payload.email, name: payload.name },
      });
    }

    // 3. Check if user has already reviewed this product
    let hasReviewed = false;
    if (db) {
      try {
        const existingReview = await ReviewModel.findOne({
          userId,
          productId: { $in: [productId, "ANC-FORM-01", "form-01"] },
        });
        if (existingReview) hasReviewed = true;
      } catch (err) {
        console.warn("DB review lookup error:", err);
      }
    }

    if (!hasReviewed) {
      const existingReviews = store.getReviews(productId);
      hasReviewed = existingReviews.some((r) => r.userId === userId);
    }

    return NextResponse.json({
      eligible: true,
      reason: "ELIGIBLE",
      message: "Verified buyer status confirmed! You can submit a review.",
      hasReviewed,
      user: { id: userId, email: payload.email, name: payload.name },
    });
  } catch (error) {
    console.error("Review eligibility check error:", error);
    return NextResponse.json(
      { eligible: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to allow quick demo-verification in pair-programming / demo modes
export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("ancwave_token")?.value;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Please sign in first" }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const productId = body.productId || "form-01";

    // Grant verified order to user in store
    const verifiedOrder = store.addVerifiedOrderForUser(payload.userId, payload.email, productId);

    // Save to DB if connected
    const db = await connectDB();
    if (db) {
      try {
        await OrderModel.create(verifiedOrder);
      } catch (err) {
        console.warn("MongoDB order sync notice:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo purchase verified! You can now write a verified review.",
      orderNumber: verifiedOrder.orderNumber,
    });
  } catch (error) {
    console.error("Demo verification error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify purchase" }, { status: 500 });
  }
}
