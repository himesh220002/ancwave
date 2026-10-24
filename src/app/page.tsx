"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SpecsSection } from "@/components/SpecsSection";
import { ReviewsLifestyleSection } from "@/components/ReviewsLifestyleSection";
import { CheckoutSection } from "@/components/CheckoutSection";
import { ContactFaqSection } from "@/components/ContactFaqSection";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { initialProductData } from "@/lib/store";
import { ProductData, ProductColor, Order } from "@/types";
import { toast } from "@/components/Toaster";

export default function HomePage() {
  const [product, setProduct] = useState<ProductData>(initialProductData);
  const [selectedColor, setSelectedColor] = useState<ProductColor>("silver");
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Fetch live product state
  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch("/api/product");
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
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

  const handleOrderSuccess = (order: Order, newStock: number) => {
    setProduct((prev) => ({
      ...prev,
      stock: newStock,
      lastRevalidatedAt: new Date().toISOString(),
    }));
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

        {/* Section 2: Features & Materials Considered + Acoustic Soundwave */}
        <FeaturesSection />

        {/* Section 3: Engineering & Exploded Assembly Specs */}
        <SpecsSection product={product} />

        {/* Section 4: Customer Reviews & Daily Lifestyle Scenes */}
        <ReviewsLifestyleSection />

        {/* Section 5: The Final Details & Instant Checkout */}
        <CheckoutSection
          product={product}
          selectedColor={selectedColor}
          onColorChange={(color) => setSelectedColor(color)}
          onOrderSuccess={handleOrderSuccess}
        />

        {/* Section 6: Support, FAQs & Direct Inquiries (05 / HERE WHEN YOU NEED US) */}
        <ContactFaqSection />
      </main>

      {/* Cart Drawer ('Your bag' matching Screenshot 6) */}
      <CartDrawer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
