"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ShoppingBag,
  ArrowUpRight,
  RotateCcw,
  ShieldCheck,
  Truck,
  Sparkles,
  Flame,
  Box,
} from "lucide-react";
import { ProductData, ProductColor, Order } from "@/types";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/Toaster";

interface CheckoutSectionProps {
  product: ProductData;
  selectedColor: ProductColor;
  onColorChange: (color: ProductColor) => void;
  onOrderSuccess?: (order: Order, newStock: number) => void;
}

export function CheckoutSection({
  product,
  selectedColor,
  onColorChange,
}: CheckoutSectionProps) {
  const { addItem } = useCart();
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const currentVariant =
    product.variants?.find((v) => v.id === selectedColor) ||
    product.variants?.[0] || {
      id: "silver",
      name: "Silver",
      hex: "#C4C8D0",
      borderHex: "#949DAA",
      image: "/images/hero-silver.jpg",
      tag: "01",
    };

  const isLowStock = product.stock <= (product.lowStockThreshold || 10);
  const variantCoverImage =
    currentVariant?.images?.[0] ||
    currentVariant?.image ||
    "/images/checkout-floating.jpg";

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: `${product.name} - ${currentVariant?.name || "Standard"}`,
      variant: currentVariant?.id || "silver",
      variantName: currentVariant?.name || "Standard",
      price: product.price,
      image: variantCoverImage,
      fit: "One size · adjustable",
    });

    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 2500);
  };

  return (
    <section id="checkout" className="py-16 md:py-24 bg-white border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-12">
        {/* Section Header matching Figma Screenshot 5 */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              04 / MAKE ROOM FOR YOU
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-tight break-words">
              Your next favorite thing.
            </h2>
            <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase sm:text-right shrink-0">
              CONFIGURE & PURCHASE / ALL PRICES IN USD
            </span>
          </div>
        </div>

        {/* 2-Column Layout matching Figma Screenshot 5 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Suspended Floating Headphone Render */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="relative aspect-4/3 rounded-3xl bg-[#F0EFEA] overflow-hidden border border-[#E8E7E2] shadow-xs">
              <div className="absolute top-4 left-4 sm:top-5 sm:left-6 text-[10px] font-mono tracking-[0.18em] text-zinc-700 uppercase z-10 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-md shadow-2xs">
                FORM 01 / {(currentVariant?.name || "Silver").toUpperCase()}
              </div>
              <Image
                src={variantCoverImage}
                alt={`${product.name} in ${currentVariant?.name || "Standard"}`}
                fill
                className="object-cover transition-all duration-300"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-xs text-zinc-500 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                In Stock & Ready to Ship
              </span>
              <span className="font-mono text-zinc-400 text-[11px]">
                DISPATCHES WITHIN 24 HOURS
              </span>
            </div>
          </div>

          {/* Right Column: Product Configuration & Actions (Add to Cart / Buy Now) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-white p-5 sm:p-8 border border-[#EAEAE5] shadow-xs space-y-6">
              {/* Product Title & Pricing */}
              <div className="space-y-3 pb-4 border-b border-zinc-200/80">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                      FLAGSHIP WIRELESS
                    </span>
                    {isLowStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                        FEW LEFT ({product.stock} IN STOCK)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0">MODEL 01</span>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-baseline justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] break-words">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 break-words">
                      Wireless Over-Ear Active Noise Cancelling Headphones
                    </p>
                  </div>
                  <div className="xs:text-right shrink-0">
                    <div className="text-2xl sm:text-3xl font-bold text-[#111111]">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-zinc-400">Free delivery included</div>
                  </div>
                </div>
              </div>

              {/* Finish Selector */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                  <span className="font-semibold text-zinc-900">
                    Finish — <span className="text-zinc-500 font-normal">{currentVariant?.name || "Standard"}</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    MATTE ANODIZED FINISH
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {(product.variants || []).map((v, vIdx) => (
                    <button
                      key={`co-v-${v.id || v.name || vIdx}-${vIdx}`}
                      onClick={() => onColorChange(v.id)}
                      className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs transition-all ${selectedColor === v.id
                        ? "bg-white border-zinc-900 shadow-xs ring-1 ring-zinc-900 font-medium text-zinc-900"
                        : "bg-white/80 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                        style={{ backgroundColor: v.hex }}
                      />
                      <span className="truncate">{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Option */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                  <span className="font-semibold text-zinc-900">Acoustic Fit</span>
                  <span className="text-[11px] text-zinc-400">SLOW-RECOVERY MEMORY FOAM</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-xs font-medium shadow-2xs max-w-full break-words">
                  <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5] shrink-0" />
                  <span className="truncate">One size · Ergonomically adjustable headband</span>
                </div>
              </div>

              {/* What's In The Box */}
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                  <Box className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Good Things, Included:</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed sm:pl-5 break-words">
                  Protective hardshell travel case, USB-C braided charging cable, and gold-plated 3.5 mm auxiliary audio cable.
                </p>
              </div>

              {/* Primary Action Buttons: Add to Cart & Buy Now */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Button 1: Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 active:scale-[0.99] border border-zinc-300 text-zinc-900 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2]" />
                    <span>{isAddedRecently ? "Added to Bag ✓" : "Add to Cart"}</span>
                  </button>

                  {/* Button 2: Buy Now — $349 */}
                  <Link
                    href="/checkout"
                    onClick={() => {
                      addItem({
                        productId: product.id,
                        name: product.name,
                        variant: currentVariant?.id || "silver",
                        variantName: currentVariant?.name || "Standard",
                        price: product.price,
                        image: currentVariant?.image || variantCoverImage,
                        fit: "One size · adjustable",
                      });
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Buy Now — ${product.price.toFixed(2)}</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                  </Link>
                </div>

                <p className="text-[11px] text-zinc-500 text-center">
                  Love our sound first. Add to bag to continue exploring, or proceed to checkout when ready.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-zinc-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2 text-center text-[11px] text-zinc-500">
                <div className="flex xs:flex-col items-center justify-center gap-2 xs:gap-1">
                  <Truck className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="flex xs:flex-col items-center justify-center gap-2 xs:gap-1">
                  <RotateCcw className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>30-Day Risk-Free Trial</span>
                </div>
                <div className="flex xs:flex-col items-center justify-center gap-2 xs:gap-1">
                  <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>2-Year Full Warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
