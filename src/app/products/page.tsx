"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Star,
  SlidersHorizontal,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Headphones,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { sampleCatalog } from "@/lib/store";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/Toaster";
import { ProductData } from "@/types";

type CategoryFilter = string;
type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export default function ProductsCatalogPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [catalogProducts, setCatalogProducts] = useState<ProductData[]>(sampleCatalog);
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  const [specialistStep, setSpecialistStep] = useState<1 | 2>(1);
  const [specialistEnvironment, setSpecialistEnvironment] = useState<string>("desk");

  // Fetch updated catalog products from database
  useEffect(() => {
    fetch("/api/product?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
        }
      })
      .catch(() => { });
  }, []);

  // Compute category tabs
  const categoryTabs = useMemo(() => {
    const list: Array<{ slug: string; label: string; count: number }> = [
      { slug: "all", label: "All audio", count: catalogProducts.length },
    ];

    const categoryCounts = new Map<string, { label: string; count: number }>();

    catalogProducts.forEach((p) => {
      const slug = p.categorySlug || "other";
      const rawName = p.category || "";
      let label = "Audio";

      if (slug === "headphones" || rawName.toLowerCase().includes("over-ear")) {
        label = "Over-ear";
      } else if (slug === "earbuds" || rawName.toLowerCase().includes("wireless")) {
        label = "True wireless";
      } else if (slug === "earphones" || rawName.toLowerCase().includes("sports")) {
        label = "In-ear sports";
      } else if (slug.includes("smartphones") || rawName.toLowerCase().includes("smartphone")) {
        label = "Smartphones";
      } else if (slug.includes("apparel") || rawName.toLowerCase().includes("apparel")) {
        label = "Apparel";
      } else {
        label = rawName.split("/").pop()?.trim() || "Catalog";
      }

      const existing = categoryCounts.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        categoryCounts.set(slug, { label, count: 1 });
      }
    });

    categoryCounts.forEach((val, slug) => {
      list.push({ slug, label: val.label, count: val.count });
    });

    return list;
  }, [catalogProducts]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let list = [...catalogProducts];

    if (selectedCategory !== "all") {
      list = list.filter((p) => (p.categorySlug || "other") === selectedCategory);
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

  const activeComparedProducts = useMemo(() => {
    if (comparedSlugs.length > 0) {
      return catalogProducts.filter((p) => comparedSlugs.includes(p.slug));
    }
    return catalogProducts.slice(0, 3);
  }, [catalogProducts, comparedSlugs]);

  const toggleCompare = (slug: string) => {
    const targetProduct = catalogProducts.find((p) => p.slug === slug);
    const prodName = targetProduct?.name || slug;

    setComparedSlugs((prev) => {
      const isAlready = prev.includes(slug);
      if (isAlready) {
        toast({
          type: "info",
          title: "Removed from Comparison",
          description: `${prodName} removed from comparison matrix.`,
        });
        return prev.filter((s) => s !== slug);
      } else {
        toast({
          type: "success",
          title: "Added to Comparison",
          description: `${prodName} added. Scroll down to view the matrix.`,
        });
        return [...prev, slug];
      }
    });
  };

  const handleQuickAdd = (product: ProductData, variant?: any, childVariant?: any) => {
    const chosenVariant = variant || product.variants[0];
    const chosenPrice = childVariant?.price ?? chosenVariant?.price ?? product.price;
    const chosenImage =
      chosenVariant?.image ||
      chosenVariant?.images?.[0] ||
      childVariant?.images?.[0] ||
      "/images/hero-silver.jpg";

    addItem({
      productId: product.id,
      name: product.name,
      variant: chosenVariant?.id || "standard",
      variantName: chosenVariant?.name || "Standard",
      price: chosenPrice,
      image: chosenImage,
      fit: product.categorySlug === "headphones" ? "Adjustable fit" : "Universal fit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar subtitle="/ PRODUCT CATALOG" />

      {/* Hero Header Section */}
      <section className="bg-white border-b border-[#EAEAE5] pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Link href="/" className="hover:text-zinc-700 transition-colors">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-zinc-800">Audio catalog</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.18em] text-blue-600 font-semibold uppercase">
              ACOUSTIC LINEUP · 2026 EDITION
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-1">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-[1.1]">
                Engineered for pure listening.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-xl">
                Whether you demand the expansive immersion of over-ear headphones, the weightless freedom of true wireless earbuds, or the rugged retention of sports earphones—every ancwave transducer is crafted to eliminate noise and reveal your music.
              </p>
            </div>

            {/* Right Stat Widget */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto pt-2 md:pt-0">
              <span className="text-4xl sm:text-5xl font-bold font-mono text-blue-600 tracking-tight">
                {String(catalogProducts.length).padStart(2, "0")}
              </span>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 leading-snug">
                <span className="block font-semibold text-zinc-600">HARDWARE PLATFORMS</span>
                <span className="block">ZERO COMPROMISE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Controls Bar */}
      <section className="sticky top-16 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EAEAE5] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryTabs.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
                    }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
                    ({cat.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
            <span className="text-zinc-400 font-medium hidden xs:inline">Sort by</span>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Sort product catalog"
                className="pl-3 pr-8 py-2 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:border-blue-600 appearance-none cursor-pointer"
              >
                <option value="featured">Featured acoustics</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="rating">Highest customer rating</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Inventory Meta Strip */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-8 flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span>{filteredProducts.length} products. One uncompromising sound.</span>
        <span className="flex items-center gap-1.5 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All models in stock · Ready to ship
        </span>
      </div>

      {/* Product Cards Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCatalogCard
              key={product.id}
              product={product}
              onQuickAdd={handleQuickAdd}
              isCompared={comparedSlugs.includes(product.slug)}
              onToggleCompare={() => toggleCompare(product.slug)}
            />
          ))}
        </div>

        {/* Footer Subline & Quick Link to Comparison Matrix */}
        <div className="mt-8 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <span>Prices in USD. Concept pricing and specifications shown for this catalog.</span>
          <a
            href="#compare-matrix"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>Compare the lineup</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </main>

      {/* Lineup Comparison Matrix Section */}
      <section id="compare-matrix" className="py-16 sm:py-20 bg-white border-t border-[#EAEAE5] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-[11px] font-mono tracking-[0.18em] text-blue-600 uppercase font-semibold">
                  {comparedSlugs.length > 0 ? "CUSTOM COMPARISON ACTIVE" : "FIND YOUR FREQUENCY"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                {comparedSlugs.length > 0
                  ? `Comparing ${comparedSlugs.length} selected model${comparedSlugs.length > 1 ? "s" : ""}`
                  : "Compare the lineup, side by side"}
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs text-zinc-500 max-w-sm">
                {comparedSlugs.length > 0
                  ? "Side-by-side technical specifications, driver architectures, and battery endurance."
                  : "Check 'Add to compare' on any product cards above to customize this matrix dynamically."}
              </p>
              {comparedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setComparedSlugs([]);
                    toast({
                      type: "info",
                      title: "Comparison Reset",
                      description: "Reset to default flagship lineup comparison.",
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs text-zinc-600 font-medium transition-colors cursor-pointer shrink-0"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Comparison Matrix Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="p-5 text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold w-52 shrink-0 align-bottom">
                    SPECIFICATIONS & ARCHITECTURE
                  </th>
                  {activeComparedProducts.map((p) => {
                    const mainImg =
                      p.variants?.[0]?.images?.[0] ||
                      p.variants?.[0]?.image ||
                      p.childVariants?.[0]?.images?.[0] ||
                      "/images/hero-silver.jpg";
                    const isSelected = comparedSlugs.includes(p.slug);
                    const configureHref = `/products/${p.slug}`;

                    return (
                      <th key={p.id} className="p-5 min-w-[220px] align-top relative border-l border-zinc-100">
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => toggleCompare(p.slug)}
                            title="Remove from comparison"
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-200/70 hover:bg-red-100 hover:text-red-600 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="relative w-20 h-20 rounded-xl bg-[#F0EFEA] border border-zinc-200 overflow-hidden mx-auto mb-3">
                          <Image
                            src={mainImg}
                            alt={p.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>

                        <div className="text-center space-y-1">
                          <Link
                            href={configureHref}
                            className="font-bold text-sm text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {p.name}
                          </Link>
                          <div className="text-sm font-mono font-bold text-blue-600">
                            ${p.price}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{p.averageRating || p.rating || 4.9}</span>
                            <span className="text-zinc-400 font-mono">({p.reviewCount || 128})</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p)}
                            className="mt-2.5 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>Add to bag +</span>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-600">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Category & Form</td>
                  {activeComparedProducts.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 font-medium text-zinc-900 border-l border-zinc-100">
                      {p.category || (p.categorySlug === "headphones" ? "Wireless Over-Ear" : p.categorySlug === "earbuds" ? "True Wireless Earbuds" : "Smart Instrument")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Core Philosophy</td>
                  {activeComparedProducts.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 text-zinc-700 border-l border-zinc-100">
                      {p.tagline || (p.description ? p.description.slice(0, 80) + "..." : "Precision engineered")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Driver & Hardware</td>
                  {activeComparedProducts.map((p) => {
                    const spec =
                      p.specs?.driver ||
                      p.globalSpecs?.["Display Size"] ||
                      p.globalSpecs?.["Acoustic Driver"] ||
                      p.globalSpecs?.["Processor"] ||
                      "40 mm custom biocellulose driver";
                    return (
                      <td key={p.id} className="p-4 sm:p-5 font-medium text-zinc-900 border-l border-zinc-100">
                        {spec}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Battery & Playtime</td>
                  {activeComparedProducts.map((p) => {
                    const batt =
                      p.specs?.batteryLife ||
                      p.globalSpecs?.["Battery Capacity"] ||
                      p.globalSpecs?.["Battery"] ||
                      (p.isTws ? "Up to 8.5 h (34 h with case)" : "Up to 40 h · 38 h with ANC");
                    return (
                      <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                        {batt}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Noise Control / Processor</td>
                  {activeComparedProducts.map((p) => {
                    const noise =
                      p.specs?.noiseControl ||
                      p.globalSpecs?.["Chipset / Processor"] ||
                      "Adaptive Hybrid ANC with Transparency";
                    return (
                      <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                        {noise}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Charging & Durability</td>
                  {activeComparedProducts.map((p) => {
                    const charge =
                      p.specs?.charging ||
                      p.globalSpecs?.["Water Resistance"] ||
                      "USB-C Rapid Charge";
                    return (
                      <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                        {charge}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Connectivity</td>
                  {activeComparedProducts.map((p) => {
                    const conn =
                      p.specs?.connectivity ||
                      p.globalSpecs?.["Connectivity"] ||
                      "Bluetooth 5.3 · Multi-device Multipoint";
                    return (
                      <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                        {conn}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Materials & Weight</td>
                  {activeComparedProducts.map((p) => {
                    const mat =
                      p.specs?.materials ||
                      p.globalSpecs?.["Build Material"] ||
                      "Anodized Aluminum · Slow-Recovery Foam";
                    const wt = p.specs?.weightMetric || "256 g";
                    return (
                      <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                        {mat} ({wt})
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Warranty & Trial</td>
                  {activeComparedProducts.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 text-emerald-700 font-medium border-l border-zinc-100">
                      {p.warrantyYears || 2}-Year Warranty · {p.returnDays || 30}-Day Returns
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-700 bg-zinc-50/50">Stock Availability</td>
                  {activeComparedProducts.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 border-l border-zinc-100">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {p.stock > 0 ? `${p.stock} units available` : "Pre-order"}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-zinc-400 font-mono">
            ⓘ Real-time technical comparison. Select any products from the catalog above to view instant hardware differences.
          </p>
        </div>
      </section>

      {/* Brand Guarantees Strip */}
      <section className="bg-[#FBFBFA] border-t border-[#EAEAE5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-900">Complimentary delivery</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Free standard shipping on every audio order.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-900">30 days to find your sound</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Listen at home. Easy returns within 30 days.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-900">2-year limited warranty</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Support that stays with you, long after unboxing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Audio Specialist Consultation Banner */}
      <section className="py-12 bg-white border-t border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="rounded-3xl bg-blue-50/70 border border-blue-200/80 p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2.5 max-w-xl">
              <span className="text-[10px] font-mono tracking-[0.2em] text-blue-600 font-bold uppercase">
                GOOD SOUND STARTS WITH A CONVERSATION
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                Not sure which form is yours?
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tell us how you listen. We'll help you choose the right fit, features, and finish—without the technical overload.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSpecialistModalOpen(true)}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>Talk to an audio specialist</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400">
                Mon–Fri, 9am–6pm · We're here to help
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Comparison Drawer if products selected */}
      {comparedSlugs.length > 0 && (
        <aside
          aria-label="Product comparison dock"
          className="fixed bottom-6 inset-x-0 z-40 max-w-xl mx-auto px-4 animate-in slide-in-from-bottom duration-300"
        >
          <div className="bg-zinc-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-zinc-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center -space-x-2 shrink-0">
                {activeComparedProducts.map((p) => {
                  const img =
                    p.variants?.[0]?.images?.[0] ||
                    p.variants?.[0]?.image ||
                    p.childVariants?.[0]?.images?.[0] ||
                    "/images/hero-silver.jpg";
                  return (
                    <div
                      key={p.id}
                      className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-[#F0EFEA] overflow-hidden relative shrink-0 shadow-xs"
                      title={p.name}
                    >
                      <Image src={img} alt={p.name} fill className="object-contain p-0.5" />
                    </div>
                  );
                })}
              </div>
              <div className="text-xs truncate">
                <span className="font-semibold text-white">{comparedSlugs.length} model{comparedSlugs.length > 1 ? "s" : ""}</span>{" "}
                <span className="text-zinc-400 hidden xs:inline">in comparison</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setComparedSlugs([]);
                  toast({
                    type: "info",
                    title: "Comparison Cleared",
                    description: "Removed all models from comparison.",
                  });
                }}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("compare-matrix");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span>View matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Audio Specialist Recommendation Modal */}
      {isSpecialistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setIsSpecialistModalOpen(false);
                setSpecialistStep(1);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                ACOUSTIC CONSULTATION
              </span>
              <h3 className="text-xl font-bold text-zinc-950">
                Find your perfect sound setup.
              </h3>
              <p className="text-xs text-zinc-500">
                Select your primary listening routine for an instant hardware match.
              </p>
            </div>

            {specialistStep === 1 ? (
              <div className="space-y-3">
                {[
                  { id: "desk", title: "Focused Studio & Desk Work", desc: "Form 01 Over-Ear (Adaptive ANC, 40h battery, boom mic)", rec: "form-01" },
                  { id: "commute", title: "Daily Commute & Travel", desc: "Form Air TWS (11mm graphene, Qi case, pocketable)", rec: "form-air-tws" },
                  { id: "sports", title: "Intense Workouts & Running", desc: "Form Pulse IEM (IPX7 waterproof, titanium earhooks)", rec: "form-pulse-iem" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSpecialistEnvironment(item.rec);
                      setSpecialistStep(2);
                    }}
                    className="w-full text-left p-4 rounded-2xl border border-zinc-200 hover:border-blue-600 hover:bg-blue-50/30 transition-all space-y-1 cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-zinc-900 group-hover:text-blue-600 flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Specialist Recommendation Match</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Based on your routine, the{" "}
                    <strong>
                      {catalogProducts.find((p) => p.slug === specialistEnvironment)?.name || "Form 01"}
                    </strong>{" "}
                    provides maximum acoustic equilibrium and comfort.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSpecialistStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <Link
                    href={`/products/${specialistEnvironment}`}
                    onClick={() => setIsSpecialistModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Explore Model Details →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer & Master Footer */}
      <CartDrawer />
      <Footer />
    </div>
  );
}

interface ProductCatalogCardProps {
  product: ProductData;
  onQuickAdd: (product: ProductData, variant?: any, childVariant?: any) => void;
  isCompared: boolean;
  onToggleCompare: () => void;
}

function ProductCatalogCard({
  product,
  onQuickAdd,
  isCompared,
  onToggleCompare,
}: ProductCatalogCardProps) {
  const [activeColorId, setActiveColorId] = useState<string>(
    product.variants?.[0]?.id || "standard"
  );
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.variants?.find((v) => v.id === activeColorId) || product.variants?.[0];

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

  // Derive contextual badge for top-left
  const badgeLabel = useMemo(() => {
    if (product.slug === "form-01") return "Few units left";
    if (product.slug === "form-air-tws") return "Everyday essential";
    if (product.slug === "form-pulse-iem") return "Built to move";
    if (product.categorySlug?.includes("smartphone")) return "Flagship 5G";
    if (product.categorySlug?.includes("apparel")) return "Organic 450 GSM";
    return product.model || "Official Release";
  }, [product]);

  // Derive 3-column technical specs
  const specsRow = useMemo(() => {
    // 1. Form 01
    if (product.slug === "form-01") {
      return [
        { label: "PLAYTIME", value: "40 h" },
        { label: "WITH ANC", value: "38 h" },
        { label: "CONNECTIVITY", value: "Bluetooth 5.3" },
      ];
    }
    // 2. Form Air TWS
    if (product.slug === "form-air-tws") {
      return [
        { label: "PER CHARGE", value: "8.5 h" },
        { label: "WITH CASE", value: "34 h" },
        { label: "DRIVERS", value: "11 mm graphene" },
      ];
    }
    // 3. Form Pulse IEM
    if (product.slug === "form-pulse-iem") {
      return [
        { label: "PLAYTIME", value: "18 h" },
        { label: "PROTECTION", value: "IPX7" },
        { label: "FIT", value: "Titanium earhooks" },
      ];
    }

    // 4. Smartphone / Dynamic products
    if (product.categorySlug?.includes("smartphone") || product.globalSpecs?.["Processor"]) {
      const displayVal = activeChild?.variantSpecs?.["Display Size"]?.split(" ")?.[0] || "6.0\"";
      const batteryVal = activeChild?.variantSpecs?.["Battery Capacity"]?.split(" ")?.[0] || "5500 mAh";
      return [
        { label: "DISPLAY", value: displayVal },
        { label: "CHIPSET", value: "Snapdragon 8" },
        { label: "BATTERY", value: batteryVal },
      ];
    }

    // 5. Apparel / Other
    if (product.categorySlug?.includes("apparel")) {
      return [
        { label: "FABRIC", value: "100% Cotton" },
        { label: "WEIGHT", value: "450 GSM" },
        { label: "FIT", value: "Studio Cut" },
      ];
    }

    // Fallback: extract from globalSpecs or metrics
    const entries = Object.entries(product.globalSpecs || {}).filter(
      ([k]) => k.toLowerCase() !== "brand"
    );
    if (entries.length >= 3) {
      return entries.slice(0, 3).map(([k, v]) => ({
        label: k.toUpperCase(),
        value: v,
      }));
    }

    return [
      { label: "WARRANTY", value: `${product.warrantyYears || 2} Years` },
      { label: "RATING", value: `${product.averageRating || product.rating} ★` },
      { label: "INVENTORY", value: `${product.stock} units` },
    ];
  }, [product, activeChild]);

  // Derive standout feature
  const standoutFeature = useMemo(() => {
    if (product.slug === "form-01") return "Detachable boom microphone";
    if (product.slug === "form-air-tws") return "Qi wireless fast-charging case";
    if (product.slug === "form-pulse-iem") return "Ergonomic secure-fit wings";
    if (product.categorySlug?.includes("smartphone")) return "Corning Gorilla Glass Victus & 65W charging";
    if (product.categorySlug?.includes("apparel")) return "Double-stitched ergonomic raglan sleeves";
    return activeChild?.specOverride || "Precision Scandinavian acoustic architecture";
  }, [product, activeChild]);

  const configureHref = `/products/${product.slug}${activeColorId ? `?color=${activeColorId}` : ""}`;

  return (
    <div className="group flex flex-col rounded-3xl bg-white border border-[#EAEAE5] overflow-hidden hover:border-zinc-400 transition-all duration-300 hover:shadow-xl">
      {/* Top Media Image Container */}
      <div className="relative aspect-4/3 bg-[#F0EFEA] overflow-hidden">
        <Link href={configureHref} className="relative w-full h-full block">
          <Image
            src={displayImage}
            alt={`${product.name} - ${activeVariant?.name || "Standard"}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-[10px] font-mono tracking-wider font-semibold text-zinc-800 border border-zinc-200/80 shadow-2xs">
            {badgeLabel}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-zinc-900 border border-zinc-200 shadow-2xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{product.averageRating || product.rating}</span>
          <span className="text-[10px] text-zinc-400 font-normal">({product.reviewCount})</span>
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-3.5">
          {/* Category Subtitle */}
          <div className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
            {product.categorySlug === "headphones"
              ? "AUDIO / OVER-EAR"
              : product.categorySlug === "earbuds"
                ? "AUDIO / TRUE WIRELESS"
                : product.categorySlug === "earphones"
                  ? "AUDIO / IN-EAR SPORTS"
                  : product.category?.toUpperCase() || "HARDWARE"}
          </div>

          {/* Title & Price Header */}
          <div className="flex items-baseline justify-between gap-2">
            <Link href={configureHref} className="group-hover:text-blue-600 transition-colors">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                {product.name}
              </h2>
            </Link>
            <span className="text-lg font-bold font-mono text-zinc-900 shrink-0">
              ${displayPrice}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed min-h-[32px]">
            {product.description}
          </p>

          {/* 3-Column Specifications Row */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 text-left">
            {specsRow.map((col, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider truncate">
                  {col.label}
                </span>
                <span className="block text-xs font-bold text-zinc-900 font-mono truncate" title={col.value}>
                  {col.value}
                </span>
              </div>
            ))}
          </div>

          {/* Standout Feature */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-700 pt-0.5">
            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs text-zinc-700 font-medium truncate">{standoutFeature}</span>
          </div>

          {/* Colorway Swatches Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              {product.variants.map((v) => {
                const isSelected = activeColorId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveColorId(v.id)}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer relative ${isSelected
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

            <span className="text-xs text-zinc-500 font-medium capitalize truncate max-w-[140px]">
              {activeVariant?.name || "Standard"}
            </span>
          </div>
        </div>

        {/* Dual Actions: Add to bag + Details */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-12 gap-2">
            <button
              type="button"
              onClick={() => {
                onQuickAdd(product, activeVariant, activeChild);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 2000);
              }}
              className="col-span-8 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Added to bag!</span>
                </>
              ) : (
                <span>Add to bag +</span>
              )}
            </button>

            <Link
              href={configureHref}
              className="col-span-4 py-3 px-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center"
            >
              Details
            </Link>
          </div>

          {/* Add to compare button */}
          <button
            type="button"
            onClick={onToggleCompare}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border ${isCompared
              ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold shadow-2xs"
              : "bg-white border-zinc-200 text-zinc-600 hover:text-blue-600 hover:border-blue-300 hover:bg-zinc-50"
              }`}
          >
            <span
              className={`w-4 h-4 rounded flex items-center justify-center border text-[11px] font-bold transition-colors ${isCompared
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-zinc-300 bg-white text-zinc-400"
                }`}
            >
              {isCompared ? "✓" : "+"}
            </span>
            <span>{isCompared ? "In comparison (Remove)" : "Add to compare"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
