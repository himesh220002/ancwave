import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { dispatchEventBridgeEvent } from "@/lib/aws-services";
import { IVariant, IVariantGroup, IVariantColor, variantGroupsToChildVariants, normalizeProductData, DEFAULT_USD_TO_INR_RATE } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const all = searchParams.get("all");

    const db = await connectDB();

    if (all === "true") {
      let products: any[] = [];
      if (db) {
        try {
          const dbProducts = await ProductModel.find({}).lean();
          if (dbProducts && dbProducts.length > 0) {
            products = dbProducts.map((p: any) => {
              const formatted = normalizeProductData(p);
              if (typeof store?.addProduct === "function") {
                store.addProduct(formatted as any);
              }
              return formatted;
            });
          }
        } catch (dbErr) {
          console.warn("DB find failed in /api/product, falling back to store:", dbErr);
        }
      }

      if (!products.length) {
        products = store.getAllProducts();
      }

      return NextResponse.json(
        {
          success: true,
          products,
          cachedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const targetSlug = slug || "form-01";
    let product: any = null;

    if (db) {
      try {
        const doc = await ProductModel.findOne({
          $or: [{ slug: targetSlug }, { productId: targetSlug }, { id: targetSlug }],
        }).lean();
        if (doc) {
          product = normalizeProductData(doc);
          if (typeof store?.addProduct === "function") {
            store.addProduct(product as any);
          }
        }
      } catch (dbErr) {
        console.warn("DB findOne failed in /api/product:", dbErr);
      }
    }

    if (!product) {
      product = normalizeProductData(store.getProduct(targetSlug));
    }

    return NextResponse.json(
      {
        success: true,
        product,
        cachedAt: product?.lastRevalidatedAt || new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Inventory-Status": (product?.stock ?? 0) <= (product?.lowStockThreshold ?? 5) ? "LOW_STOCK" : "IN_STOCK",
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
      price,
      basePrice,
      priceInr,
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
      baseDiscount,
      globalSpecs,
    } = body;

    const targetSlug = slug || "form-01";
    let updatedProduct = store.getProduct(targetSlug);

    // Restock Pipeline: Apply Restock Process (In-Progress PO)
    if (action === "apply-restock-process") {
      const targetQuantity = Number(body.targetQty) || 5;
      const days = Number(body.leadTimeDays) || 5;
      updatedProduct = store.applyRestockProcess(targetSlug, variantSku, targetQuantity, days, body.note);
    }
    // Restock Pipeline: Receive arrived stock (Partial or Complete)
    else if (action === "receive-restock-stock") {
      const arrivedQty = Number(body.receivedQty) || 1;
      updatedProduct = store.receiveRestockStock(targetSlug, variantSku, arrivedQty);
    }
    // Restock Pipeline: Cancel Restock Process
    else if (action === "cancel-restock-process") {
      updatedProduct = store.cancelRestockProcess(targetSlug, variantSku);
    }
    // 1. Direct Add Color to Variant Architecture
    else if (action === "addColor" && groupId && color) {
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
      const effBasePrice = typeof basePrice === "number" ? basePrice : (typeof price === "number" ? price : updatedProduct.basePrice);
      const effPrice = typeof price === "number" ? price : effBasePrice;
      const effPriceInr = typeof priceInr === "number" ? priceInr : (typeof effPrice === "number" ? Math.round(effPrice * DEFAULT_USD_TO_INR_RATE) : updatedProduct.priceInr);

      updatedProduct = store.updateProductWithVariants({
        slug: targetSlug,
        productId: productId || updatedProduct.productId || "ANC-FORM-01",
        name: name || updatedProduct.name,
        description: description || updatedProduct.description,
        type: type || updatedProduct.type,
        basePrice: effBasePrice,
        price: effPrice,
        priceInr: effPriceInr,
        baseDiscount: typeof baseDiscount === "number" ? baseDiscount : updatedProduct.baseDiscount,
        globalSpecs: globalSpecs || updatedProduct.globalSpecs,
        variantGroups: variantGroups as IVariantGroup[],
      });
    }
    // 6. Full child variants list or metadata
    else if (childVariants && Array.isArray(childVariants)) {
      const effBasePrice = typeof basePrice === "number" ? basePrice : (typeof price === "number" ? price : updatedProduct.basePrice);
      const effPrice = typeof price === "number" ? price : effBasePrice;
      const effPriceInr = typeof priceInr === "number" ? priceInr : (typeof effPrice === "number" ? Math.round(effPrice * DEFAULT_USD_TO_INR_RATE) : updatedProduct.priceInr);

      updatedProduct = store.updateProductWithVariants({
        slug: targetSlug,
        productId: productId || updatedProduct.productId || "ANC-FORM-01",
        name: name || updatedProduct.name,
        description: description || updatedProduct.description,
        type: type || updatedProduct.type,
        basePrice: effBasePrice,
        price: effPrice,
        priceInr: effPriceInr,
        baseDiscount: typeof baseDiscount === "number" ? baseDiscount : updatedProduct.baseDiscount,
        globalSpecs: globalSpecs || updatedProduct.globalSpecs,
        childVariants: childVariants as IVariant[],
      });
    }
    // 7. Simple master stock / price adjustment
    else if (typeof stock === "number" || typeof price === "number" || typeof basePrice === "number") {
      const newPrice = typeof price === "number" ? price : (typeof basePrice === "number" ? basePrice : undefined);
      updatedProduct = store.updateStock(
        typeof stock === "number" ? stock : updatedProduct.stock,
        activeDiscount,
        targetSlug,
        newPrice,
        newPrice
      );
    }

    if (typeof isFlashSale === "boolean") {
      updatedProduct.isFlashSale = isFlashSale;
    }

    const cleanProduct = normalizeProductData(updatedProduct);
    const { _id, ...cleanProductWithoutId } = cleanProduct as any;
    // Persist to MongoDB if connected
    const db = await connectDB();
    if (db) {
      try {
        await ProductModel.findOneAndUpdate(
          { $or: [{ slug: targetSlug }, { productId: cleanProduct.productId }] },
          {
            $set: {
              ...cleanProductWithoutId,
              price: cleanProduct.price,
              basePrice: cleanProduct.basePrice || cleanProduct.price,
              priceInr: cleanProduct.priceInr,
              variants: cleanProduct.variants,
              colorVariants: cleanProduct.variants,
              childVariants: cleanProduct.childVariants,
              variantGroups: cleanProduct.variantGroups,
            },
          },
          { upsert: true, returnDocument: "after" }
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
      revalidatePath("/checkout");
      revalidatePath("/orders");
    } catch {
      // ignore
    }

    // Dispatch AWS EventBridge Event: StockUpdated
    try {
      await dispatchEventBridgeEvent("StockUpdated", {
        slug: targetSlug,
        productId: updatedProduct.productId,
        newStock: updatedProduct.stock,
        activeDiscount: updatedProduct.activeDiscount,
        variantUpdated: variantSku || (variantUpdates ? "batch-restock" : "all"),
        trigger: "RealTimeInventoryAdjustment",
      });
    } catch (e) {
      console.warn("EventBridge event dispatch warning:", e);
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Inventory updated instantaneously and edge cache purged.",
    });
  } catch (error: any) {
    console.error("Error in /api/product PATCH:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update product", stack: error?.stack }, { status: 500 });
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

    const cleanProduct = normalizeProductData(newProduct);
    const { _id: _newId, ...cleanProductWithoutId } = cleanProduct as any;
    // Persist to MongoDB
    const db = await connectDB();
    if (db) {
      try {
        await ProductModel.findOneAndUpdate(
          { $or: [{ slug: generatedSlug }, { productId: generatedProductId }] },
          {
            $set: {
              ...cleanProductWithoutId,
              variants: cleanProduct.variants,
              colorVariants: cleanProduct.variants,
              childVariants: cleanProduct.childVariants,
              variantGroups: cleanProduct.variantGroups,
            },
          },
          { upsert: true, returnDocument: "after" }
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
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create product" }, { status: 500 });
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
