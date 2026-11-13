"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AudioLineupSection } from "@/components/AudioLineupSection";
import { QualityPhilosophySection } from "@/components/QualityPhilosophySection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SpecsSection } from "@/components/SpecsSection";
import { ReviewsLifestyleSection } from "@/components/ReviewsLifestyleSection";
import { CheckoutSection } from "@/components/CheckoutSection";
import { ContactFaqSection } from "@/components/ContactFaqSection";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { initialProductData, sampleCatalog } from "@/lib/store";
import { ProductColor, ProductData, normalizeProductData } from "@/types";
import { toast } from "@/components/Toaster";

function mergeCatalog(live: ProductData[]): ProductData[] {
  const merged = new Map<string, ProductData>();
  for (const product of sampleCatalog) {
    merged.set(product.slug, normalizeProductData(product));
  }
  for (const product of live) {
    merged.set(product.slug, normalizeProductData(product));
  }
  return Array.from(merged.values());
}

export default function HomePage() {
  const [product, setProduct] = useState<ProductData>(initialProductData);
  const [liveCatalog, setLiveCatalog] = useState<ProductData[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    initialProductData.variants[0]?.id || "silver"
  );
  const [isRevalidating, setIsRevalidating] = useState(false);

  const catalog = useMemo(() => mergeCatalog(liveCatalog), [liveCatalog]);

  // Fetch the live hero product and the complete catalog in parallel. The
  // curated showroom renders immediately, so a slow or empty database can
  // never leave the homepage without a product matrix.
  const fetchProduct = useCallback(async () => {
    try {
      const [heroRes, catalogRes] = await Promise.all([
        fetch("/api/product"),
        fetch("/api/product?all=true"),
      ]);

      if (heroRes.ok) {
        const data = await heroRes.json();
        if (data.product) {
          const next = normalizeProductData(data.product);
          setProduct(next);
          setSelectedColor(next.variants[0]?.id || "silver");
        }
      }

      if (catalogRes.ok) {
        const data = await catalogRes.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setLiveCatalog(data.products.map((p: ProductData) => normalizeProductData(p)));
        }
      }
    } catch (err) {
      console.warn("Notice loading product:", err);
    }
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // On-demand cache revalidation trigger
  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/", tag: "product-details" }),
      });
      const data = await res.json();
      if (data.revalidated) {
        toast({
          type: "success",
          title: "Edge Cache Revalidated",
          description: `Stock level ${data.currentStock} synchronized across CloudFront edge.`,
        });
        await fetchProduct();
      }
    } catch {
      toast({
        type: "error",
        title: "Revalidation Failed",
        description: "Could not trigger revalidation endpoint",
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] selection:bg-blue-600 selection:text-white">
      {/* Top Sticky Navigation */}
      <Navbar
        stock={product.stock}
        lastRevalidatedAt={product.lastRevalidatedAt}
        onRevalidateClick={handleRevalidate}
        isRevalidating={isRevalidating}
      />

      {/* Main Flow */}
      <main className="flex-1">
        {/* Section 1: Hero & High Quality Studio Showcase */}
        <HeroSection
          product={product}
          selectedColor={selectedColor}
          onColorChange={(color) => setSelectedColor(color)}
          onRevalidate={handleRevalidate}
          isRevalidating={isRevalidating}
        />

        {/* Section 2: The Audio Lineup — category tabs & hover x-ray cards */}
        <AudioLineupSection products={catalog} />

        {/* Section 3: Refined Quality — material, audit & cleanliness manifesto */}
        <QualityPhilosophySection />

        {/* Section 4: Features & Materials Considered + Acoustic Soundwave */}
        <FeaturesSection />

        {/* Section 5: Engineering & Exploded Assembly Specs */}
        <SpecsSection product={product} />

        {/* Section 6: Customer Reviews & Daily Lifestyle Scenes */}
        <ReviewsLifestyleSection />

        {/* Section 7: The Final Details & Instant Checkout */}
        <CheckoutSection
          product={product}
          selectedColor={selectedColor}
          onColorChange={(color) => setSelectedColor(color)}
        />

        {/* Section 8: Support, FAQs & Direct Inquiries */}
        <ContactFaqSection />
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
