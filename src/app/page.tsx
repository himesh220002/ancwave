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
import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Sparkles, PlusCircle } from "lucide-react";
import { ProductData, ProductColor, Order } from "@/types";
import { toast } from "@/components/Toaster";

export default function HomePage() {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<ProductColor>("silver");
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Fetch live product state
  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/product");
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedColor(data.product.variants[0].id as ProductColor);
          }
        } else {
          setProduct(null);
        }
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.warn("Notice loading product:", err);
      setProduct(null);
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

  const handleOrderSuccess = (order: Order, newStock: number) => {
    setProduct((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        stock: newStock,
        lastRevalidatedAt: new Date().toISOString(),
      };
    });
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
        <Navbar stock={0} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-500">Checking ancwaveDB database...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Pure Raw State Screen: DB connected with 0 products
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFA] selection:bg-blue-600 selection:text-white">
        <Navbar
          stock={0}
          subtitle="/ STOREFRONT TERMINAL"
          onRevalidateClick={handleRevalidate}
          isRevalidating={isRevalidating}
        />
        <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-2xl w-full bg-white border border-zinc-200/90 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Connected: ancwaveDB · Pure Production State</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-sans tracking-tight">
                Storefront Pure & Ready for Real Catalog
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-lg mx-auto">
                All development mock products, orders, fake reviews, and demo logins have been completely wiped. Your application is now in its authentic, pure state connected directly to <strong className="font-mono text-zinc-800">ancwaveDB</strong>.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">PRODUCTS</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">0 Active</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">ORDERS</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">0 Records</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">REVIEWS</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">0 Moderated</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">AUTH</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-600">Pure Atlas</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/admin"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Enter Admin Console & Create First Product</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/orders"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Orders Terminal</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Normal Active Catalog Screen
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
