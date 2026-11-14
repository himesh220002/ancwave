"use client";

import React from "react";
import Link from "next/link";
import { Star, Truck, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

// ==========================================
// Base Atomic Skeleton Component
// ==========================================
export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

// ==========================================
// 1. Navigation Bar Skeleton (Renders Real Persistent Navbar)
// ==========================================
export function NavbarSkeleton({ subtitle }: { subtitle?: string } = {}) {
  // Always render the actual interactive Navbar so navigation never shifts or flickers
  return <Navbar subtitle={subtitle || "/ AUDIO LINEUP"} />;
}

// ==========================================
// 2. Hero Section Skeleton (Home Page)
// ==========================================
export function HeroSectionSkeleton() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Real Static Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-[0.2em] text-blue-600 font-semibold uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                NEW RELEASE · 2026 EDITION
              </span>
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.05]">
                Less noise.<br />More you.
              </h1>
              <p className="text-sm sm:text-base text-zinc-500 max-w-xl leading-relaxed pt-2">
                Form 01 introduces custom 40mm beryllium drivers, dual-chamber active noise cancellation, and continuous 40-hour acoustic playback.
              </p>
            </div>

            {/* Real CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="px-8 py-3.5 rounded-2xl bg-zinc-950 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                Add to Bag
              </div>
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-2xl bg-white border border-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center hover:bg-zinc-50 transition"
              >
                Explore Catalog
              </Link>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>30-Day In-Home Trial · 2-Year Official Hardware Warranty</span>
            </div>
          </div>

          {/* Right Column: Hero Studio Showcase with Shimmer Image */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-[#F0EFEA] border border-[#E8E7E2] overflow-hidden shadow-xs">
              <div className="relative w-full aspect-4/3 bg-[#F0EFEA] skeleton-shimmer overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-700 uppercase bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-md shadow-2xs">
                    DESIGNED TO DISAPPEAR.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 3. Product Catalog Card Skeleton
// ==========================================
export function ProductCardSkeleton() {
  return (
    <div className="group flex flex-col rounded-2xl bg-white border border-[#EAEAE5] overflow-hidden shadow-xs">
      {/* Top Media Image Container - Pure rectangle per user specification */}
      <div className="relative aspect-4/3 bg-[#F0EFEA] skeleton-shimmer overflow-hidden">
        {/* Top Badge placeholder */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <Skeleton className="w-20 h-5 rounded-md" />
        </div>
        {/* Rating placeholder */}
        <div className="absolute bottom-4 right-4">
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-3.5">
          {/* Category subtitle */}
          <div className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
            AUDIO PLATFORM
          </div>

          {/* Dynamic Product Name & Price */}
          <div className="space-y-1.5">
            <Skeleton className="w-4/5 h-6 rounded-md" />
            <Skeleton className="w-24 h-5 rounded-md" />
          </div>

          {/* 3 Technical Specs Strip */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">SPECS</span>
              <Skeleton className="w-12 h-3.5 rounded" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">WEIGHT</span>
              <Skeleton className="w-12 h-3.5 rounded" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">DRIVERS</span>
              <Skeleton className="w-12 h-3.5 rounded" />
            </div>
          </div>

          {/* Standout feature */}
          <div className="space-y-1">
            <Skeleton className="w-full h-3 rounded" />
            <Skeleton className="w-2/3 h-3 rounded" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <div className="flex-1 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-xs font-semibold text-white/70">
            Add to bag +
          </div>
          <div className="w-24 h-10 rounded-xl border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-400">
            Details
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Products Catalog Page Skeleton
// ==========================================
export function CatalogPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real Persistent Navbar */}
      <Navbar subtitle="/ PRODUCT CATALOG" />

      {/* Hero Header Section - Real Static Text */}
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
              <Skeleton className="w-12 h-10 rounded-md" />
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 leading-snug">
                <span className="block font-semibold text-zinc-600">HARDWARE PLATFORMS</span>
                <span className="block">CONNECTING...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Filter Tabs Bar */}
      <section className="sticky top-16 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EAEAE5] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {["All audio", "Over-ear", "True wireless", "In-ear sports"].map((label, idx) => (
              <div
                key={label}
                className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  idx === 0
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white text-zinc-600 border border-zinc-200"
                }`}
              >
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-zinc-400 font-medium hidden xs:inline">
            Connecting to inventory...
          </div>
        </div>
      </section>

      {/* Catalog Inventory Meta Strip */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-8 flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Connecting to ancwave inventory...</span>
        </span>
        <span className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
          Syncing...
        </span>
      </div>

      {/* Product Grid with Skeletons */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 5. Product Detail View Skeleton (/products/[slug])
// ==========================================
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real Persistent Navbar */}
      <Navbar subtitle="/ AUDIO PLATFORM" />

      {/* Real Breadcrumbs */}
      <div className="border-b border-[#EAEAE5] bg-white/70 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <Link href="/" className="hover:text-zinc-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-zinc-700 transition-colors">
            Audio
          </Link>
          <span>/</span>
          <span className="text-zinc-800">Product Studio</span>
        </div>
      </div>

      {/* Main 2-Column Product Studio */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Image Canvas & Thumbnails (Pure Rectangle, No Rounded Corners) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-4/3 rounded-none bg-[#F0EFEA] border border-zinc-200/90 overflow-hidden skeleton-shimmer flex items-center justify-center shadow-2xs">
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-none bg-black/80 text-[10px] font-mono tracking-widest text-white uppercase font-semibold">
                STUDIO RENDER
              </div>
            </div>

            {/* Thumbnails - Pure Rectangles */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-none bg-[#F0EFEA] border border-zinc-200/90 overflow-hidden skeleton-shimmer"
                />
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Info & Buy Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-[0.18em] text-blue-600 uppercase font-semibold">
                AUDIO / ACOUSTIC PLATFORM
              </span>
              <Skeleton className="w-4/5 h-9 sm:h-11 rounded-md" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-5/6 h-4 rounded" />
              </div>
            </div>

            {/* Price Tag Skeleton */}
            <div className="py-2 flex items-center gap-4">
              <Skeleton className="w-32 h-9 rounded-md" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>

            {/* Color Swatch Options Outline */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-100">
              <span className="text-xs font-semibold text-zinc-900 block">Finish:</span>
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="w-full h-12 rounded-xl bg-blue-600/30 flex items-center justify-center text-xs font-semibold text-white/70">
                Add to Bag
              </div>
              <div className="w-full h-12 rounded-xl border border-zinc-300 flex items-center justify-center text-xs font-semibold text-zinc-400">
                Buy Now
              </div>
            </div>

            {/* Delivery Assurance */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE5] space-y-3 text-xs text-zinc-600">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Free Insured Express Delivery · Dispatched within 24 hours</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>2-Year Official Hardware Warranty & 30-Day Home Trial</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 6. Checkout Page Skeleton (/checkout)
// ==========================================
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real Checkout Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Back to Store</span>
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-[3px]">
                <span className="w-[3px] h-3 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-4 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-3 bg-blue-600 rounded-full"></span>
              </div>
              <span className="font-bold text-sm tracking-tight text-black lowercase">
                ancwave
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Checkout Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Real form section structure */}
          <div className="lg:col-span-7 space-y-8">
            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Express Checkout
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-500">
                  Razorpay Express
                </div>
                <div className="h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-500">
                  UPI / Instant
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Shipping Address
                </h2>
                <span className="text-xs text-zinc-400">Step 1 of 2</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                  <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                </div>
                <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                  <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                  <div className="h-12 rounded-xl bg-zinc-50 border border-zinc-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sticky Card with Skeletons */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl bg-white border border-[#EAEAE5] space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 border-b border-zinc-100 pb-5">
                {[1].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#F0EFEA] skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-3/4 h-4 rounded" />
                      <Skeleton className="w-1/2 h-3 rounded" />
                    </div>
                    <Skeleton className="w-16 h-4 rounded" />
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 border-t border-zinc-100 pt-5">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Subtotal</span>
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-zinc-100 font-bold text-sm text-zinc-900">
                  <span>Total</span>
                  <Skeleton className="w-20 h-5 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 7. Order Card & Orders Page Skeleton (/orders)
// ==========================================
export function OrderCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header: Dynamic Order ID, Date, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-36 h-6 rounded-md" />
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
          <Skeleton className="w-48 h-3.5 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-xs text-zinc-400 font-medium">
            Invoice PDF
          </div>
          <div className="w-28 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-xs text-zinc-400 font-medium">
            Receipt
          </div>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="py-2">
        <div className="grid grid-cols-4 gap-2">
          {["Placed", "Processed", "Shipped", "Delivered"].map((step, i) => (
            <div key={i} className="space-y-2 text-center">
              <Skeleton className="h-1.5 rounded-full w-full" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items in this order - with rectangular image shimmer */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#F0EFEA] skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/2 h-4 rounded" />
            <Skeleton className="w-1/4 h-3 rounded" />
          </div>
          <Skeleton className="w-16 h-4 rounded" />
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <Skeleton className="w-48 h-4 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
      </div>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] selection:bg-blue-600 selection:text-white">
      {/* Real Persistent Navbar */}
      <Navbar subtitle="/ MY ORDERS" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-10 sm:space-y-12">
        {/* Real Static Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.18em] text-zinc-500 uppercase">
              01 / YOUR PURCHASES & FULFILLMENT
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111111]">
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl font-normal leading-relaxed mt-2">
                Review your purchased audio instruments, download official tax invoices in PDF, and inspect verified Razorpay payment receipts.
              </p>
            </div>

            <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-white text-zinc-900 font-semibold shadow-2xs">
                All Platform Orders
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Orders List Skeletons */}
        <div className="space-y-6">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 8. Review Card Skeleton
// ==========================================
export function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-[#EAEAE5] p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="w-2/3 h-5 rounded-md" />
        <Skeleton className="w-full h-3.5 rounded" />
        <Skeleton className="w-4/5 h-3.5 rounded" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="w-14 h-14 rounded-xl bg-[#F0EFEA] skeleton-shimmer" />
        <div className="w-14 h-14 rounded-xl bg-[#F0EFEA] skeleton-shimmer" />
      </div>
    </div>
  );
}

// ==========================================
// 9. Root / Home Page Skeleton
// ==========================================
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real Persistent Navbar */}
      <Navbar />
      <HeroSectionSkeleton />
    </div>
  );
}
