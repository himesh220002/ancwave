import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const all = searchParams.get("all");

    if (all === "true") {
      const products = store.getAllProducts();
      return NextResponse.json({
        success: true,
        products,
        cachedAt: new Date().toISOString(),
      });
    }

    const product = store.getProduct(slug || "form-01");

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
    const { stock, activeDiscount, isFlashSale, slug } = body;
    const targetSlug = slug || "form-01";

    let updatedProduct = store.getProduct(targetSlug);

    if (typeof stock === "number") {
      updatedProduct = store.updateStock(stock, activeDiscount, targetSlug);
    }

    if (typeof isFlashSale === "boolean") {
      updatedProduct.isFlashSale = isFlashSale;
    }

    // Try updating MongoDB if connected
    const db = await connectDB();
    if (db) {
      await ProductModel.findOneAndUpdate(
        { slug: targetSlug },
        { ...updatedProduct },
        { upsert: true, new: true }
      );
    }

    // On-demand revalidation
    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${targetSlug}`);
      revalidatePath("/api/product");
    } catch {
      // ignore outside request context
    }

    // Dispatch EventBridge event
    await dispatchEventBridgeEvent("StockUpdated", {
      slug: targetSlug,
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
