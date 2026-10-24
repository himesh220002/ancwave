"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductData } from "@/types";

interface SpecsSectionProps {
  product: ProductData;
}

export function SpecsSection({ product }: SpecsSectionProps) {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const specs = product.specs;

  const specRows = [
    {
      label: "Dimensions",
      value: unitSystem === "metric" ? "190 × 175 × 80 mm" : "7.5 × 6.9 × 3.1 in",
    },
    {
      label: "Weight",
      value: unitSystem === "metric" ? "256 g" : "9.0 oz",
    },
    {
      label: "Battery life",
      value: "Up to 40 hours · ANC on",
    },
    {
      label: "Charging",
      value: "USB-C · 2 h full / 10 min for 5 h",
    },
    {
      label: "Driver",
      value: "40 mm dynamic · 20 Hz–20 kHz",
    },
    {
      label: "Noise control",
      value: "Adaptive ANC + transparency · 8 mics",
    },
    {
      label: "Connectivity",
      value: "Bluetooth 5.3 · multipoint · 3.5 mm",
    },
    {
      label: "Codecs",
      value: "AAC / SBC",
    },
    {
      label: "Materials",
      value: "Aluminum · woven textile · memory foam",
    },
  ];

  return (
    <section id="specs" className="py-20 md:py-24 bg-gray-50 border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-12">
        {/* Section Header with Metric/Imperial Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                02 / UNDER THE SURFACE
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-tight break-words">
              Good form. <br />
              Better engineering.
            </h2>
          </div>

          {/* Metric / Imperial Toggle matching Figma Screenshot 3 */}
          <div className="flex items-center p-0.5 rounded-full bg-[#EAEAE5] self-start sm:self-auto text-xs">
            <button
              onClick={() => setUnitSystem("metric")}
              className={`px-4 py-1 rounded-full font-medium transition-all ${unitSystem === "metric"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-black"
                }`}
            >
              Metric
            </button>
            <button
              onClick={() => setUnitSystem("imperial")}
              className={`px-4 py-1 rounded-full font-medium transition-all ${unitSystem === "imperial"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-black"
                }`}
            >
              Imperial
            </button>
          </div>
        </div>

        {/* 2-Column Specs Layout matching Figma Screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Exploded Acoustic Assembly Card */}
          <div className="lg:col-span-6 space-y-3">
            {/* <div className="relative rounded-2xl bg-[#F0EFEA] p-6 sm:p-8 border border-[#EAEAE5]"> */}


            <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden border border-[#E8E7E2] bg-[#ECECE7] shadow-xs">
              <div className="absolute top-4 left-4 sm:top-5 sm:left-6 text-[10px] font-mono tracking-[0.18em] text-zinc-700 uppercase z-20 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-md shadow-2xs">
                FORM 01 / ACOUSTIC ASSEMBLY
              </div>
              <Image
                src="/images/exploded-assembly.jpg"
                alt="Form 01 exploded acoustic assembly diagram"
                fill
                className="object-cover z-10"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Labels below */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 px-1">
              <div><span className="text-zinc-400">01</span> Aluminum shell</div>
              <div><span className="text-zinc-400">02</span> Dynamic driver</div>
              <div><span className="text-zinc-400">03</span> Memory foam</div>
            </div>
          </div>

          {/* Right: Spec Table matching Screenshot 3 */}
          <div className="lg:col-span-6 space-y-6">
            <div className="divide-y divide-[#EAEAE5] border-t border-b border-[#EAEAE5]">
              {specRows.map((row, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col xs:flex-row xs:items-center justify-between text-xs sm:text-[13px] gap-1 xs:gap-4"
                >
                  <span className="text-zinc-500 font-normal shrink-0">{row.label}</span>
                  <span className="font-medium text-[#111111] xs:text-right break-words">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              In the box: Form 01, travel case, USB-C charging cable, 3.5 mm cable. Battery estimates vary with volume and use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
