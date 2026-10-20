"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Flame } from "lucide-react";
import { ProductData, ProductColor } from "@/types";
import { useCart } from "@/context/CartContext";

interface HeroSectionProps {
  product: ProductData;
  selectedColor: ProductColor;
  onColorChange?: (color: ProductColor) => void;
  onRevalidate?: () => void;
  isRevalidating?: boolean;
}

export function HeroSection({
  product,
  selectedColor,
  onColorChange,
}: HeroSectionProps) {
  const { addItem } = useCart();
  const [internalColor, setInternalColor] = useState<ProductColor>(selectedColor);

  const activeColor = selectedColor || internalColor;
  const currentVariant =
    product.variants.find((v) => v.id === activeColor) || product.variants[0];

  const handleColorSwitch = (colorId: ProductColor) => {
    setInternalColor(colorId);
    if (onColorChange) onColorChange(colorId);
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      variant: currentVariant.id,
      variantName: currentVariant.name,
      price: product.price,
      image: currentVariant.image,
      fit: "Adjustable fit",
    });
  };

  const isLowStock = product.stock <= product.lowStockThreshold;

  return (
    <section className="relative pt-10 pb-16 md:pt-16 md:pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-6 space-y-8">
            {/* Tag matching Figma: • FORM 01 / WIRELESS OVER-EAR */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                FORM 01 / WIRELESS OVER-EAR
              </span>
            </div>

            {/* Dynamic Stock Flash Alert (When revalidated to low stock) */}
            {/* {isLowStock && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>
                  🔥 Few left! Only {product.stock} {product.stock === 1 ? "pair" : "pairs"} remaining
                </span>
              </div>
            )} */}

            {/* Headline matching Figma */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] text-[#111111] leading-[1.08] sm:leading-[1.05]">
              Less noise. <br />
              More you.
            </h1>

            {/* Subtitle matching Figma */}
            <p className="text-base sm:text-[17px] text-[#555555] max-w-lg font-normal leading-relaxed">
              {product.description}
            </p>

            {/* Action Row matching Figma: [Get Yours Now ↗]  $349 */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-xs"
                >
                  <span>Get Yours Now</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                </button>

                <span className="text-base font-semibold text-[#111111] font-sans">
                  ${product.price}
                </span>
              </div>

              {/* Trust Badges matching Figma: ✓ 30-day returns  ✓ 2-year warranty */}
              <div className="flex items-center gap-6 text-xs text-zinc-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-zinc-600 stroke-[2.5]" />
                  </span>
                  <span>{product.returnDays}-day returns</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-zinc-600 stroke-[2.5]" />
                  </span>
                  <span>{product.warrantyYears}-year warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Card Container matching Figma */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl bg-[#F0EFEA] border border-[#E8E7E2] overflow-hidden">
              {/* Card Label: DESIGNED TO DISAPPEAR. */}
              <div className=" px-6 py-2 z-10">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
                  DESIGNED TO DISAPPEAR.
                </span>
              </div>

              {/* Headphone Studio Photography matching Screenshot 1 */}
              <div className="relative w-full aspect-4/3 flex items-center justify-center">
                <Image
                  src={currentVariant.image}
                  alt={`ancwave Form 01 in ${currentVariant.name}`}
                  fill
                  priority
                  className="object-contain transition-opacity duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Bottom: Pill Switcher & Dash Indicators */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2">
                {/* Variant Switcher Pill matching Figma: ⚪ Silver mist / 01 */}
                <div className="flex items-center gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleColorSwitch(v.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${activeColor === v.id
                        ? "bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80"
                        : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full border border-black/20"
                        style={{ backgroundColor: v.hex }}
                      />
                      <span>{v.name} / {v.tag}</span>
                    </button>
                  ))}
                </div>

                {/* Dash Indicators matching Figma */}
                <div className="flex items-center gap-1.5">
                  {product.variants.map((v) => (
                    <span
                      key={v.id}
                      className={`h-0.5 rounded-full transition-all ${activeColor === v.id
                        ? "w-5 bg-blue-600"
                        : "w-2 bg-zinc-300"
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Bar matching Figma Screenshot 1 */}
        <div className="mt-20 pt-10 border-t border-[#EAEAE5] grid grid-cols-2 md:grid-cols-5 gap-6 items-start">
          {/* Label: TUNED FOR FEELING. BUILT FOR EVERY DAY. */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase leading-relaxed block">
              TUNED FOR FEELING. <br />
              BUILT FOR EVERY DAY.
            </span>
          </div>

          {/* Metric 1 */}
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              40 h
            </div>
            <div className="text-xs text-zinc-500">Playtime, ANC on</div>
          </div>

          {/* Metric 2 */}
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              40 mm
            </div>
            <div className="text-xs text-zinc-500">Precision dynamic drivers</div>
          </div>

          {/* Metric 3 */}
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              256 g
            </div>
            <div className="text-xs text-zinc-500">Light on your mind</div>
          </div>

          {/* Metric 4 */}
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Bluetooth 5.3
            </div>
            <div className="text-xs text-zinc-500">Two devices. One flow.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
