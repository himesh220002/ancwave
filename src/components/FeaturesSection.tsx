import React from "react";
import Image from "next/image";

export function FeaturesSection() {

  return (
    <section id="features" className="py-20 md:py-24 bg-white border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              01 / FEEL THE DIFFERENCE
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-tight break-words">
              Nothing extra. <br />
              Everything considered.
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#555555] max-w-sm font-normal leading-relaxed md:text-right break-words">
              Precision where it matters. Softness where it counts. Built around the way you listen.
            </p>
          </div>
        </div>

        {/* 3 Material Cards matching Figma Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Aluminum */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#ECECE7]">
              <Image
                src="/images/feature-aluminum.jpg"
                alt="Form 01 anodized aluminum"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase block">
                01 / ANODIZED ALUMINUM
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[#111111]">
                Honest materials. Lasting form.
              </h3>
              <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed">
                Cool-to-the-touch aluminum meets a softly woven headband. Every curve is considered, every finish made to feel as good as it looks.
              </p>
            </div>
          </div>

          {/* Card 2: Slow-Recovery Foam */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#ECECE7]">
              <Image
                src="/images/feature-foam.jpg"
                alt="Form 01 slow-recovery foam"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase block">
                02 / SLOW-RECOVERY FOAM
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[#111111]">
                Stay a little longer.
              </h3>
              <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed">
                Supple, replaceable cushions gently find your fit. At just 256 g, Form 01 makes a whole album feel like a very good idea.
              </p>
            </div>
          </div>

          {/* Card 3: Adaptive Voice Control */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#ECECE7]">
              <Image
                src="/images/feature-dial.jpg"
                alt="Form 01 tactile dial"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase block">
                03 / ADAPTIVE VOICE CONTROL
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[#111111]">
                Your world. On your terms.
              </h3>
              <p className="text-xs sm:text-[13px] text-[#555555] leading-relaxed">
                Adaptive noise cancellation makes space for the details. Turn the tactile dial to bring the outside back in, without missing a beat.
              </p>
            </div>
          </div>
        </div>

        {/* Acoustic Soundwave Banner matching Reference Picture */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#202422] border border-[#2B302D] text-white p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
            {/* Left Column: Eyebrow + Headline */}
            <div className="md:col-span-4 space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase block">
                40 MM / CUSTOM DYNAMIC DRIVER
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Closer to the original.
              </h3>
            </div>

            {/* Center Column: Smooth Acoustic Wavy Pattern matching Picture */}
            <div className="md:col-span-4 flex items-center justify-center py-2 sm:py-0">
              <svg
                viewBox="0 0 320 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full max-w-[280px] sm:max-w-[320px] h-12 stroke-[#A2A7A3] stroke-[1.25]"
              >
                <path
                  d="M 0 30 L 40 30 C 44.6 30.0, 46.3 29.6, 50.9 29.6 C 55.5 29.6, 57.2 30.8, 61.8 30.8 C 66.4 30.8, 68.1 28.3, 72.7 28.3 C 77.3 28.3, 79.1 33.2, 83.6 33.2 C 88.2 33.2, 90.0 24.4, 94.5 24.4 C 99.1 24.4, 100.9 38.9, 105.5 38.9 C 110.0 38.9, 111.8 16.9, 116.4 16.9 C 120.9 16.9, 122.7 47.7, 127.3 47.7 C 131.9 47.7, 133.6 8.1, 138.2 8.1 C 142.8 8.1, 144.5 54.9, 149.1 54.9 C 153.7 54.9, 155.4 4.0, 160.0 4.0 C 164.6 4.0, 166.3 54.9, 170.9 54.9 C 175.5 54.9, 177.2 8.1, 181.8 8.1 C 186.4 8.1, 188.1 47.7, 192.7 47.7 C 197.3 47.7, 199.1 16.9, 203.6 16.9 C 208.2 16.9, 210.0 38.9, 214.5 38.9 C 219.1 38.9, 220.9 24.4, 225.5 24.4 C 230.0 24.4, 231.8 33.2, 236.4 33.2 C 240.9 33.2, 242.7 28.3, 247.3 28.3 C 251.9 28.3, 253.6 30.8, 258.2 30.8 C 262.8 30.8, 264.5 29.6, 269.1 29.6 C 273.7 29.6, 275.4 30.1, 280.0 30.1 C 296.8 30.1, 303.2 30.0, 320.0 30.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Right Column: Description */}
            <div className="md:col-span-4">
              <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal">
                Deep, controlled lows. Open, natural vocals. A finely balanced soundstage that gives every track room to breathe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
