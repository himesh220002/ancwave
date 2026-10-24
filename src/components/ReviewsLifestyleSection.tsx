"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ArrowLeft, ArrowRight, Play, Check, X } from "lucide-react";
import { sampleReviews } from "@/lib/store";

export function ReviewsLifestyleSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const lifestyleCards = [
    {
      id: "life-1",
      title: "A slower start.",
      handle: "@maya.studio",
      tag: "PHOTO",
      image: "/images/lifestyle-cafe.jpg",
      hasVideo: false,
    },
    {
      id: "life-2",
      title: "Room to focus.",
      handle: "@theo.frames",
      tag: "VIDEO · 0:18",
      image: "/images/lifestyle-workspace.jpg",
      hasVideo: true,
    },
    {
      id: "life-3",
      title: "Take the long way.",
      handle: "@nina.in.motion",
      tag: "PHOTO",
      image: "/images/lifestyle-city.jpg",
      hasVideo: false,
    },
  ];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % lifestyleCards.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + lifestyleCards.length) % lifestyleCards.length);
  };

  const [reviewsList, setReviewsList] = useState<any[]>(sampleReviews);

  React.useEffect(() => {
    fetch("/api/reviews?productId=form-01")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviewsList(data.reviews);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section id="reviews" className="py-20 md:py-24 bg-blue-50 border-t border-[#EAEAE5]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-20">
        {/* Section Header */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
              03 / LISTENING, LIVED IN
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111111] leading-tight break-words">
              A place in your everyday.
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs md:text-right font-normal leading-relaxed break-words">
              Verified customer experiences and community scenes from daily listeners.
            </p>
          </div>
        </div>

        {/* Dynamic Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {reviewsList.slice(0, 3).map((rev) => (
            <div
              key={rev.id || rev.reviewId}
              className="p-5 sm:p-8 rounded-2xl bg-white border border-[#EAEAE5] flex flex-col justify-between space-y-5 sm:space-y-6"
            >
              <div className="space-y-3 sm:space-y-4">
                {/* 5 Stars & Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-blue-600">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating
                          ? "fill-blue-600 text-blue-600"
                          : "text-zinc-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-sans flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Verified buyer
                  </span>
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-[15px] text-[#222222] font-normal leading-relaxed break-words">
                  {rev.comment}
                </p>

                {/* Attached Review Photo */}
                {rev.images && rev.images.length > 0 && (
                  <div className="pt-1 flex gap-2 overflow-x-auto">
                    {rev.images.map((img: string, i: number) => (
                      <div
                        key={i}
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0"
                      >
                        <Image
                          src={img}
                          alt="Review media"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Author & Avatar */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-[#EAEAE5] text-zinc-700 flex items-center justify-center text-[11px] font-medium font-sans shrink-0">
                  {rev.initials || rev.userInitials || "VB"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-[#111111] truncate">
                    {rev.author || rev.userName}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">{rev.role || rev.userRole || "Verified Owner"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lifestyle Gallery matching Figma Screenshot 4 */}
        <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#111111] break-words">
              Different days. Same good feeling.
            </h3>

            {/* Slider Controls (01 / 03 with arrow buttons) */}
            <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
              <span className="text-xs font-mono text-zinc-400">
                0{activeSlide + 1} / 03
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors"
                  aria-label="Previous scene"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors"
                  aria-label="Next scene"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3 Lifestyle Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lifestyleCards.map((card, idx) => (
              <div
                key={card.id}
                className={`space-y-3 cursor-pointer transition-opacity ${activeSlide === idx ? "opacity-100" : "opacity-90 hover:opacity-100"
                  }`}
                onClick={() => setActiveSlide(idx)}
              >
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#ECECE7]">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Top Badge (PHOTO / VIDEO) */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded bg-white/90 text-[10px] font-mono font-medium text-zinc-800">
                      {card.tag}
                    </span>
                  </div>

                  {/* Play Button for Video Card */}
                  {card.hasVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoModalOpen(true);
                      }}
                      className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-zinc-900 shadow-md hover:scale-105 transition-transform"
                      aria-label="Play video"
                    >
                      <Play className="w-4 h-4 fill-zinc-900 ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Subtitle & Social Handle */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-medium text-[#111111]">{card.title}</span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {card.handle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-xl w-full bg-zinc-900 text-white rounded-2xl overflow-hidden border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Room to focus — Soundstage Film</h3>
                <p className="text-xs text-zinc-400">Adaptive ANC cancelling background distraction.</p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center">
              <Image
                src="/images/lifestyle-workspace.jpg"
                alt="Workspace focus preview"
                fill
                className="object-cover opacity-60"
              />
              <div className="relative z-10 text-center space-y-2 px-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mx-auto text-white shadow-lg">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  40mm Custom Drivers · Active Silence
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
