"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  Grid,
  User,
  Crown,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

interface NavbarProps {
  subtitle?: string;
  stock?: number;
  lastRevalidatedAt?: string;
  onRevalidateClick?: () => void;
  isRevalidating?: boolean;
}

export function Navbar({ subtitle = "/ AUDIO LINEUP" }: NavbarProps = {}) {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { user, isAdmin, isOwner, setIsAuthModalOpen, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            {subtitle}
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-zinc-600">
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Audio Catalog</span>
          </Link>
          <a
            href="/#features"
            className="hover:text-black transition-colors"
          >
            Features
          </a>
          <a
            href="/#specs"
            className="hover:text-black transition-colors"
          >
            Specs
          </a>
          <a
            href="/#reviews"
            className="hover:text-black transition-colors"
          >
            Reviews
          </a>
          <Link
            href="/orders"
            className="hover:text-black transition-colors"
          >
            Orders
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Lineup / Buy Button */}
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            Explore Catalog
          </Link>

          {/* User Account Button & Dropdown */}
          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-700 hover:text-black transition-colors text-xs font-semibold"
              aria-label="Sign In or Register"
              title="Sign In / Register"
            >
              <User className="w-4 h-4 stroke-[2]" />
              <span className="hidden lg:inline">Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 transition-all text-xs font-medium text-zinc-800 shadow-2xs"
                aria-label="User Account Menu"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                    isOwner ? "bg-amber-600" : isAdmin ? "bg-blue-600" : "bg-zinc-900"
                  }`}
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden lg:inline max-w-[90px] truncate">
                  {user.name.split(" ")[0]}
                </span>
                {isOwner ? (
                  <Crown className="w-3.5 h-3.5 text-amber-600 hidden sm:inline" />
                ) : isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 hidden sm:inline" />
                ) : null}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Account Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-zinc-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="px-3 py-2.5 border-b border-zinc-100">
                    <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isOwner
                            ? "bg-amber-100 text-amber-900"
                            : isAdmin
                            ? "bg-blue-100 text-blue-900"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        Role: {user.role}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Operations Console</span>
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>My Orders</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                      toast({
                        type: "info",
                        title: "Signed Out",
                        description: "You have been logged out.",
                      });
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

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
          {/* Mobile User Profile Header */}
          {!user ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          ) : (
            <div className="p-3 bg-zinc-50 rounded-xl space-y-2 text-xs border border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900">{user.name}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{user.email}</p>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isOwner
                      ? "bg-amber-100 text-amber-900"
                      : isAdmin
                      ? "bg-blue-100 text-blue-900"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-blue-600 font-semibold pt-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Go to Admin Console</span>
                </Link>
              )}
              <button
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await logout();
                }}
                className="text-red-600 font-medium text-xs flex items-center gap-1 pt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <nav className="flex flex-col space-y-4 text-base font-semibold text-zinc-800">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                <span>All Audio Products</span>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-normal">
                3 Models
              </span>
            </Link>
            <a
              href="/#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Features</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Acoustic Architecture</span>
            </a>
            <a
              href="/#specs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Specs</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Technical Matrix</span>
            </a>
            <a
              href="/#reviews"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Reviews</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">Verified Acoustics</span>
            </a>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>My Orders</span>
              </div>
              <span className="text-xs font-mono text-blue-600 font-normal">History & Bills</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Explore Audio Catalog</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
            </Link>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
              <span>OVER-EAR · TWS · SPORTS IEM</span>
              <span>FREE WORLDWIDE SHIPPING</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
