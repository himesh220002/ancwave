import React from "react";
import Link from "next/link";
import { ArrowLeft, Cloud } from "lucide-react";

export default function AWSArchitectureLoading() {
  return (
    <div className="min-h-screen bg-[#0C0D0F] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Real Dark Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to ancwave Store</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              <h1 className="text-base font-bold text-white tracking-tight">
                AWS Enterprise Architecture Hub
              </h1>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-mono">
                12-Year Senior Staff Blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connecting...
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-8 w-full flex-1">
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-blue-400">
            SYSTEM TELEMETRY & EDGE OBSERVE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Architecture Topology & Cloud Monitoring
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Synchronizing live infrastructure metrics with AWS CloudWatch, EventBridge bus, and CloudFront edge points of presence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900 border border-zinc-800/80 skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
