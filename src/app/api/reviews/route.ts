import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ReviewModel, OrderModel, ProductModel } from "@/lib/models";
import { store } from "@/lib/store";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "form-01";

    let reviews: any[] = [];

    // Try reading from MongoDB if connected
    const db = await connectDB();
    if (db) {
      try {
        const dbReviews = await ReviewModel.find({
          productId: { $in: [productId, productId.toLowerCase(), "form-01", "ANC-FORM-01"] },
        }).sort({ createdAt: -1 });

        if (dbReviews && dbReviews.length > 0) {
          reviews = dbReviews.map((r) => ({
            id: r.reviewId || r._id.toString(),
            reviewId: r.reviewId,
            productId: r.productId,
            userId: r.userId,
            author: r.userName || "Verified Buyer",
            userName: r.userName || "Verified Buyer",
            role: r.userRole || "Acoustic Enthusiast",
            userRole: r.userRole || "Acoustic Enthusiast",
            initials: r.userInitials || "VB",
            userInitials: r.userInitials || "VB",
            variant: r.variantSku || "Standard",
            variantSku: r.variantSku,
            rating: r.rating,
            comment: r.comment,
            verified: true,
            images: r.images || [],
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recently",
          }));
        }
      } catch (err) {
        console.warn("DB reviews retrieval warning:", err);
      }
    }

    // Fallback to in-memory store
    if (!reviews || reviews.length === 0) {
      reviews = store.getReviews(productId);
    }

    // Dynamic rating stats computation
    const reviewCount = reviews.length;
    const avg =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 5.0;
    const averageRating = Math.round(avg * 10) / 10;

    // Star distribution (1 to 5)
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      productId,
      averageRating,
      reviewCount,
      distribution,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session Verification (JWT_SECRET)
    const cookieToken = req.cookies.get("ancwave_token")?.value;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Please log in to submit a verified review." },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const userEmail = payload.email.toLowerCase();

    // 2. Parse and Validate Payload
    const body = await req.json();
    const {
      productId = "ANC-FORM-01",
      slug = "form-01",
      rating,
      comment,
      variantSku = "",
      variantName = "Silver mist",
      images = [],
    } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Review comment must be at least 5 characters." },
        { status: 400 }
      );
    }

    // Strict 5-Photo Enforcement per system specification
    if (Array.isArray(images) && images.length > 5) {
      return NextResponse.json(
        { success: false, error: "Maximum limit of 5 photos per review exceeded." },
        { status: 400 }
      );
    }

    // 3. Purchase Verification: Query Orders Collection
    let hasPurchased = false;
    const db = await connectDB();
    if (db) {
      try {
        const order = await OrderModel.findOne({
          $or: [
            { userId },
            { "customer.email": { $regex: new RegExp(`^${userEmail}$`, "i") } },
          ],
          paymentStatus: "paid",
          "items.productId": { $in: [productId, slug, "form-01", "ANC-FORM-01"] },
        });
        if (order) hasPurchased = true;
      } catch (err) {
        console.warn("DB purchase validation warning:", err);
      }
    }

    if (!hasPurchased) {
      hasPurchased = store.hasUserPurchased(userId, userEmail, productId);
    }

    if (!hasPurchased) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Verified Purchase Required: Only verified owners who purchased this audio hardware can post reviews.",
        },
        { status: 403 }
      );
    }

    // 4. Construct Review Record
    const reviewId = "rev-" + Math.random().toString(36).substring(2, 10);
    const userInitials = payload.name
      ? payload.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "VB";

    const cleanImages = Array.isArray(images) ? images.slice(0, 5) : [];

    const reviewDoc = {
      reviewId,
      productId,
      userId,
      userName: payload.name || "Verified Buyer",
      userRole: `Verified Owner · ${variantName}`,
      userInitials,
      variantSku,
      rating,
      comment: comment.trim(),
      images: cleanImages,
      createdAt: new Date(),
    };

    // 5. Persist to MongoDB if connected
    if (db) {
      try {
        await ReviewModel.create(reviewDoc);
      } catch (err) {
        console.warn("DB review create notice:", err);
      }
    }

    // Save to in-memory store & recalculate aggregate ratings
    const { averageRating, reviewCount, review: savedReview } = store.addReview({
      id: reviewId,
      reviewId,
      productId,
      userId,
      author: payload.name || "Verified Buyer",
      userName: payload.name || "Verified Buyer",
      role: `Verified Owner · ${variantName}`,
      userRole: `Verified Owner · ${variantName}`,
      initials: userInitials,
      userInitials,
      variant: variantName,
      variantSku,
      rating,
      comment: comment.trim(),
      verified: true,
      images: cleanImages,
      tags: ["Verified Buyer", "Acoustic Clarity"],
      createdAt: "Just now",
    });

    // 6. Update Product Dynamic Aggregate Rating in MongoDB
    if (db) {
      try {
        await ProductModel.findOneAndUpdate(
          { $or: [{ productId }, { slug }] },
          { averageRating, reviewCount, rating: averageRating },
          { new: true }
        );
      } catch (err) {
        console.warn("Product rating update notice:", err);
      }
    }

    // 7. On-Demand ISR Cache Purging via Next.js ISR
    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${slug}`);
      revalidatePath("/api/product");
      revalidatePath("/api/reviews");
    } catch {
      // ignore
    }

    // 8. Dispatch AWS EventBridge Event: ReviewCreated
    await dispatchEventBridgeEvent("ReviewCreated" as any, {
      reviewId,
      productId,
      userId,
      rating,
      imagesCount: cleanImages.length,
      newAverageRating: averageRating,
      totalReviews: reviewCount,
    });

    return NextResponse.json({
      success: true,
      message: "Review successfully posted! Your rating has been reflected across the platform.",
      review: savedReview,
      averageRating,
      reviewCount,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
