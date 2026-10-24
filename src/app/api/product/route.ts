import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";
import { IVariant, IVariantGroup, IVariantColor, variantGroupsToChildVariants } from "@/types";

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
      variantUpdates,
      childVariants,
      variantGroups,
      action,
      groupId,
      color,
      name,
      description,
      type,
      basePrice,
      baseDiscount,
      globalSpecs,
    } = body;

    const targetSlug = slug || "form-01";
    let updatedProduct = store.getProduct(targetSlug);

    // 1. Direct Add Color to Variant Architecture
    if (action === "addColor" && groupId && color) {
      updatedProduct = store.addColorToVariantGroup(targetSlug, groupId, color);
    }
    // 2. Direct Remove Color from Architecture
    else if (action === "removeColor" && variantSku) {
      updatedProduct = store.removeColorFromVariantGroup(targetSlug, variantSku);
    }
    // 3. Batch variant restock (from Restock Modal)
    else if (variantUpdates && Array.isArray(variantUpdates)) {
      updatedProduct = store.updateMultipleVariantStocks(targetSlug, variantUpdates);
    }
    // 4. Single variant stock adjustment
    else if (variantSku && typeof variantStock === "number") {
      updatedProduct = store.updateVariantStock(targetSlug, variantSku, variantStock);
    }
    // 5. Full hierarchical variantGroups list or metadata
    else if (variantGroups && Array.isArray(variantGroups)) {
      updatedProduct = store.updateProductWithVariants({
        slug: targetSlug,
        productId: productId || updatedProduct.productId || "ANC-FORM-01",
        name: name || updatedProduct.name,
        description: description || updatedProduct.description,
        type: type || updatedProduct.type,
        basePrice: typeof basePrice === "number" ? basePrice : updatedProduct.basePrice,
        baseDiscount: typeof baseDiscount === "number" ? baseDiscount : updatedProduct.baseDiscount,
        globalSpecs: globalSpecs || updatedProduct.globalSpecs,
        variantGroups: variantGroups as IVariantGroup[],
      });
    }
    // 6. Full child variants list or metadata
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
    // 7. Simple master stock adjustment
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
      variantUpdated: variantSku || (variantUpdates ? "batch-restock" : "all"),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      productId,
      category,
      categorySlug,
      model,
      tagline,
      description,
      price,
      originalPrice,
      basePrice,
      baseDiscount,
      type,
      globalSpecs,
      childVariants,
      variants,
      specs,
      metrics,
    } = body;

    const rawName = name || body.title;
    if (!rawName || !rawName.trim()) {
      return NextResponse.json({ success: false, error: "Product name or title is required" }, { status: 400 });
    }

    const productName = rawName.trim();
    const generatedSlug = (slug || productName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const generatedProductId = productId || `PROD-${Date.now().toString(36).toUpperCase()}`;

    // Accept variantGroups or childVariants or variants array with architecture/specOverride
    const inputVariantGroups = body.variantGroups;
    let parsedVariants: IVariant[] = [];

    if (Array.isArray(inputVariantGroups) && inputVariantGroups.length > 0) {
      parsedVariants = variantGroupsToChildVariants(inputVariantGroups, Number(price) || Number(basePrice) || 99);
    } else {
      const inputVariants = childVariants || variants;
      parsedVariants = Array.isArray(inputVariants) && inputVariants.length > 0
        ? inputVariants.map((v: any, i: number) => ({
            sku: v.sku || `${generatedProductId}-VAR-${i + 1}`,
            color: v.color || "Standard",
            specOverride: v.specOverride || v.architecture || "Standard Fit / Cut",
            price: Number(v.price) || Number(price) || 99,
            discount: Number(v.discount) || 0,
            stock: Number(v.stock) || 0,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image || "/images/hero-silver.jpg"],
          }))
        : [
            {
              sku: `${generatedProductId}-VAR-1`,
              color: "Standard",
              specOverride: "Default Edition",
              price: Number(price) || 99,
              discount: 0,
              stock: 10,
              images: ["/images/hero-silver.jpg"],
            },
          ];
    }

    const initialTotalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

    const newProduct = store.addProduct({
      id: generatedSlug,
      slug: generatedSlug,
      productId: generatedProductId,
      name: productName,
      model: model || category || "PREMIUM HARDWARE",
      category: category || "General Goods",
      categorySlug: categorySlug || generatedSlug,
      tagline: tagline || "Engineered for precision and utility.",
      description: description || "Authentic quality product crafted with high-grade components.",
      price: Number(price) || Number(basePrice) || 99,
      basePrice: Number(basePrice) || Number(price) || 99,
      originalPrice: Number(originalPrice) || (Number(price) || 99) * 1.2,
      activeDiscount: Number(baseDiscount) || 0,
      baseDiscount: Number(baseDiscount) || 0,
      type: type || category || "Tech & Goods",
      stock: initialTotalStock,
      lowStockThreshold: 5,
      isFlashSale: false,
      warrantyYears: 2,
      returnDays: 30,
      deliveryEstimate: "Ready to ship · Fast delivery in 2–4 business days",
      rating: 5.0,
      averageRating: 5.0,
      reviewCount: 0,
      sku: `${generatedProductId}-MASTER`,
      globalSpecs: globalSpecs || {},
      variantGroups: Array.isArray(inputVariantGroups) && inputVariantGroups.length > 0 ? inputVariantGroups : undefined,
      childVariants: parsedVariants,
      variants: Array.isArray(variants) && variants.length > 0 ? variants : parsedVariants.map((cv, idx) => ({
        id: cv.color.toLowerCase().replace(/[^a-z0-9]/g, "-") || `var-${idx}`,
        name: cv.color,
        hex: idx === 0 ? "#111111" : idx === 1 ? "#C4C8D0" : "#D6C4A6",
        borderHex: "#333333",
        image: cv.images?.[0] || "/images/hero-silver.jpg",
        images: cv.images || ["/images/hero-silver.jpg"],
        tag: String(idx + 1).padStart(2, "0"),
      })),
      specs: specs || {},
      metrics: metrics || {},
      lastRevalidatedAt: new Date().toISOString(),
    });

    // Persist to MongoDB
    const db = await connectDB();
    if (db) {
      try {
        await ProductModel.findOneAndUpdate(
          { $or: [{ slug: generatedSlug }, { productId: generatedProductId }] },
          { $set: newProduct },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("MongoDB Product creation notice:", err);
      }
    }

    // Revalidate edge caches
    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${generatedSlug}`);
      revalidatePath("/api/product");
    } catch {
      // ignore
    }

    // Dispatch AWS EventBridge Event: ProductCreated
    await dispatchEventBridgeEvent("ProductCreated", {
      productId: generatedProductId,
      slug: generatedSlug,
      name: newProduct.name,
      category: newProduct.category,
      stock: newProduct.stock,
      variantCount: parsedVariants.length,
      trigger: "AdminDynamicProductCreation",
    });

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Product created successfully and published to edge CDN.",
    });
  } catch (error) {
    console.error("Error in /api/product POST:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    store.deleteProduct(slug);

    const db = await connectDB();
    if (db) {
      try {
        await ProductModel.deleteOne({ slug });
      } catch (err) {
        console.warn("MongoDB delete notice:", err);
      }
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${slug}`);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, message: `Product ${slug} deleted successfully.` });
  } catch (error) {
    console.error("Error in /api/product DELETE:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
