"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Headphones } from "lucide-react";
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
import { ProductColor, ProductData, normalizeProductData } from "@/types";
import { toast } from "@/components/Toaster";

export default function HomePage() {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [liveCatalog, setLiveCatalog] = useState<ProductData[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColor>("silver");
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const catalog = useMemo(() => liveCatalog.map(normalizeProductData), [liveCatalog]);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
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
        } else {
          setProduct(null);
        }
      }

      if (catalogRes.ok) {
        const data = await catalogRes.json();
        if (Array.isArray(data.products)) {
          setLiveCatalog(data.products.map((p: ProductData) => normalizeProductData(p)));
        } else {
          setLiveCatalog([]);
        }
      }
    } catch (err) {
      console.warn("Notice loading product:", err);
    } finally {
      setIsLoading(false);
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
        stock={product?.stock ?? 0}
        lastRevalidatedAt={product?.lastRevalidatedAt}
        onRevalidateClick={handleRevalidate}
        isRevalidating={isRevalidating}
      />

      {/* Main Flow */}
      <main className="flex-1">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
            <span className="text-xs text-zinc-500 font-medium">Loading acoustics...</span>
          </div>
        ) : product ? (
          <>
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
          </>
        ) : (
          <div className="py-24 sm:py-36 px-4 max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500 shadow-2xs">
              <Headphones className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                New Releases In Preparation
              </h1>
              <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                Our audio catalog is currently being updated. Manage products in the Admin Console to launch your lineup.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/admin"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition shadow-sm"
              >
                Open Admin Console
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
