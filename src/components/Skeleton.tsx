"use client";

import React from "react";

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
// 1. Navigation Bar Skeleton
// ==========================================
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-[#EAEAE5] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-5 rounded-md" />
            <Skeleton className="hidden sm:inline-block w-20 h-3 rounded" />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
        </nav>

        {/* Right Action Icons (Edge Sync + Cart + Auth) */}
        <div className="flex items-center gap-3">
          <Skeleton className="hidden sm:block w-28 h-7 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}

// ==========================================
// 2. Hero Section Skeleton (Home Page)
// ==========================================
export function HeroSectionSkeleton() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Product Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tag Pill */}
            <div className="flex items-center gap-3">
              <Skeleton className="w-32 h-6 rounded-full" />
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>

            {/* Giant Title */}
            <div className="space-y-3">
              <Skeleton className="w-full max-w-lg h-12 sm:h-14 rounded-2xl" />
              <Skeleton className="w-4/5 max-w-md h-12 sm:h-14 rounded-2xl" />
            </div>

            {/* Subheading */}
            <div className="space-y-2 max-w-xl">
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-11/12 h-4 rounded" />
              <Skeleton className="w-3/4 h-4 rounded" />
            </div>

            {/* Color Swatches */}
            <div className="pt-2 space-y-2.5">
              <Skeleton className="w-28 h-3 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>

            {/* Spec Chips Row */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Skeleton className="w-28 h-8 rounded-full" />
              <Skeleton className="w-24 h-8 rounded-full" />
              <Skeleton className="w-32 h-8 rounded-full" />
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Skeleton className="w-full sm:w-48 h-13 rounded-2xl" />
              <Skeleton className="w-full sm:w-36 h-13 rounded-2xl" />
            </div>

            {/* Trust badge */}
            <div className="pt-2 flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-64 h-3 rounded" />
            </div>
          </div>

          {/* Right Column: Hero Visual Studio Showcase */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#EAEAE5] bg-white p-8 sm:p-12 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="w-24 h-4 rounded-md" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full aspect-square max-h-[380px] rounded-2xl" />
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
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
    <div className="rounded-3xl bg-white border border-[#EAEAE5] p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs">
      {/* Top Meta: Category + Compare */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-4 rounded-full" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>

      {/* Product Image Canvas */}
      <div className="relative w-full aspect-square max-h-64 rounded-2xl overflow-hidden bg-zinc-50 flex items-center justify-center p-6">
        <Skeleton className="w-4/5 h-4/5 rounded-2xl" />
      </div>

      {/* Colors & Stock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
        <Skeleton className="w-20 h-3 rounded" />
      </div>

      {/* Title & Tagline */}
      <div className="space-y-2">
        <Skeleton className="w-4/5 h-6 rounded-lg" />
        <Skeleton className="w-full h-3.5 rounded" />
        <Skeleton className="w-2/3 h-3.5 rounded" />
      </div>

      {/* Key Specs Pills */}
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-20 h-5 rounded-full" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>

      {/* Price & Action Row */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <NavbarSkeleton />

      {/* Catalog Hero Banner */}
      <section className="bg-white border-b border-[#EAEAE5] pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-3 rounded" />
            <span className="text-zinc-300">&gt;</span>
            <Skeleton className="w-24 h-3 rounded" />
          </div>
          <Skeleton className="w-48 h-4 rounded-full" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-1">
            <div className="space-y-3 max-w-2xl w-full">
              <Skeleton className="w-3/4 h-10 sm:h-12 rounded-2xl" />
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-5/6 h-4 rounded" />
            </div>
            <Skeleton className="w-32 h-14 rounded-2xl shrink-0" />
          </div>
        </div>
      </section>

      {/* Filter Tabs Bar */}
      <section className="sticky top-16 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EAEAE5] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <Skeleton className="w-24 h-8 rounded-full" />
            <Skeleton className="w-24 h-8 rounded-full" />
            <Skeleton className="w-28 h-8 rounded-full" />
            <Skeleton className="w-24 h-8 rounded-full" />
          </div>
          <Skeleton className="w-44 h-9 rounded-xl" />
        </div>
      </section>

      {/* Grid Count Strip */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-8 flex items-center justify-between">
        <Skeleton className="w-48 h-4 rounded" />
        <Skeleton className="w-36 h-4 rounded-full" />
      </div>

      {/* Product Grid */}
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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <NavbarSkeleton />

      {/* Breadcrumbs */}
      <div className="border-b border-[#EAEAE5] bg-white/70 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-2">
          <Skeleton className="w-12 h-3 rounded" />
          <span className="text-zinc-300">/</span>
          <Skeleton className="w-24 h-3 rounded" />
          <span className="text-zinc-300">/</span>
          <Skeleton className="w-20 h-3 rounded" />
          <span className="text-zinc-300">/</span>
          <Skeleton className="w-32 h-3 rounded" />
        </div>
      </div>

      {/* Main 2-Column Product Studio */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-square max-h-[520px] rounded-3xl bg-white border border-[#EAEAE5] p-8 flex items-center justify-center">
              <Skeleton className="w-4/5 h-4/5 rounded-2xl" />
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-square rounded-2xl border border-[#EAEAE5]"
                />
              ))}
            </div>
          </div>

          {/* Right Column: Buy Box & Options */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <Skeleton className="w-28 h-5 rounded-full" />
              <Skeleton className="w-full h-8 sm:h-10 rounded-xl" />
              <Skeleton className="w-3/4 h-5 rounded" />
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-3">
              <Skeleton className="w-28 h-5 rounded-md" />
              <Skeleton className="w-24 h-5 rounded-full" />
            </div>

            {/* Price Tag */}
            <div className="py-2">
              <Skeleton className="w-36 h-10 rounded-xl" />
            </div>

            {/* Color Swatch Options */}
            <div className="space-y-2.5 pt-2">
              <Skeleton className="w-24 h-3 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="w-9 h-9 rounded-full" />
              </div>
            </div>

            {/* Hardware Variant Selection */}
            <div className="space-y-2.5 pt-2">
              <Skeleton className="w-32 h-3 rounded" />
              <div className="grid grid-cols-2 gap-2.5">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Skeleton className="w-full h-14 rounded-2xl" />
              <Skeleton className="w-full h-12 rounded-2xl" />
            </div>

            {/* Delivery & Assurance Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE5] space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-48 h-4 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-40 h-4 rounded" />
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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      {/* Checkout Minimal Header */}
      <header className="sticky top-0 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <Skeleton className="w-32 h-6 rounded-md" />
          <Skeleton className="w-48 h-6 rounded-full" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
      </header>

      {/* Main 2-Column Checkout Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Customer Info, Shipping & Payment */}
          <div className="lg:col-span-7 space-y-8">
            {/* Express Section */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-4">
              <Skeleton className="w-36 h-4 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            </div>

            {/* Delivery Address Form */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-5">
              <div className="flex items-center justify-between">
                <Skeleton className="w-40 h-6 rounded-md" />
                <Skeleton className="w-28 h-4 rounded" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
                <Skeleton className="h-12 rounded-xl" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-4">
              <Skeleton className="w-36 h-5 rounded-md" />
              <div className="space-y-3">
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
              </div>
            </div>

            {/* Payment Section */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAEAE5] space-y-4">
              <Skeleton className="w-32 h-5 rounded-md" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-2xl" />
            </div>
          </div>

          {/* Right: Order Summary Sticky Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl bg-white border border-[#EAEAE5] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="w-32 h-5 rounded-md" />
                <Skeleton className="w-16 h-4 rounded" />
              </div>

              {/* Items */}
              <div className="space-y-4 border-b border-zinc-100 pb-5">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-3/4 h-4 rounded" />
                      <Skeleton className="w-1/2 h-3 rounded" />
                    </div>
                    <Skeleton className="w-16 h-4 rounded" />
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-11 rounded-xl" />
                <Skeleton className="w-20 h-11 rounded-xl" />
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 border-t border-zinc-100 pt-5">
                <div className="flex justify-between">
                  <Skeleton className="w-20 h-3 rounded" />
                  <Skeleton className="w-16 h-3 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="w-20 h-3 rounded" />
                  <Skeleton className="w-14 h-3 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="w-16 h-3 rounded" />
                  <Skeleton className="w-12 h-3 rounded" />
                </div>
                <div className="flex justify-between pt-3 border-t border-zinc-100">
                  <Skeleton className="w-24 h-6 rounded-md" />
                  <Skeleton className="w-24 h-6 rounded-md" />
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
      {/* Header: Order ID, Date, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton className="w-48 h-3.5 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-28 h-8 rounded-xl" />
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="py-2">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 text-center">
              <Skeleton className="h-2 rounded-full w-full" />
              <Skeleton className="h-3 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Items in this order */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/2 h-4 rounded" />
            <Skeleton className="w-1/4 h-3 rounded" />
          </div>
          <Skeleton className="w-16 h-4 rounded" />
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="w-48 h-4 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
      </div>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <NavbarSkeleton />

      {/* Header */}
      <section className="bg-white border-b border-[#EAEAE5] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-4">
          <Skeleton className="w-32 h-4 rounded-full" />
          <div className="space-y-2 max-w-2xl">
            <Skeleton className="w-3/4 h-10 rounded-2xl" />
            <Skeleton className="w-full h-4 rounded" />
          </div>
          {/* Search Inputs */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <Skeleton className="h-12 rounded-xl sm:col-span-2" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </section>

      {/* List */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </main>
    </div>
  );
}

// ==========================================
// 8. Review Card Skeleton
// ==========================================
export function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-[#EAEAE5] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-24 h-4 rounded-md" />
      </div>

      <div className="space-y-2">
        <Skeleton className="w-2/3 h-5 rounded-md" />
        <Skeleton className="w-full h-3.5 rounded" />
        <Skeleton className="w-full h-3.5 rounded" />
        <Skeleton className="w-4/5 h-3.5 rounded" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <Skeleton className="w-14 h-14 rounded-xl" />
      </div>
    </div>
  );
}

// ==========================================
// 9. Root / Home Page Skeleton
// ==========================================
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <NavbarSkeleton />
      <HeroSectionSkeleton />

      {/* Features preview skeleton */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <Skeleton className="w-28 h-4 rounded-full mx-auto" />
            <Skeleton className="w-3/4 h-8 rounded-xl mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-[#EAEAE5] p-8 space-y-4"
              >
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-2/3 h-6 rounded-lg" />
                <Skeleton className="w-full h-3.5 rounded" />
                <Skeleton className="w-4/5 h-3.5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
