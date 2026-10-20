"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ArrowUpRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  stock?: number;
  lastRevalidatedAt?: string;
  onRevalidateClick?: () => void;
  isRevalidating?: boolean;
}

export function Navbar({}: NavbarProps = {}) {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#F0F0EB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-18 flex items-center justify-between">
        {/* Left: Brand Logo & Product Tag */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-[3px]">
              <span className="w-[3px] h-3 sm:h-3.5 bg-blue-600 rounded-full"></span>
              <span className="w-[3px] h-4.5 sm:h-5 bg-blue-600 rounded-full"></span>
              <span className="w-[3px] h-3 sm:h-3.5 bg-blue-600 rounded-full"></span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-black font-sans lowercase">
              ancwave
            </span>
          </Link>
          <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-400 tracking-wider hidden xs:inline truncate">
            / FORM 01
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Desktop Buy Button */}
          <Link
            href="/checkout"
            className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            Buy Now — $349
          </Link>

          {/* Bag Icon */}
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

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[2]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white/98 backdrop-blur-lg px-6 py-6 space-y-5 animate-in slide-in-from-top-3 duration-200 shadow-xl">
          <nav className="flex flex-col space-y-4 text-base font-semibold text-zinc-800">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Features</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Acoustic Architecture</span>
            </a>
            <a
              href="#specs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Specs</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Technical Matrix</span>
            </a>
            <a
              href="#reviews"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Reviews</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Verified Acoustics</span>
            </a>
          </nav>

          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <Link
              href="/checkout"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Buy Now — $349.00</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
            </Link>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
              <span>MODEL 01 / OVER-EAR</span>
              <span>FREE WORLDWIDE SHIPPING</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
