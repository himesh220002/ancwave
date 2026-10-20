import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";

export async function GET() {
  try {
    await connectDB();
    const product = store.getProduct();

    // Cache-Control header simulating CloudFront edge cache behavior
    const response = NextResponse.json(
      {
        success: true,
        product,
        cachedAt: product.lastRevalidatedAt,
        cacheStatus: "HIT - Edge CloudFront (max-age=60, stale-while-revalidate=300)",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "X-Cache-Provider": "AWS-CloudFront-ancwave-edge",
          "X-Inventory-Status": product.stock <= product.lowStockThreshold ? "LOW_STOCK" : "IN_STOCK",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error in /api/product GET:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { stock, activeDiscount, isFlashSale } = body;

    let updatedProduct = store.getProduct();

    if (typeof stock === "number") {
      updatedProduct = store.updateStock(stock, activeDiscount);
    }

    if (typeof isFlashSale === "boolean") {
      updatedProduct.isFlashSale = isFlashSale;
    }

    // Try updating MongoDB if connected
    const db = await connectDB();
    if (db) {
      await ProductModel.findOneAndUpdate(
        { model: "WIRELESS OVER-EAR" },
        { ...updatedProduct },
        { upsert: true, new: true }
      );
    }

    // On-demand revalidation
    try {
      revalidatePath("/");
      revalidatePath("/api/product");
    } catch {
      // ignore outside request context
    }

    // Dispatch EventBridge event
    await dispatchEventBridgeEvent("StockUpdated", {
      newStock: updatedProduct.stock,
      activeDiscount: updatedProduct.activeDiscount,
      trigger: "AdminInventoryAdjustment",
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Inventory updated and edge cache revalidated.",
    });
  } catch (error) {
    console.error("Error in /api/product PATCH:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}
