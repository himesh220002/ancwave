"use client";

import React, { useMemo } from "react";
import { ProductData } from "@/types";
import { resolveProductLayout } from "@/lib/product-layout";
import { ProductDetailView } from "@/components/ProductDetailView";
import { GeneralProductView } from "@/components/product/GeneralProductView";

interface ProductLayoutSwitcherProps {
  product: ProductData;
  relatedProducts?: ProductData[];
}

/**
 * Reads the product's category metadata and routes it to the layout family
 * that fits it. Audio families keep the immersive acoustic experience while
 * every other category receives the general material-study layout.
 */
export function ProductLayoutSwitcher({
  product,
  relatedProducts = [],
}: ProductLayoutSwitcherProps) {
  const profile = useMemo(() => resolveProductLayout(product), [product]);

  if (profile.isAudio) {
    return (
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
      />
    );
  }

  return (
    <GeneralProductView
      product={product}
      relatedProducts={relatedProducts}
      profile={profile}
    />
  );
}
