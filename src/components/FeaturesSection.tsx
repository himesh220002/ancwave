"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

export function FeaturesSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const toggleSoundstage = () => {
    if (isPlaying) {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setIsPlaying(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    }
  };

  return (
    <section id="features" className="py-20 md:py-24 bg-white border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16">
        {/* Section Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              01 / FEEL THE DIFFERENCE
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-[#111111] leading-[1.08] sm:leading-[1.05]">
              Nothing extra. <br />
              Everything considered.
            </h2>
            <p className="text-sm sm:text-base text-[#555555] max-w-sm font-normal leading-relaxed md:text-right">
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

        {/* Acoustic Soundwave Banner matching Figma Screenshot 2 */}
        <div className="rounded-2xl bg-[#22252A] text-white p-6 sm:p-8 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left title & Tag */}
            <div className="lg:col-span-4 space-y-1">
              <span className="text-[10px] font-mono tracking-[0.18em] text-zinc-400 uppercase block">
                40 MM / CUSTOM DYNAMIC DRIVER
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Closer to the original.
              </h3>
            </div>

            {/* Center: Soundwave SVG Curve matching Screenshot 2 */}
            <div
              className="lg:col-span-4 flex items-center justify-center cursor-pointer py-1"
              onClick={toggleSoundstage}
              title="Click to toggle soundstage"
            >
              <svg
                viewBox="0 0 200 40"
                className="w-full max-w-[220px] h-10 text-white stroke-current fill-none stroke-[1.2]"
              >
                <path d="M 0 20 L 40 20 Q 45 20 48 10 Q 52 35 56 5 Q 60 38 64 8 Q 68 32 72 12 Q 76 28 80 16 Q 84 24 88 20 L 200 20" />
              </svg>
            </div>

            {/* Right: Description */}
            <div className="lg:col-span-4">
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
