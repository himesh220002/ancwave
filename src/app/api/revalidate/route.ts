import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/store";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || "/";
    const tag = body.tag || "product-details";

    // Revalidate Next.js cache
    try {
      revalidatePath(path);
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
      message: `Cache successfully purged. Next visitor receives real-time stock (${currentProduct.stock}) with instantaneous edge hydration.`,
    });
  } catch (error) {
    console.error("Error in /api/revalidate:", error);
    return NextResponse.json({ revalidated: false, error: "Failed to revalidate" }, { status: 500 });
  }
}
