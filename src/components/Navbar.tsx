"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  stock?: number;
  lastRevalidatedAt?: string;
  onRevalidateClick?: () => void;
  isRevalidating?: boolean;
}

export function Navbar({}: NavbarProps = {}) {
  const { totalItemsCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#F0F0EB] transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-18 flex items-center justify-between">
        {/* Left: Brand Logo & Product Tag matching Figma */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-[3px]">
              <span className="w-[3px] h-3.5 bg-blue-600 rounded-full"></span>
              <span className="w-[3px] h-5 bg-blue-600 rounded-full"></span>
              <span className="w-[3px] h-3.5 bg-blue-600 rounded-full"></span>
            </div>
            <span className="text-xl font-bold tracking-tight text-black font-sans lowercase">
              ancwave
            </span>
          </Link>
          <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider">
            / FORM 01
          </span>
        </div>

        {/* Center: Navigation Links matching Figma (Features, Specs, Reviews) */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-zinc-600">
          <a
            href="#features"
            className="hover:text-black transition-colors"
          >
            Features
          </a>
          <a
            href="#specs"
            className="hover:text-black transition-colors"
          >
            Specs
          </a>
          <a
            href="#reviews"
            className="hover:text-black transition-colors"
          >
            Reviews
          </a>
        </nav>

        {/* Right: Buy Now CTA & Shopping Bag Icon matching Figma */}
        <div className="flex items-center gap-4">
          <a
            href="#checkout"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            Buy Now — $349
          </a>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg hover:bg-zinc-100 text-zinc-900 transition-colors flex items-center justify-center"
            aria-label="View Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.6]" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
