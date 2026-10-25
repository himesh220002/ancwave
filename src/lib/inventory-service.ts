import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models";
import { store } from "@/lib/store";
import { CartItem, ProductData } from "@/types";

export interface StockDeductionResult {
  productId: string;
  previousStock: number;
  newStock: number;
  variantDeductions: Array<{
    sku?: string;
    variantName?: string;
    quantity: number;
    remainingVariantStock?: number;
  }>;
}

/**
 * Deducts order item quantities from matching product variants and total product stock
 * across both in-memory store and MongoDB Atlas.
 */
export async function deductOrderStock(
  items: CartItem[]
): Promise<StockDeductionResult[]> {
  const results: StockDeductionResult[] = [];
  if (!items || !Array.isArray(items) || items.length === 0) {
    return results;
  }

  // Connect to MongoDB if possible
  const db = await connectDB();

  for (const item of items) {
    const slugOrId = item.productId || "form-01";
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const targetSku = (item.componentSku || "").trim().toLowerCase();
    const targetVariantName = (item.variantName || "").trim().toLowerCase();
    const targetVariantId = (typeof item.variant === "string" ? item.variant : "").trim().toLowerCase();

    // 1. Fetch current product from MongoDB or store
    let productDoc: any = null;
    if (db) {
      try {
        productDoc = await ProductModel.findOne({
          $or: [
            { slug: slugOrId },
            { productId: slugOrId },
            { slug: "form-01" },
            { model: "WIRELESS OVER-EAR" },
          ],
        });
      } catch (err) {
        console.warn("[deductOrderStock] DB find error:", err);
      }
    }

    // Get current product data
    const memoryProduct = store.getProductById(slugOrId) || store.getProduct(slugOrId);
    const currentProductData: ProductData = productDoc ? productDoc.toObject() : memoryProduct;

    const previousStock = currentProductData.stock ?? 0;
    const variantDeductions: StockDeductionResult["variantDeductions"] = [];

    // 2. Decrement in childVariants
    if (Array.isArray(currentProductData.childVariants) && currentProductData.childVariants.length > 0) {
      let matchedChild = false;
      currentProductData.childVariants = currentProductData.childVariants.map((cv: any) => {
        const skuMatch = targetSku && cv.sku?.toLowerCase() === targetSku;
        const colorMatch = targetVariantName && cv.color?.toLowerCase() === targetVariantName;
        const idMatch =
          targetVariantId &&
          (cv.sku?.toLowerCase().includes(targetVariantId) || cv.color?.toLowerCase() === targetVariantId);

        if ((skuMatch || colorMatch || idMatch) && !matchedChild) {
          matchedChild = true;
          const prevVarStock = Number(cv.stock) || 0;
          const newVarStock = Math.max(0, prevVarStock - quantity);
          variantDeductions.push({
            sku: cv.sku,
            variantName: cv.color,
            quantity,
            remainingVariantStock: newVarStock,
          });
          return { ...cv, stock: newVarStock };
        }
        return cv;
      });
    }

    // 3. Decrement in variants array
    if (Array.isArray(currentProductData.variants) && currentProductData.variants.length > 0) {
      let matchedVar = false;
      currentProductData.variants = currentProductData.variants.map((v: any) => {
        const idMatch = targetVariantId && v.id?.toLowerCase() === targetVariantId;
        const nameMatch = targetVariantName && v.name?.toLowerCase() === targetVariantName;
        const skuMatch = targetSku && v.id?.toLowerCase() === targetSku;

        if ((idMatch || nameMatch || skuMatch) && !matchedVar) {
          matchedVar = true;
          const prevVarStock = Number(v.stock) || 0;
          const newVarStock = Math.max(0, prevVarStock - quantity);
          return { ...v, stock: newVarStock };
        }
        return v;
      });
    }

    // Also sync colorVariants if present
    if (Array.isArray((currentProductData as any).colorVariants) && (currentProductData as any).colorVariants.length > 0) {
      let matchedColorVar = false;
      (currentProductData as any).colorVariants = (currentProductData as any).colorVariants.map((v: any) => {
        const idMatch = targetVariantId && v.id?.toLowerCase() === targetVariantId;
        const nameMatch = targetVariantName && v.name?.toLowerCase() === targetVariantName;
        const skuMatch = targetSku && v.id?.toLowerCase() === targetSku;

        if ((idMatch || nameMatch || skuMatch) && !matchedColorVar) {
          matchedColorVar = true;
          const prevVarStock = Number(v.stock) || 0;
          const newVarStock = Math.max(0, prevVarStock - quantity);
          return { ...v, stock: newVarStock };
        }
        return v;
      });
    }

    // 4. Decrement in variantGroups if present
    if (Array.isArray(currentProductData.variantGroups) && currentProductData.variantGroups.length > 0) {
      currentProductData.variantGroups = currentProductData.variantGroups.map((g: any) => {
        if (!Array.isArray(g.colors)) return g;
        return {
          ...g,
          colors: g.colors.map((c: any) => {
            const skuMatch = targetSku && c.sku?.toLowerCase() === targetSku;
            const nameMatch = targetVariantName && c.name?.toLowerCase() === targetVariantName;
            const idMatch = targetVariantId && c.name?.toLowerCase() === targetVariantId;
            if (skuMatch || nameMatch || idMatch) {
              const prev = Number(c.stock) || 0;
              return { ...c, stock: Math.max(0, prev - quantity) };
            }
            return c;
          }),
        };
      });
    }

    // 5. Recompute total product stock
    if (Array.isArray(currentProductData.childVariants) && currentProductData.childVariants.length > 0) {
      currentProductData.stock = currentProductData.childVariants.reduce(
        (sum: number, cv: any) => sum + (Number(cv.stock) || 0),
        0
      );
    } else if (Array.isArray(currentProductData.variants) && currentProductData.variants.length > 0) {
      currentProductData.stock = currentProductData.variants.reduce(
        (sum: number, v: any) => sum + (Number(v.stock) || 0),
        0
      );
    } else {
      currentProductData.stock = Math.max(0, previousStock - quantity);
    }

    currentProductData.lastRevalidatedAt = new Date().toISOString();

    // 6. Update in-memory store
    store.addProduct(currentProductData);

    // 7. Persist to MongoDB
    if (db && productDoc) {
      try {
        await ProductModel.findByIdAndUpdate(
          productDoc._id,
          {
            $set: {
              stock: currentProductData.stock,
              childVariants: currentProductData.childVariants,
              variants: currentProductData.variants,
              colorVariants: (currentProductData as any).colorVariants || currentProductData.variants,
              variantGroups: currentProductData.variantGroups,
              lastRevalidatedAt: currentProductData.lastRevalidatedAt,
            },
          },
          { returnDocument: "after" }
        );
      } catch (err) {
        console.warn("[deductOrderStock] MongoDB update error:", err);
      }
    }

    results.push({
      productId: currentProductData.slug || slugOrId,
      previousStock,
      newStock: currentProductData.stock,
      variantDeductions,
    });
  }

  return results;
}
