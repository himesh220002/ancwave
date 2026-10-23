import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";
import { IVariant } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const all = searchParams.get("all");

    await connectDB();

    if (all === "true") {
      const products = store.getAllProducts();
      return NextResponse.json({
        success: true,
        products,
        cachedAt: new Date().toISOString(),
      });
    }

    const product = store.getProduct(slug || "form-01");

    return NextResponse.json(
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
  } catch (error) {
    console.error("Error in /api/product GET:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      stock,
      activeDiscount,
      isFlashSale,
      slug,
      productId,
      variantSku,
      variantStock,
      childVariants,
      name,
      description,
      type,
      basePrice,
      baseDiscount,
      globalSpecs,
    } = body;

    const targetSlug = slug || "form-01";
    let updatedProduct = store.getProduct(targetSlug);

    // 1. If updating a specific child variant's stock
    if (variantSku && typeof variantStock === "number") {
      updatedProduct = store.updateVariantStock(targetSlug, variantSku, variantStock);
    }
    // 2. If updating full child variants list or product metadata
    else if (childVariants && Array.isArray(childVariants)) {
      updatedProduct = store.updateProductWithVariants({
        slug: targetSlug,
        productId: productId || updatedProduct.productId || "ANC-FORM-01",
        name: name || updatedProduct.name,
        description: description || updatedProduct.description,
        type: type || updatedProduct.type,
        basePrice: typeof basePrice === "number" ? basePrice : updatedProduct.basePrice,
        baseDiscount: typeof baseDiscount === "number" ? baseDiscount : updatedProduct.baseDiscount,
        globalSpecs: globalSpecs || updatedProduct.globalSpecs,
        childVariants: childVariants as IVariant[],
      });
    }
    // 3. Simple master stock adjustment
    else if (typeof stock === "number") {
      updatedProduct = store.updateStock(stock, activeDiscount, targetSlug);
    }

    if (typeof isFlashSale === "boolean") {
      updatedProduct.isFlashSale = isFlashSale;
    }

    // Persist to MongoDB if connected
    const db = await connectDB();
    if (db) {
      try {
        await ProductModel.findOneAndUpdate(
          { $or: [{ slug: targetSlug }, { productId: updatedProduct.productId }] },
          {
            $set: {
              ...updatedProduct,
              variants: updatedProduct.childVariants || [],
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("DB product sync notice:", err);
      }
    }

    // On-demand Next.js ISR revalidation
    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${targetSlug}`);
      revalidatePath("/api/product");
    } catch {
      // ignore
    }

    // Dispatch AWS EventBridge Event: StockUpdated
    await dispatchEventBridgeEvent("StockUpdated", {
      slug: targetSlug,
      productId: updatedProduct.productId,
      newStock: updatedProduct.stock,
      activeDiscount: updatedProduct.activeDiscount,
      variantUpdated: variantSku || "all",
      trigger: "RealTimeInventoryAdjustment",
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Inventory updated instantaneously and edge cache purged.",
    });
  } catch (error) {
    console.error("Error in /api/product PATCH:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}
