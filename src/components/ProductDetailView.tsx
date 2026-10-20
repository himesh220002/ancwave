"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Check,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Flame,
  Radio,
  Sliders,
  BatteryCharging,
  Cpu,
  Layers,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Volume2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { ProductData, ProductColor, TwsComponentType, Review } from "@/types";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { toast } from "@/components/Toaster";
import { sampleReviews } from "@/lib/store";

interface ProductDetailViewProps {
  product: ProductData;
  relatedProducts: ProductData[];
  initialColor?: string;
  initialComponent?: string;
}

export function ProductDetailView({
  product,
  relatedProducts,
  initialColor,
  initialComponent,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Active color variant
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    (initialColor as ProductColor) || product.variants[0]?.id || "silver"
  );

  // Active media gallery item
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Fractional TWS component selection
  const [selectedTwsComponent, setSelectedTwsComponent] = useState<TwsComponentType>(
    (initialComponent as TwsComponentType) || "full-set"
  );

  // Technical Matrix Active Tab
  const [activeSpecTab, setActiveSpecTab] = useState<"core" | "battery" | "connectivity">("core");

  // Exploded View Active Hotspot
  const [activeHotspot, setActiveHotspot] = useState<number>(0);

  // Review Pain-Point Filter
  const [reviewFilterTag, setReviewFilterTag] = useState<string>("all");

  // Q&A Accordion open state
  const [openQnaId, setOpenQnaId] = useState<string | null>(product.qna?.[0]?.id || null);

  // Added-to-cart temporary state
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  // Derived current color variant
  const currentVariant =
    product.variants.find((v) => v.id === selectedColor) || product.variants[0];

  // Derived TWS component option (if product is TWS)
  const currentTwsOption = product.isTws && product.twsComponents
    ? product.twsComponents.find((c) => c.id === selectedTwsComponent) || product.twsComponents[0]
    : null;

  // Active pricing based on component selection
  const activePrice = currentTwsOption ? currentTwsOption.price : product.price;
  const activeOriginalPrice = currentTwsOption
    ? currentTwsOption.originalPrice
    : product.originalPrice;
  const activeSku = currentTwsOption ? currentTwsOption.sku : product.sku;
  const activeStock = currentTwsOption ? currentTwsOption.stock : product.stock;

  // Media items list
  const mediaGallery = product.mediaGallery || [
    {
      id: "default-hero",
      url: currentVariant.image,
      alt: product.name,
      type: "hero" as const,
      label: "Studio View",
    },
  ];

  // Read initial query params from window.location on mount without blocking SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlColor = params.get("color");
      const urlComp = params.get("component");
      if (urlColor && product.variants.some((v) => v.id === urlColor)) {
        setSelectedColor(urlColor as ProductColor);
      }
      if (urlComp && product.twsComponents?.some((c) => c.id === urlComp)) {
        setSelectedTwsComponent(urlComp as TwsComponentType);
      }
    }
  }, [product.variants, product.twsComponents]);

  // Dynamic URL update using History API without full reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (selectedColor) params.set("color", selectedColor);
      if (product.isTws && selectedTwsComponent) {
        params.set("component", selectedTwsComponent);
      }
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedColor, selectedTwsComponent, product.isTws]);

  // When color changes, switch hero image to match color if applicable
  const handleColorSelect = (colorId: ProductColor) => {
    setSelectedColor(colorId);
    // Find variant image and set to hero
    setActiveMediaIndex(0);
  };

  // Add to Bag handler
  const handleAddToCart = () => {
    const componentLabel = currentTwsOption && currentTwsOption.id !== "full-set"
      ? currentTwsOption.label
      : undefined;

    addItem({
      productId: product.id,
      name: product.name,
      variant: currentVariant.id,
      variantName: currentVariant.name,
      component: componentLabel,
      componentSku: activeSku,
      price: activePrice,
      image: currentVariant.image,
      fit: product.categorySlug === "headphones" ? "Adjustable fit" : "Universal ergonomic fit",
    });

    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 2500);
  };

  // Direct Buy Now handler
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  // Filtered reviews
  const allReviews: Review[] = sampleReviews;
  const filteredReviews = reviewFilterTag === "all"
    ? allReviews
    : allReviews.filter((r) => r.tags?.includes(reviewFilterTag));

  // Review tags list
  const availableTags = [
    { id: "all", label: "All Reviews" },
    { id: "Fit during running", label: "Fit during running" },
    { id: "Bass response", label: "Bass response" },
    { id: "Call clarity", label: "Call clarity" },
    { id: "ANC performance", label: "ANC performance" },
    { id: "Clamping force & comfort", label: "Clamping force & comfort" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Header */}
      <Navbar subtitle={`/ ${product.name.toUpperCase()}`} />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-[#EAEAE5] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between text-xs text-zinc-500">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <Link href="/products" className="hover:text-black transition-colors">
              Audio
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="capitalize">{product.categorySlug}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-zinc-900 font-semibold truncate">{product.name}</span>
          </nav>

          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            SKU: {activeSku}
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION A: HERO MEDIA & SKU CONFIGURATOR
          Split-Screen View: Left media carousel + Right SKU configurator
          ========================================================================= */}
      <section className="py-10 sm:py-16 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column (7 cols): Split-Screen Media Gallery */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Showcase Viewport */}
              <div className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl bg-[#F0EFEA] p-6 sm:p-10 overflow-hidden flex items-center justify-center border border-[#EAEAE5] group">
                <Image
                  src={
                    activeMediaIndex === 0
                      ? currentVariant.image
                      : mediaGallery[activeMediaIndex]?.url || currentVariant.image
                  }
                  alt={mediaGallery[activeMediaIndex]?.alt || product.name}
                  fill
                  priority
                  className="object-contain p-4 group-hover:scale-102 transition-transform duration-500 ease-out"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />

                {/* Perspective Badge */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono tracking-widest text-zinc-800 uppercase font-semibold border border-zinc-200 shadow-2xs">
                    {mediaGallery[activeMediaIndex]?.label || "STUDIO RENDER"}
                  </span>
                  {activeMediaIndex === 3 && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-medium shadow-2xs flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      360 / X-RAY
                    </span>
                  )}
                </div>

                {/* Color Variant Pill Indicator */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-[11px] font-mono text-zinc-500 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-200">
                  {currentVariant.name.toUpperCase()} · {product.model}
                </div>
              </div>

              {/* Thumbnails Navigation Row */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {mediaGallery.map((media, idx) => (
                  <button
                    key={media.id}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative aspect-4/3 rounded-2xl bg-[#F0EFEA] p-2 overflow-hidden border transition-all text-left flex flex-col justify-end ${
                      activeMediaIndex === idx
                        ? "border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-zinc-200/80 hover:border-zinc-400"
                    }`}
                  >
                    <Image
                      src={idx === 0 ? currentVariant.image : media.url}
                      alt={media.alt}
                      fill
                      className="object-contain p-1"
                      sizes="150px"
                    />
                    <span className="relative z-10 text-[9px] font-mono text-zinc-800 bg-white/80 px-1.5 py-0.5 rounded truncate max-w-full">
                      {media.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column (5 cols): Dynamic SKU Configurator */}
            <div className="lg:col-span-5 space-y-6">
              {/* Product Title, Model & Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest text-blue-600 uppercase font-semibold">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-zinc-400 font-normal">({product.reviewCount} verified reviews)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {product.tagline} {product.description}
                </p>
              </div>

              {/* Live Price Display */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-bold text-zinc-900">
                      ${activePrice}
                    </span>
                    {activeOriginalPrice > activePrice && (
                      <span className="text-sm text-zinc-400 line-through">
                        ${activeOriginalPrice}
                      </span>
                    )}
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      In Stock ({activeStock} units)
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Direct Razorpay checkout · approx. ₹{Math.round(activePrice * 83).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] font-mono text-zinc-400 uppercase">WARRANTY</span>
                  <span className="text-xs font-bold text-zinc-800">2 Years Included</span>
                </div>
              </div>

              {/* =================================================================
                  FRACTIONAL INVENTORY COMPONENT MATRIX FOR TWS EARBUDS
                  ================================================================= */}
              {product.isTws && product.twsComponents && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      COMPONENT INVENTORY MATRIX
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Modular replacements
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Select a complete stereo pair or purchase direct component replacements if an individual bud or case is lost:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {product.twsComponents.map((comp) => {
                      const isSelected = selectedTwsComponent === comp.id;
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setSelectedTwsComponent(comp.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-600"
                              : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900">
                              {comp.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-blue-600">
                              ${comp.price}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                            {comp.description}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                            <span>SKU: {comp.sku}</span>
                            <span className="text-emerald-600">Stock: {comp.stock}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Swatch Selector */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700">
                    Finish: <span className="font-bold text-zinc-900">{currentVariant.name}</span>
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    Option {currentVariant.tag} of {product.variants.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {product.variants.map((v) => {
                    const isSelected = selectedColor === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleColorSelect(v.id)}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "ring-2 ring-blue-600 ring-offset-2 scale-105"
                            : "hover:scale-105"
                        }`}
                        title={v.name}
                        aria-label={`Select ${v.name}`}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/15 shadow-2xs flex items-center justify-center"
                          style={{ backgroundColor: v.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-4 h-4 stroke-[2.5] ${
                                v.id === "white" || v.id === "silver" || v.id === "sandstone"
                                  ? "text-zinc-900"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Add to Bag & Buy Now */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3.5 px-4 rounded-xl border border-zinc-300 hover:border-black active:scale-[0.99] text-zinc-900 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 bg-white"
                  >
                    {isAddedRecently ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Added to Bag!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Now · ${activePrice}</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {product.deliveryEstimate}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    30-Day Risk-Free Trial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: IMMERSIVE FEATURE HIGHLIGHTS & X-RAY EXPLODED VIEW
          ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          {/* Section Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                SECTION B · IMMERSIVE ARCHITECTURE
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                Acoustic X-Ray & Value Callouts
              </h2>
              <span className="text-xs font-mono text-zinc-400 uppercase">
                TRANSDUCER PURITY · ZERO DISTORTION
              </span>
            </div>
          </div>

          {/* Interactive X-Ray Exploded View Card */}
          {product.explodedView && (
            <div className="rounded-3xl bg-white border border-[#EAEAE5] overflow-hidden p-6 sm:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Exploded Visual Diagram */}
                <div className="lg:col-span-7 relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-[#F0EFEA] overflow-hidden flex items-center justify-center border border-zinc-200/70">
                  <Image
                    src={product.explodedView.image}
                    alt={product.explodedView.caption}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-mono tracking-wider font-semibold">
                    {product.explodedView.badge}
                  </div>
                </div>

                {/* Hotspot Markers List */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-zinc-900">
                      Precision Component Assembly
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {product.explodedView.caption} Click any numbered stage to inspect acoustic engineering details:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {product.explodedView.callouts.map((c, idx) => (
                      <button
                        key={c.number}
                        type="button"
                        onClick={() => setActiveHotspot(idx)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                          activeHotspot === idx
                            ? "bg-blue-50/60 border-blue-600 shadow-xs ring-1 ring-blue-600/30"
                            : "bg-white border-zinc-200/80 hover:border-zinc-300"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                            activeHotspot === idx
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {c.number}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900">
                            {c.title}
                          </h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            {c.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Category Value Callouts */}
          {product.primaryValueCallouts && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.primaryValueCallouts.map((callout, idx) => (
                <div
                  key={callout.title}
                  className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-7 space-y-3 hover:border-zinc-400 transition-colors shadow-2xs"
                >
                  <span className="text-[10px] font-mono tracking-widest text-blue-600 font-semibold uppercase">
                    0{idx + 1} // {callout.tag}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {callout.title}
                  </h3>
                  <p className="text-xs font-medium text-zinc-700">
                    {callout.subtitle}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {callout.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION C: THE MULTI-TAB TECHNICAL MATRIX
          ========================================================================= */}
      <section id="specs" className="py-16 sm:py-24 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          {/* Header & Multi-Tab Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                SECTION C · TECHNICAL BENCHMARK MATRIX
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Detailed Hardware Specifications
              </h2>
            </div>

            {/* 3 Tabs Toggle */}
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSpecTab("core")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeSpecTab === "core"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Core Specs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecTab("battery")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeSpecTab === "battery"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
                <span>Battery & Charging</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecTab("connectivity")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeSpecTab === "connectivity"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>Connectivity & Intelligence</span>
              </button>
            </div>
          </div>

          {/* Tabbed Specs Table */}
          {product.tabbedSpecs && (
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {product.tabbedSpecs[activeSpecTab].map((row, idx) => (
                <div
                  key={row.label}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-600 sm:w-1/3">
                    {row.label}
                  </span>
                  <div className="sm:w-2/3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-zinc-900">
                      {row.value}
                    </span>
                    {row.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION D: HYGIENE, RETURNS & SOCIAL PROOF
          ========================================================================= */}
      <section id="reviews" className="py-16 sm:py-24 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          {/* Sanitation & Return Policy Warning Banner */}
          {product.hygienePolicy && (
            <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-mono tracking-widest text-amber-800 font-bold uppercase">
                  {product.hygienePolicy.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                {product.hygienePolicy.title}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-4xl">
                {product.hygienePolicy.description}
              </p>
              <div className="pt-2 text-xs font-medium text-amber-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{product.hygienePolicy.exemptionNotice}</span>
              </div>
            </div>
          )}

          {/* User Reviews Header & Filterable Tags */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  VERIFIED COMMUNITY ACOUSTICS
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                  Customer Experiences & Acoustic Pain Points
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-zinc-900">{product.rating} / 5.0</span>
                <span>(Based on {product.reviewCount} customer reviews)</span>
              </div>
            </div>

            {/* Pain Point Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-zinc-400 font-medium shrink-0">Filter by focus:</span>
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setReviewFilterTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    reviewFilterTag === tag.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Reviews Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredReviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="rounded-3xl bg-white border border-[#EAEAE5] p-6 space-y-4 flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {review.createdAt || "Verified buyer"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed italic">
                      {review.comment}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{review.author}</h4>
                      <p className="text-[11px] text-zinc-400">{review.role}</p>
                    </div>
                    {review.tags && review.tags[0] && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-100 text-zinc-600">
                        {review.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Q&A Accordion */}
          {product.qna && product.qna.length > 0 && (
            <div className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-zinc-900">
                    Product Questions & Answers
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {product.qna.length} answered
                </span>
              </div>

              <div className="space-y-3">
                {product.qna.map((item) => {
                  const isOpen = openQnaId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-zinc-200/80 rounded-2xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenQnaId(isOpen ? null : item.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-bold text-zinc-900">
                          Q: {item.question}
                        </span>
                        <span className="text-xs font-mono text-blue-600 shrink-0">
                          {isOpen ? "− Hide" : "+ Expand"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white border-t border-zinc-100 text-xs text-zinc-600 leading-relaxed space-y-2">
                          <p>{item.answer}</p>
                          <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                            <span>Answered by {item.author}</span>
                            <span>·</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION E: CROSS-LINKING & BRAND LINEUP CAROUSEL
          "More from ancwave Acoustics"
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                CROSS-PLATFORM RECOMMENDATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                More from ancwave Acoustics
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View complete audio catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="group rounded-3xl bg-[#FBFBFA] border border-[#EAEAE5] p-5 flex flex-col justify-between hover:border-zinc-400 transition-all hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-4/3 rounded-2xl bg-white p-4 overflow-hidden border border-zinc-100">
                    <Image
                      src={rel.variants[0].image}
                      alt={rel.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="300px"
                    />
                    <span className="absolute top-3 left-3 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800">
                      {rel.model}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                      {rel.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-zinc-900">
                      ${rel.price}
                    </span>
                    <span className="block text-[10px] font-mono text-zinc-400">
                      approx. ₹{Math.round(rel.price * 83).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/products/${rel.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Drawer & Minimalist Global Footer */}
      <CartDrawer />
      <Footer />
    </div>
  );
}
