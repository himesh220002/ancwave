"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Camera, Expand, X } from "lucide-react";

export interface ReviewGalleryItem {
  src: string;
  alt?: string;
  author?: string;
  caption?: string;
}

interface ReviewImageMasonryProps {
  items?: ReviewGalleryItem[];
  fallbackItems?: ReviewGalleryItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
}

const HEIGHTS = ["h-40 sm:h-44", "h-52 sm:h-60", "h-44 sm:h-52", "h-36 sm:h-40", "h-56 sm:h-64"];
const WIDTHS = ["w-36 sm:w-44", "w-44 sm:w-52", "w-40 sm:w-48", "w-36 sm:w-44", "w-48 sm:w-56"];

export function ReviewImageMasonry({
  items = [],
  fallbackItems = [],
  eyebrow = "COMMUNITY FRAMES",
  title = "Verified community acoustics",
  description = "Raw, unretouched frames submitted by verified owners. Select any image to inspect it.",
  className = "",
}: ReviewImageMasonryProps) {
  const gallery = useMemo(() => {
    const source = items.length > 0 ? items : fallbackItems;
    return source.filter((item) => Boolean(item?.src));
  }, [items, fallbackItems]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % gallery.length
    );
  }, [gallery.length]);
  const previous = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + gallery.length) % gallery.length
    );
  }, [gallery.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, close, next, previous]);

  if (gallery.length === 0) return null;

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-mono tracking-[0.18em] text-blue-600 uppercase font-semibold">
              {eyebrow}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">{description}</p>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase shrink-0">
          {String(gallery.length).padStart(2, "0")} frames · click to expand
        </span>
      </div>

      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto pb-3 scrollbar-thin">
        <div className="flex items-center gap-3 sm:gap-4 w-max">
          {gallery.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group relative shrink-0 snap-start overflow-hidden rounded-2xl bg-[#ECECE7] border border-[#E3E2DC] text-left focus-visible:outline-2 focus-visible:outline-blue-600 ${HEIGHTS[index % HEIGHTS.length]} ${WIDTHS[index % WIDTHS.length]}`}
              aria-label={`Expand community photo ${index + 1}`}
            >
              <Image
                src={item.src}
                alt={item.alt || item.caption || `Community photo ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 45vw, 220px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-80" />
              <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/80 truncate">
                    {item.author || "Verified owner"}
                  </p>
                  {item.caption && (
                    <p className="text-[11px] text-white font-medium truncate">{item.caption}</p>
                  )}
                </div>
                <span className="w-6 h-6 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null && gallery[activeIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Community photo viewer"
          onClick={close}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 text-white/80">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {String(activeIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
                </span>
                <span className="text-white/30">·</span>
                <span className="truncate">{gallery[activeIndex].author || "Verified owner"}</span>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close photo viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-zinc-950 border border-white/10">
              <Image
                src={gallery[activeIndex].src}
                alt={gallery[activeIndex].alt || "Community photo"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <p className="text-xs text-zinc-300 truncate">
                {gallery[activeIndex].caption || "Customer-submitted acoustic scene"}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={previous}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous photo"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Next photo"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
