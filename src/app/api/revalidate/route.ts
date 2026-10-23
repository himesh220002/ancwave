import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/store";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";

const EXPECTED_SECRET =
  process.env.REVALIDATE_SECRET || "ancwave_revalidation_secret_token_2026";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Extract secret from header, auth bearer, query param, or body
    const headerSecret = req.headers.get("x-revalidate-secret");
    const authBearer = req.headers.get("authorization")?.replace("Bearer ", "");
    const querySecret = searchParams.get("secret");
    const bodySecret = body.secret;

    const providedSecret = headerSecret || authBearer || querySecret || bodySecret;

    // Secret validation check
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
      return NextResponse.json(
        {
          revalidated: false,
          error: "Unauthorized: Invalid or missing REVALIDATE_SECRET.",
          hint: "Provide the secret in the x-revalidate-secret header or ?secret= parameter.",
        },
        { status: 401 }
      );
    }

    const path = body.path || searchParams.get("path") || "/";
    const tag = body.tag || "product-details";

    // On-demand Next.js ISR Cache Revalidation
    try {
      revalidatePath(path);
      revalidatePath("/products");
      revalidatePath("/api/product");
    } catch (err) {
      console.warn("Revalidation notice:", err);
    }

    const currentProduct = store.getProduct();
    currentProduct.lastRevalidatedAt = new Date().toISOString();

    // Dispatch AWS EventBridge Event: CachePurged
    const eventLog = await dispatchEventBridgeEvent("CachePurged", {
      revalidatedPath: path,
      tag,
      currentStock: currentProduct.stock,
      lowStockAlertActive: currentProduct.stock <= currentProduct.lowStockThreshold,
      timestamp: currentProduct.lastRevalidatedAt,
      executor: "Next.js ISR On-Demand Edge Handler",
    });

    return NextResponse.json({
      revalidated: true,
      path,
      tag,
      timestamp: currentProduct.lastRevalidatedAt,
      currentStock: currentProduct.stock,
      flashAlertActive: currentProduct.stock <= currentProduct.lowStockThreshold,
      awsEventId: eventLog.eventId,
      message: `Cache successfully purged using REVALIDATE_SECRET. Next visitor receives real-time stock (${currentProduct.stock}) with instantaneous edge hydration.`,
    });
  } catch (error) {
    console.error("Error in /api/revalidate:", error);
    return NextResponse.json({ revalidated: false, error: "Failed to revalidate" }, { status: 500 });
  }
}
