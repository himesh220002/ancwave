"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#181B18] text-white py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Top Row: Brand + Tagline & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-[#292D2A]">
          {/* Brand + Tagline */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans lowercase">
              ancwave
            </span>
            <span className="text-xs sm:text-sm text-zinc-400 font-normal">
              A little less world. A little more you.
            </span>
          </div>

          {/* Clean Right Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs text-zinc-300 font-medium">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Instagram <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a href="#specs" className="hover:text-white transition-colors">
              Product care
            </a>
            <span className="hover:text-white transition-colors cursor-pointer">
              Privacy
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Terms
            </span>
          </div>
        </div>

        {/* Bottom Metadata & Back to Top */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div className="text-zinc-400">
            © 2026 ancwave Audio. A product design concept.
          </div>
          <div className="text-zinc-500 text-center text-[11px]">
            All product claims, reviews and community imagery are illustrative.
          </div>
          <button
            onClick={scrollToTop}
            className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

