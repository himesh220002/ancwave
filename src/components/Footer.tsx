import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white text-zinc-900 py-16 border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          {/* Brand & Description */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-[3px]">
                <span className="w-[3px] h-3.5 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-5 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-3.5 bg-blue-600 rounded-full"></span>
              </div>
              <span className="text-xl font-bold tracking-tight text-black font-sans lowercase">
                ancwave
              </span>
              <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider">
                / FORM 01
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Precision audio instruments crafted from honest materials. Designed in Scandinavia, engineered for a lifetime of listening.
            </p>
          </div>

          {/* Clean Navigation Links */}
          <div className="flex items-center gap-8 text-xs text-zinc-600 font-medium">
            <a href="#features" className="hover:text-black transition-colors">
              Features
            </a>
            <a href="#specs" className="hover:text-black transition-colors">
              Specs
            </a>
            <a href="#reviews" className="hover:text-black transition-colors">
              Reviews
            </a>
            <a href="#checkout" className="hover:text-black transition-colors">
              Order Form 01
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#F0F0EB] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <div>
            © 2026 ancwave Acoustics Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span className="hover:text-zinc-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-600 cursor-pointer">2-Year Warranty</span>
            <span className="hover:text-zinc-600 cursor-pointer">30-Day Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
