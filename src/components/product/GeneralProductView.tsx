"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  BatteryCharging,
  Check,
  ChevronRight,
  Cpu,
  Radio,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { IReview, ProductData, Review } from "@/types";
import { ProductLayoutProfile, mergeSpecEntries } from "@/lib/product-layout";
import { useProductSelection } from "@/hooks/useProductSelection";
import { useCart } from "@/context/CartContext";
import { CurrencyPrice, useCurrency } from "@/context/CurrencyContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ReviewImageMasonry } from "@/components/product/ReviewImageMasonry";
import { RelatedProductsRail } from "@/components/product/RelatedProductsRail";

interface GeneralProductViewProps {
  product: ProductData;
  relatedProducts: ProductData[];
  profile: ProductLayoutProfile;
}

type SpecTab = "core" | "battery" | "connectivity";

export function GeneralProductView({
  product,
  relatedProducts,
  profile,
}: GeneralProductViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const selection = useProductSelection(product);
  const {
    groups,
    activeGroup,
    activeGroupColor,
    activeChildVariant,
    activeVariant,
    activeTwsOption,
    images,
    activeImageIndex,
    price,
    priceInr,
    originalPrice,
    stock,
    sku,
    selectGroup,
    selectColor,
    selectChildSku,
    selectTwsComponent,
    setActiveImageIndex,
  } = selection;

  const [activeSpecTab, setActiveSpecTab] = useState<SpecTab>("core");
  const [reviews, setReviews] = useState<(Review & IReview)[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/reviews?productId=${product.productId || product.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingReviews(false);
      });
    return () => {
      mounted = false;
    };
  }, [product.productId, product.slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("color", selection.colorId);
    if (activeGroup?.id && groups.length > 1) params.set("edition", activeGroup.id);
    if (activeTwsOption?.id) params.set("component", activeTwsOption.id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }, [selection.colorId, activeGroup?.id, groups.length, activeTwsOption?.id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const specEntries = useMemo(
    () => mergeSpecEntries(product, activeChildVariant),
    [product, activeChildVariant]
  );

  const callouts = useMemo(() => {
    if (product.primaryValueCallouts && product.primaryValueCallouts.length > 0) {
      return product.primaryValueCallouts;
    }
    return specEntries.slice(0, 3).map((entry, index) => ({
      tag: index === 0 ? "CORE MATERIAL" : index === 1 ? "CONSTRUCTION" : "DETAIL",
      title: entry.value,
      subtitle: entry.label,
      description: product.description,
    }));
  }, [product.primaryValueCallouts, product.description, specEntries]);

  const reviewPhotos = useMemo(
    () =>
      reviews.flatMap((review, reviewIndex) =>
        (review.images || []).map((src, imageIndex) => ({
          src,
          alt: `Customer photo ${imageIndex + 1} for ${product.name}`,
          author: review.author || review.userName || "Verified owner",
          caption: review.comment?.slice(0, 54),
          key: `${review.id || review.reviewId || reviewIndex}-${imageIndex}`,
        }))
      ),
    [reviews, product.name]
  );

  const fallbackPhotos = useMemo(
    () =>
      (product.mediaGallery?.length
        ? product.mediaGallery
        : images.map((src, index) => ({
            url: src,
            alt: `${product.name} scene ${index + 1}`,
            label: profile.galleryLabels[index] || `Scene ${index + 1}`,
          }))
      ).map((item) => ({
        src: item.url,
        alt: item.alt,
        author: "ancwave studio",
        caption: `${item.label || "Concept frame"} · illustrative`,
      })),
    [product.mediaGallery, images, product.name, profile.galleryLabels]
  );

  const handleAddToBag = () => {
    addItem({
      productId: product.id,
      name: `${product.name} - ${activeChildVariant?.color || activeVariant?.name || "Standard"}`,
      variant: activeVariant?.id || "standard",
      variantName: `${activeChildVariant?.color || activeVariant?.name || "Standard"}${
        activeChildVariant?.specOverride ? ` (${activeChildVariant.specOverride})` : ""
      }`,
      component: activeTwsOption && activeTwsOption.id !== "full-set" ? activeTwsOption.label : undefined,
      componentSku: sku,
      price,
      priceInr,
      image: images[0],
      fit: activeGroup?.name || "Standard configuration",
    });
  };

  const handleBuyNow = () => {
    handleAddToBag();
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar subtitle={`/ ${product.name.toUpperCase()}`} />

      <div className="bg-white border-b border-[#EAEAE5] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between text-xs text-zinc-500">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <Link href="/products" className="hover:text-black transition-colors">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="capitalize">{profile.shortLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-zinc-900 font-semibold truncate">{product.name}</span>
          </nav>
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">SKU: {sku}</span>
        </div>
      </div>

      <section className="py-10 sm:py-16 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            <div className="lg:col-span-7 space-y-4">
              {/* Main Showcase Viewport: Pure Rectangle Architectural Frame */}
              <div className="relative aspect-4/3 sm:aspect-4/3 rounded-none bg-zinc-900 skeleton-shimmer overflow-hidden flex items-center justify-center border border-zinc-200/90 shadow-2xs">
                <Image
                  key={images[activeImageIndex] || images[0]}
                  src={images[activeImageIndex] || images[0]}
                  alt={`${product.name} - ${activeChildVariant?.color || activeVariant?.name || "Standard"}`}
                  fill
                  priority
                  className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                {/* Perspective & Angle Badges */}
                <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-none bg-black/80 backdrop-blur-md text-[10px] font-mono tracking-widest text-white uppercase font-semibold border border-white/20 shadow-xs">
                    {profile.galleryLabels[activeImageIndex] || "STUDIO RENDER"}
                  </span>
                </div>
                {/* Top Right Counter */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 px-2.5 py-1 rounded-none bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/20 shadow-xs">
                  {activeImageIndex + 1} / {images.length}
                </div>
                {/* Variant Pill Indicator */}
                <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 text-[10px] font-mono text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-none border border-white/20 shadow-xs">
                  {(activeChildVariant?.color || activeVariant?.name || "Standard").toUpperCase()} · {sku}
                </div>
              </div>

              {/* Multi-Angle Thumbnails: Pure Rectangle Tiles (No text tags) */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-none bg-zinc-900 skeleton-shimmer overflow-hidden border transition-all cursor-pointer group/thumb ${
                      activeImageIndex === index
                        ? "border-2 border-blue-600 shadow-sm ring-1 ring-blue-600/30"
                        : "border border-zinc-300 hover:border-zinc-500 opacity-75 hover:opacity-100"
                    }`}
                    title={profile.galleryLabels[index] || `Angle ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} angle ${index + 1}`}
                      fill
                      className="object-cover group-hover/thumb:scale-108 transition-transform duration-300"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono tracking-widest text-blue-600 uppercase font-semibold">
                    {profile.eyebrow}
                  </span>
                  {reviews.length > 0 ? (
                    <div className="flex items-center gap-1 text-xs font-semibold text-zinc-900 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-zinc-400 font-normal">({reviews.length})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                      <Star className="w-3.5 h-3.5 text-zinc-300" />
                      <span>New</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {product.tagline} {product.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <CurrencyPrice
                      usd={price}
                      inr={priceInr}
                      reserve
                      className="text-2xl sm:text-3xl font-bold text-zinc-900"
                    />
                    {originalPrice > price && (
                      <CurrencyPrice
                        usd={originalPrice}
                        className="text-sm text-zinc-400 line-through"
                      />
                    )}
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {stock > 0 ? `In stock (${stock})` : "Made to order"}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Native currency at checkout · {format(price, priceInr)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[10px] font-mono text-zinc-400 uppercase">Warranty</span>
                  <span className="text-xs font-bold text-zinc-800">{product.warrantyYears || 2} years</span>
                </div>
              </div>

              {groups.length > 0 && (groups.length > 1 || (activeGroup?.colors?.length || 0) > 1) && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  {groups.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900 uppercase font-mono tracking-wider">Edition</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{groups.length} configurations</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => selectGroup(group.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              activeGroup?.id === group.id
                                ? "bg-white border-blue-600 ring-1 ring-blue-600 shadow-xs"
                                : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-zinc-900">{group.name}</span>
                              <span className="text-[10px] font-mono text-blue-600">
                                {format(group.price || product.price, group.priceInr)}
                              </span>
                            </div>
                            {group.specOverride && (
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{group.specOverride}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeGroup && activeGroup.colors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700">
                          Finish: <span className="font-bold text-zinc-900">{activeGroupColor?.color || activeVariant?.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {activeGroup.colors.length} options
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {activeGroup.colors.map((color, index) => {
                          const matchingVariant = product.variants.find(
                            (variant) => variant.name.toLowerCase() === color.color.toLowerCase()
                          );
                          const selected =
                            activeGroupColor?.sku === color.sku ||
                            activeVariant?.id === matchingVariant?.id;
                          return (
                            <button
                              key={`${color.sku}-${index}`}
                              type="button"
                              onClick={() => selectColor(matchingVariant?.id || color.id || color.sku)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                selected ? "ring-2 ring-blue-600 ring-offset-2 scale-105" : "hover:scale-105"
                              }`}
                              title={color.color}
                              aria-label={`Select ${color.color}`}
                            >
                              <span
                                className="w-full h-full rounded-full border border-black/15 shadow-xs flex items-center justify-center"
                                style={{ backgroundColor: color.hex || matchingVariant?.hex || "#333" }}
                              >
                                {selected && (
                                  <Check className={`w-4 h-4 ${index % 2 === 0 ? "text-zinc-900" : "text-white"}`} />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!groups.length && product.variants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">Finish</span>
                    <span className="text-[10px] font-mono text-zinc-400">{product.variants.length} options</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => selectColor(variant.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          activeVariant?.id === variant.id ? "ring-2 ring-blue-600 ring-offset-2 scale-105" : "hover:scale-105"
                        }`}
                        title={variant.name}
                        aria-label={`Select ${variant.name}`}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/15 shadow-xs flex items-center justify-center"
                          style={{ backgroundColor: variant.hex }}
                        >
                          {activeVariant?.id === variant.id && <Check className="w-4 h-4 text-zinc-900" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.isTws && product.twsComponents && product.twsComponents.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900 uppercase font-mono tracking-wider">Component matrix</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Modular replacements</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.twsComponents.map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => selectTwsComponent(component.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeTwsOption?.id === component.id
                            ? "bg-white border-blue-600 ring-1 ring-blue-600 shadow-xs"
                            : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-900">{component.label}</span>
                          <span className="text-[11px] font-mono text-blue-600">
                            {format(component.price)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{component.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.childVariants && product.childVariants.length > 1 && (
                <div className="space-y-2 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900 uppercase font-mono tracking-wider">Architecture</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{product.childVariants.length} variants</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {product.childVariants.map((variant) => (
                      <button
                        key={variant.sku}
                        type="button"
                        onClick={() => selectChildSku(variant.sku)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                          activeChildVariant?.sku === variant.sku
                            ? "bg-white border-blue-600 ring-1 ring-blue-600 shadow-xs"
                            : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">{variant.color}</span>
                            <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{variant.sku}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{variant.specOverride || "Standard architecture"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-zinc-900">{format(variant.price, variant.priceInr)}</span>
                          <span className={`block text-[9px] font-mono ${variant.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                            {variant.stock === 0 ? "Sold out" : `${variant.stock} left`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToBag}
                    className="w-full py-3.5 px-4 rounded-xl border border-zinc-300 hover:border-black active:scale-[0.99] text-zinc-900 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 bg-white"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Now</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {product.deliveryEstimate}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    {product.returnDays || 30}-day trial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                {profile.label.toUpperCase()} · MATERIAL STUDY
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Nothing extra. Everything considered.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {callouts.slice(0, 3).map((callout, index) => (
              <div
                key={`${callout.title}-${index}`}
                className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-7 space-y-3 hover:border-zinc-400 transition-colors"
              >
                <span className="text-[10px] font-mono tracking-widest text-blue-600 font-semibold uppercase">
                  0{index + 1} / {callout.tag}
                </span>
                <h3 className="text-lg font-bold text-zinc-900">{callout.title}</h3>
                <p className="text-xs font-medium text-zinc-700">{callout.subtitle}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{callout.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="specs" className="py-16 sm:py-24 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                TECHNICAL BENCHMARK MATRIX
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                {profile.specTitle}
              </h2>
            </div>

            {product.tabbedSpecs && (
              <div className="flex items-center p-1 bg-zinc-100 rounded-xl overflow-x-auto">
                {[
                  { id: "core" as SpecTab, label: "Core", icon: Cpu },
                  { id: "battery" as SpecTab, label: "Power", icon: BatteryCharging },
                  { id: "connectivity" as SpecTab, label: "Connectivity", icon: Radio },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSpecTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeSpecTab === tab.id ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-black"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeChildVariant && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider">Active architecture:</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  {activeChildVariant.specOverride || activeChildVariant.color}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{activeGroup?.name || "Standard edition"}</span>
            </div>
          )}

          {product.tabbedSpecs ? (
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {product.tabbedSpecs[activeSpecTab]?.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-600 sm:w-1/3">{row.label}</span>
                  <div className="sm:w-2/3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-zinc-900">{row.value}</span>
                    {row.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {specEntries.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    row.isOverride ? "bg-amber-50/40" : index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-600 sm:w-1/3 flex items-center gap-2">
                    {row.label}
                    {row.isOverride && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300/80">
                        OVERRIDE
                      </span>
                    )}
                  </span>
                  <span className="sm:w-2/3 text-xs font-semibold text-zinc-900 font-mono">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="reviews" className="py-16 sm:py-24 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                VERIFIED COMMUNITY ACOUSTICS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Customer experiences & material reviews
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              {reviews.length > 0 ? (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-zinc-900">{averageRating.toFixed(1)} / 5.0</span>
                  <span>({reviews.length} verified reviews)</span>
                </>
              ) : (
                <span className="text-zinc-400">Awaiting first verified review</span>
              )}
            </div>
          </div>

          {isLoadingReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 rounded-3xl bg-zinc-100 skeleton-shimmer" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl bg-white border border-[#EAEAE5] p-8 text-center space-y-2">
              <p className="text-xs font-semibold text-zinc-900">No verified reviews yet</p>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                Owner photographs and listening notes will appear here after the first verified purchase is reviewed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map((review, index) => (
                <div key={`${review.id || review.reviewId || index}-${index}`} className="rounded-3xl bg-white border border-[#EAEAE5] p-6 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`w-3.5 h-3.5 ${
                              starIndex < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pt-1">
                        {review.images.map((image, imageIndex) => (
                          <div key={`${image}-${imageIndex}`} className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                            <Image src={image} alt={`Review photo ${imageIndex + 1}`} fill className="object-cover" sizes="56px" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-zinc-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[10px] flex items-center justify-center">
                      {review.initials || review.userInitials || "VB"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 truncate">{review.author || review.userName}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{review.role || "Verified owner"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ReviewImageMasonry
            items={reviewPhotos}
            fallbackItems={fallbackPhotos}
            title={reviewPhotos.length > 0 ? "Verified community frames" : "Concept community frames"}
            description={
              reviewPhotos.length > 0
                ? "Raw frames submitted by verified owners. Select any image to inspect it."
                : "Owner uploads will populate this wall. Until then, an illustrative set of material and lifestyle frames introduces the collection."
            }
          />
        </div>
      </section>

      <RelatedProductsRail products={relatedProducts} />

      <section className="py-12 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: "Complimentary delivery", text: "Free standard shipping on every order." },
            { icon: RotateCcw, title: `${product.returnDays || 30} days to decide`, text: "Listen at home. Easy returns within the trial window." },
            { icon: ShieldCheck, title: `${product.warrantyYears || 2}-year warranty`, text: "Support that stays with you, long after unboxing." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900">{item.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CartDrawer />
      <Footer />
    </div>
  );
}
