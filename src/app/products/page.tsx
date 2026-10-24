"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Star,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { sampleCatalog } from "@/lib/store";
import { useCart } from "@/context/CartContext";
import { ProductData } from "@/types";

type CategoryFilter = string;
type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export default function ProductsCatalogPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [justAddedSlug, setJustAddedSlug] = useState<string | null>(null);

  const [catalogProducts, setCatalogProducts] = useState<ProductData[]>(sampleCatalog);

  React.useEffect(() => {
    fetch("/api/product?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Compute dynamic category tabs from products
  const categoryTabs = useMemo(() => {
    const map = new Map<string, string>();
    map.set("all", `All Platforms (${catalogProducts.length})`);
    catalogProducts.forEach((p) => {
      const slug = p.categorySlug || "other";
      const name = p.category || (slug === "headphones" ? "Over-Ear Headphones" : slug === "earbuds" ? "True Wireless Earbuds" : slug);
      if (!map.has(slug)) {
        map.set(slug, name);
      }
    });
    return Array.from(map.entries()).map(([slug, label]) => ({ slug, label }));
  }, [catalogProducts]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let list = [...catalogProducts];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categorySlug === selectedCategory);
    }

    if (sortOption === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      list.sort((a, b) => (b.averageRating || b.rating) - (a.averageRating || a.rating));
    }

    return list;
  }, [catalogProducts, selectedCategory, sortOption]);

  const handleQuickAdd = (product: ProductData, variant?: any, childVariant?: any) => {
    const chosenVariant = variant || product.variants[0];
    const chosenPrice = childVariant?.price ?? chosenVariant?.price ?? product.price;
    const chosenImage = chosenVariant?.image || chosenVariant?.images?.[0] || childVariant?.images?.[0] || "/images/hero-silver.jpg";

    addItem({
      productId: product.id,
      name: product.name,
      variant: chosenVariant?.id || "standard",
      variantName: chosenVariant?.name || "Standard",
      price: chosenPrice,
      image: chosenImage,
      fit: product.categorySlug === "headphones" ? "Adjustable fit" : "Universal fit",
    });

    setJustAddedSlug(product.slug);
    setTimeout(() => setJustAddedSlug(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Navigation */}
      <Navbar subtitle="/ PRODUCT CATALOG" />

      {/* Hero Header */}
      <section className="border-b border-[#EAEAE5] bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              ACOUSTIC LINEUP · 2026 EDITION
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-tight">
                Engineered for pure listening.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Whether you demand the expansive immersion of over-ear headphones, the weightless freedom of true wireless earbuds, or the rugged retention of sports earphones—every ancwave transducer is crafted to eliminate noise and reveal your music.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
                3 HARDWARE PLATFORMS
              </span>
              <span className="hidden sm:inline px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
                ZERO COMPROMISE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Controls: Category Filter Tabs & Sort */}
      <section className="sticky top-16 sm:top-18 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EAEAE5] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryTabs.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.slug
                    ? "bg-black text-white shadow-xs font-semibold"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-medium hidden xs:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:border-blue-600"
            >
              <option value="featured">Featured Acoustics</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Cards Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredProducts.map((product) => (
            <ProductCatalogCard
              key={product.id}
              product={product}
              onQuickAdd={handleQuickAdd}
              isJustAdded={justAddedSlug === product.slug}
            />
          ))}
        </div>
      </main>

      {/* Brand Guarantees Strip */}
      <section className="bg-white border-t border-[#EAEAE5] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Complimentary Global Courier</h4>
              <p className="text-[11px] text-zinc-500">Tracked & fully insured express shipping on all orders.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">30-Day Home Acoustic Trial</h4>
              <p className="text-[11px] text-zinc-500">Experience in your studio with risk-free factory returns.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">2-Year International Warranty</h4>
              <p className="text-[11px] text-zinc-500">Comprehensive hardware & battery replacement guarantee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer & Footer */}
      <CartDrawer />
      <Footer />
    </div>
  );
}

interface ProductCatalogCardProps {
  product: ProductData;
  onQuickAdd: (product: ProductData, variant?: any, childVariant?: any) => void;
  isJustAdded: boolean;
}

function ProductCatalogCard({ product, onQuickAdd, isJustAdded }: ProductCatalogCardProps) {
  const [activeColorId, setActiveColorId] = useState<string>(
    product.variants?.[0]?.id || "standard"
  );

  const activeVariant =
    product.variants?.find((v) => v.id === activeColorId) || product.variants?.[0];

  // Match the active color with childVariants (architecture cuts & specific SKUs)
  const activeChild =
    product.childVariants?.find(
      (cv) =>
        cv.color.toLowerCase() === activeVariant?.name?.toLowerCase() ||
        cv.sku.toLowerCase() === activeVariant?.id?.toLowerCase()
    ) || product.childVariants?.[0];

  const displayImage =
    activeVariant?.image ||
    activeVariant?.images?.[0] ||
    activeChild?.images?.[0] ||
    product.variants?.[0]?.image ||
    "/images/hero-silver.jpg";

  const displayPrice = activeChild?.price ?? product.price;
  const displayOriginalPrice = product.originalPrice;

  // Extract top 3 technical specifications instead of generic metadata
  const topSpecs = useMemo(() => {
    const specsMap: Record<string, { value: string; isOverride?: boolean }> = {};

    // 1. Variant-specific overrides (highest priority if chosen)
    if (activeChild?.variantSpecs) {
      Object.entries(activeChild.variantSpecs).forEach(([k, v]) => {
        if (v && typeof v === "string") {
          specsMap[k] = { value: v, isOverride: true };
        }
      });
    }

    // 2. Global Specs (shared specifications across all architectures)
    if (product.globalSpecs) {
      Object.entries(product.globalSpecs).forEach(([k, v]) => {
        if (v && typeof v === "string" && !specsMap[k]) {
          specsMap[k] = { value: v, isOverride: false };
        }
      });
    }

    // 3. Category technical specs
    if (product.specs && typeof product.specs === "object") {
      Object.entries(product.specs).forEach(([k, v]) => {
        if (v && typeof v === "string" && !specsMap[k]) {
          specsMap[k] = { value: v, isOverride: false };
        }
      });
    }

    // 4. Acoustic metrics (for audio lineup)
    if (product.metrics) {
      if (product.metrics.playtime && !specsMap["Playtime"]) {
        specsMap["Playtime"] = { value: product.metrics.playtime, isOverride: false };
      }
      if (product.metrics.driverSize && !specsMap["Driver"]) {
        specsMap["Driver"] = { value: product.metrics.driverSize, isOverride: false };
      }
      if (product.metrics.ancDepth && !specsMap["ANC"]) {
        specsMap["ANC"] = { value: product.metrics.ancDepth, isOverride: false };
      }
      if (product.metrics.weight && !specsMap["Weight"]) {
        specsMap["Weight"] = { value: product.metrics.weight, isOverride: false };
      }
    }

    // Filter out brand or uninformative attributes
    const entries = Object.entries(specsMap).filter(
      ([k]) => k.toLowerCase() !== "brand" && k.toLowerCase() !== "sku"
    );

    // Prioritize key features based on customer relevance
    const priorityKeywords = [
      "display size", "display", "screen", "protection",
      "processor", "cpu", "chip",
      "battery capacity", "battery", "playtime",
      "ram", "memory", "storage",
      "material", "fabric", "fit", "weight", "gsm",
      "driver", "anc", "charging", "water resistance"
    ];

    entries.sort((a, b) => {
      // Overridden specs first
      if (a[1].isOverride && !b[1].isOverride) return -1;
      if (!a[1].isOverride && b[1].isOverride) return 1;

      const aIdx = priorityKeywords.findIndex((pk) => a[0].toLowerCase().includes(pk));
      const bIdx = priorityKeywords.findIndex((pk) => b[0].toLowerCase().includes(pk));
      const aRank = aIdx >= 0 ? aIdx : 999;
      const bRank = bIdx >= 0 ? bIdx : 999;
      return aRank - bRank;
    });

    if (entries.length >= 3) {
      return entries.slice(0, 3).map(([label, info]) => ({
        label,
        value: info.value,
        isOverride: info.isOverride,
      }));
    }

    // Fallbacks if fewer than 3 specs exist
    const result = entries.map(([label, info]) => ({
      label,
      value: info.value,
      isOverride: info.isOverride,
    }));

    if (result.length < 3 && product.model) {
      result.push({ label: "Edition", value: product.model, isOverride: false });
    }
    if (result.length < 3 && product.warrantyYears) {
      result.push({ label: "Warranty", value: `${product.warrantyYears} Years`, isOverride: false });
    }
    if (result.length < 3 && product.type) {
      result.push({ label: "Type", value: product.type, isOverride: false });
    }
    return result.slice(0, 3);
  }, [product, activeChild]);

  const configureHref = `/products/${product.slug}${activeColorId ? `?color=${activeColorId}` : ""}`;

  return (
    <div className="group flex flex-col rounded-3xl bg-white border border-[#EAEAE5] overflow-hidden hover:border-zinc-400 transition-all duration-300 hover:shadow-xl">
      {/* Card Image Container */}
      <div className="relative aspect-4/3 bg-[#F0EFEA] p-6 overflow-hidden flex items-center justify-center">
        <Link href={configureHref} className="relative w-full h-full block">
          <Image
            src={displayImage}
            alt={`${product.name} - ${activeVariant?.name || "Standard"}`}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-mono tracking-wider font-semibold text-zinc-900 border border-zinc-200/70 shadow-2xs">
            {product.model}
          </span>
          {activeChild?.specOverride && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-[9px] font-mono tracking-wider font-semibold text-white shadow-2xs">
              {activeChild.specOverride}
            </span>
          )}
          {product.isTws && !activeChild?.specOverride && (
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-[9px] font-mono tracking-wider font-semibold text-white shadow-2xs">
              MODULAR SKUs AVAILABLE
            </span>
          )}
          {product.isFlashSale && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-[9px] font-mono tracking-wider font-semibold text-white shadow-2xs">
              FEW UNITS LEFT
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-zinc-900 border border-zinc-200 shadow-2xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{product.averageRating || product.rating}</span>
          <span className="text-[10px] text-zinc-400 font-normal">({product.reviewCount})</span>
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-3">
          {/* Category & Interactive Color Swatches */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase">
              {product.category}
            </span>
            <div className="flex items-center gap-1.5">
              {product.variants.map((v) => {
                const isSelected = activeColorId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveColorId(v.id);
                    }}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer relative ${
                      isSelected
                        ? "ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-xs"
                        : "border-black/20 hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: v.hex }}
                    title={`${v.name} (Click to switch preview)`}
                    aria-label={`Select ${v.name} color`}
                  />
                );
              })}
            </div>
          </div>

          {/* Title & Tagline */}
          <div>
            <Link
              href={configureHref}
              className="group-hover:text-blue-600 transition-colors"
            >
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                {product.name}
              </h2>
            </Link>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Core Technical Specifications Pills (Replaced generic In Stock/Rating/Variants) */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
            {topSpecs.map((spec, sIdx) => (
              <div
                key={sIdx}
                className={`p-2 rounded-xl border transition-colors ${
                  spec.isOverride
                    ? "bg-amber-50/70 border-amber-200/90"
                    : "bg-zinc-50 border-zinc-100"
                }`}
              >
                <span className="block text-[10px] text-zinc-400 uppercase font-mono truncate">
                  {spec.isOverride ? `⚡ ${spec.label}` : spec.label}
                </span>
                <span
                  className={`text-xs font-bold font-mono truncate block ${
                    spec.isOverride ? "text-amber-950 font-bold" : "text-zinc-900"
                  }`}
                  title={spec.value}
                >
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Action Footer */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-900">
                ${displayPrice}
              </span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span className="text-xs text-zinc-400 line-through">
                  ${displayOriginalPrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block">
              approx. ₹{Math.round(displayPrice * 83).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickAdd(product, activeVariant, activeChild)}
              className="p-2.5 rounded-xl border border-zinc-200 hover:border-black text-zinc-700 hover:text-black transition-colors cursor-pointer"
              title={`Quick Add ${activeVariant?.name || ""} to Bag`}
              aria-label={`Add ${product.name} to bag`}
            >
              {isJustAdded ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>

            <Link
              href={configureHref}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Configure</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
