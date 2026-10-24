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

  const handleQuickAdd = (product: ProductData) => {
    const defaultVariant = product.variants[0];
    addItem({
      productId: product.id,
      name: product.name,
      variant: defaultVariant.id,
      variantName: defaultVariant.name,
      price: product.price,
      image: defaultVariant.image,
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
            <div
              key={product.id}
              className="group flex flex-col rounded-3xl bg-white border border-[#EAEAE5] overflow-hidden hover:border-zinc-400 transition-all duration-300 hover:shadow-xl"
            >
              {/* Card Image Container */}
              <div className="relative aspect-4/3 bg-[#F0EFEA] p-6 overflow-hidden flex items-center justify-center">
                <Link
                  href={`/products/${product.slug}`}
                  className="relative w-full h-full block"
                >
                  <Image
                    src={product.variants[0].image}
                    alt={product.name}
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
                  {product.isTws && (
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
                  {/* Category & Color Swatches */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {product.variants.map((v) => (
                        <span
                          key={v.id}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: v.hex }}
                          title={v.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
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

                  {/* Core Metrics / Attribute Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="block text-[10px] text-zinc-400 uppercase font-mono">
                        {product.metrics?.playtime ? "Playtime" : "In Stock"}
                      </span>
                      <span className="text-xs font-bold text-zinc-900">
                        {product.metrics?.playtime || `${product.stock} units`}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="block text-[10px] text-zinc-400 uppercase font-mono">
                        {product.metrics?.driverSize ? "Driver" : "Rating"}
                      </span>
                      <span className="text-xs font-bold text-zinc-900">
                        {product.metrics?.driverSize || `${product.averageRating || product.rating}★`}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="block text-[10px] text-zinc-400 uppercase font-mono">
                        {product.metrics?.weight ? "Weight" : "Variants"}
                      </span>
                      <span className="text-xs font-bold text-zinc-900">
                        {product.metrics?.weight || `${product.childVariants?.length || product.variants.length} ed.`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-zinc-900">
                        ${product.price}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-zinc-400 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      approx. ₹{Math.round(product.price * 83).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      className="p-2.5 rounded-xl border border-zinc-200 hover:border-black text-zinc-700 hover:text-black transition-colors"
                      title="Quick Add to Bag"
                      aria-label={`Add ${product.name} to bag`}
                    >
                      {justAddedSlug === product.slug ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>

                    <Link
                      href={`/products/${product.slug}`}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Configure</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
