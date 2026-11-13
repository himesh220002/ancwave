"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Headphones, Radio, Ear } from "lucide-react";
import { ProductData } from "@/types";
import { resolveProductLayout } from "@/lib/product-layout";
import { CurrencyPrice } from "@/context/CurrencyContext";

type LineupTab = "all" | "headphones" | "earphones" | "earbuds";

const TABS: Array<{
  id: LineupTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
}> = [
  {
    id: "all",
    label: "All audio",
    shortLabel: "All",
    icon: Radio,
    blurb: "Every acoustic architecture, in one place.",
  },
  {
    id: "headphones",
    label: "Over-Ear",
    shortLabel: "Over-ear",
    icon: Headphones,
    blurb: "Immersive, room-filling silence for long listening.",
  },
  {
    id: "earphones",
    label: "In-Ear",
    shortLabel: "In-ear",
    icon: Ear,
    blurb: "Locked-in fit and athletic endurance.",
  },
  {
    id: "earbuds",
    label: "Wireless",
    shortLabel: "Wireless",
    icon: Radio,
    blurb: "Weightless true-wireless freedom.",
  },
];

function productMatchesTab(product: ProductData, tab: LineupTab): boolean {
  if (tab === "all") return true;
  if (product.categorySlug === tab) return true;

  const profile = resolveProductLayout(product);
  if (tab === "headphones") return profile.family === "audio-over-ear";
  if (tab === "earphones") return profile.family === "audio-in-ear";
  if (tab === "earbuds") return profile.family === "audio-tws";
  return false;
}

function primaryImage(product: ProductData): string {
  return (
    product.variants?.[0]?.images?.[0] ||
    product.variants?.[0]?.image ||
    product.mediaGallery?.[0]?.url ||
    "/images/hero-silver.jpg"
  );
}

function alternateImage(product: ProductData): string {
  const candidates = [
    product.variants?.[0]?.images?.[1],
    product.mediaGallery?.find((item) => item.type === "macro" || item.type === "360")?.url,
    product.explodedView?.image,
    product.mediaGallery?.[1]?.url,
    product.variants?.[0]?.images?.[0],
    product.variants?.[0]?.image,
  ].filter((value): value is string => Boolean(value));

  const primary = primaryImage(product);
  return candidates.find((value) => value !== primary) || primary;
}

function LineupCard({
  product,
  featured = false,
}: {
  product: ProductData;
  featured?: boolean;
}) {
  const front = primaryImage(product);
  const back = alternateImage(product);
  const profile = resolveProductLayout(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-[#E7E6E0] transition-all duration-500 hover:border-zinc-400 hover:shadow-lg ${
        featured ? "sm:col-span-2 lg:flex-row" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[#EFEEE9] ${
          featured ? "aspect-4/3 lg:aspect-auto lg:w-3/5" : "aspect-4/3"
        }`}
      >
        <Image
          src={front}
          alt={`${product.name} studio view`}
          fill
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          sizes={featured ? "(max-width: 1024px) 100vw, 55vw" : "(max-width: 768px) 100vw, 33vw"}
        />
        <Image
          src={back}
          alt={`${product.name} alternate acoustic view`}
          fill
          className="object-cover opacity-0 scale-105 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
          sizes={featured ? "(max-width: 1024px) 100vw, 55vw" : "(max-width: 768px) 100vw, 33vw"}
        />

        <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between gap-3">
          <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-mono tracking-[0.16em] text-zinc-800 uppercase border border-white/60">
            {profile.shortLabel}
          </span>
          <span className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/60 flex items-center justify-center text-zinc-800 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-md">
            Hover · acoustic x-ray
          </span>
        </div>
      </div>

      <div className={`flex flex-col justify-between gap-5 p-5 sm:p-6 ${featured ? "lg:w-2/5" : ""}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.16em] text-blue-600 uppercase font-semibold">
            <span className="w-1 h-1 rounded-full bg-blue-600" />
            {product.model || product.category}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 group-hover:text-blue-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed line-clamp-2">
            {product.tagline || product.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(product.variants || []).slice(0, 5).map((variant) => (
              <span
                key={variant.id}
                className="w-4 h-4 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: variant.hex }}
                title={variant.name}
              />
            ))}
            <span className="ml-1 text-[10px] font-mono text-zinc-400 uppercase">
              {(product.variants || []).length} finishes
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 pt-3 border-t border-zinc-100">
            <div className="min-w-0">
              <CurrencyPrice
                usd={product.price}
                inr={product.priceInr}
                className="text-lg font-bold text-zinc-950"
              />
              <span className="block text-[10px] font-mono text-zinc-400 truncate">
                Free delivery · {product.warrantyYears || 2}-year warranty
              </span>
            </div>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 shrink-0">
              Inspect
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AudioLineupSection({ products }: { products: ProductData[] }) {
  const [activeTab, setActiveTab] = useState<LineupTab>("all");

  const audioProducts = useMemo(
    () =>
      products.filter((product) => {
        const profile = resolveProductLayout(product);
        return profile.isAudio;
      }),
    [products]
  );

  const visibleProducts = useMemo(
    () => audioProducts.filter((product) => productMatchesTab(product, activeTab)),
    [audioProducts, activeTab]
  );

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <section
      id="audio-lineup"
      className="relative py-16 sm:py-24 bg-white border-y border-[#EAEAE5]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                02 / THE AUDIO LINEUP
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-[1.05]">
              Three forms. <br className="hidden sm:block" />
              One acoustic language.
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
              Every ancwave object is tuned to the same quiet standard — measured,
              sealed, and built to disappear. Choose the architecture that fits
              the way you listen.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 self-start lg:self-auto px-5 py-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-semibold transition-all"
          >
            <span>Explore full catalog</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-5 border-y border-[#EAEAE5] py-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
            role="tablist"
            aria-label="Audio categories"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = audioProducts.filter((product) =>
                productMatchesTab(product, tab.id)
              ).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      activeTab === tab.id ? "text-white/60" : "text-zinc-400"
                    }`}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            {activeTabMeta.blurb}
          </span>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {visibleProducts.map((product) => (
              <LineupCard
                key={product.slug}
                product={product}
                featured={visibleProducts.length === 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-[#FBFBFA] p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-900">
              This architecture is being tuned.
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              The {activeTabMeta.shortLabel.toLowerCase()} collection is being finalized in
              the acoustic lab. Explore the rest of the lineup in the meantime.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all audio
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          <span>Measured in-house · No borrowed benchmarks</span>
          <span>
            {String(audioProducts.length).padStart(2, "0")} active architectures / 2026
          </span>
        </div>
      </div>
    </section>
  );
}
