"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Check,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Flame,
  Radio,
  Sliders,
  BatteryCharging,
  Cpu,
  Layers,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Volume2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import {
  ProductData,
  ProductColor,
  TwsComponentType,
  Review,
  IReview,
  IVariant,
  MediaGalleryItem,
} from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { toast } from "@/components/Toaster";
import { sampleReviews } from "@/lib/store";
import confetti from "canvas-confetti";
import {
  Camera,
  X,
  Lock,
  UploadCloud,
  Send,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";

interface ProductDetailViewProps {
  product: ProductData;
  relatedProducts: ProductData[];
  initialColor?: string;
  initialComponent?: string;
}

export function ProductDetailView({
  product,
  relatedProducts,
  initialColor,
  initialComponent,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();

  // Child Variant selection (e.g. Detachable Mic vs Built-in Mic)
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>(
    product.childVariants?.[0]?.sku || ""
  );

  // Live product sync state to ensure dynamic prices from MongoDB / Admin reflect instantaneously
  const [liveProduct, setLiveProduct] = useState<ProductData>(product);

  useEffect(() => {
    setLiveProduct(product);
  }, [product]);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/product?slug=${product.slug}&_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.product) {
          setLiveProduct(data.product);
          if (data.product.averageRating) setLiveRating(data.product.averageRating);
          if (typeof data.product.reviewCount === "number") setLiveReviewCount(data.product.reviewCount);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [product.slug]);

  const p = liveProduct || product;

  // Dynamic reviews & live rating state
  const [reviewsList, setReviewsList] = useState<(Review & IReview)[]>(sampleReviews);
  const [liveRating, setLiveRating] = useState<number>(p.averageRating || p.rating);
  const [liveReviewCount, setLiveReviewCount] = useState<number>(p.reviewCount);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    message?: string;
    hasReviewed?: boolean;
  } | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState<boolean>(false);

  // Review Composer form state
  const [formRating, setFormRating] = useState<number>(5);
  const [formHoverRating, setFormHoverRating] = useState<number>(0);
  const [formComment, setFormComment] = useState<string>("");
  const [formVariantSku, setFormVariantSku] = useState<string>(
    p.childVariants?.[0]?.sku || ""
  );
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Active color variant
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    (initialColor as ProductColor) || p.variants?.[0]?.id || "silver"
  );

  // Active media gallery item
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Fractional TWS component selection
  const [selectedTwsComponent, setSelectedTwsComponent] = useState<TwsComponentType>(
    (initialComponent as TwsComponentType) || "full-set"
  );

  // Technical Matrix Active Tab
  const [activeSpecTab, setActiveSpecTab] = useState<"core" | "battery" | "connectivity">("core");

  // Exploded View Active Hotspot
  const [activeHotspot, setActiveHotspot] = useState<number>(0);

  // Review Pain-Point Filter
  const [reviewFilterTag, setReviewFilterTag] = useState<string>("all");

  // Q&A Accordion open state
  const [openQnaId, setOpenQnaId] = useState<string | null>(p.qna?.[0]?.id || null);

  // Added-to-cart temporary state
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  // Derived current color variant
  const currentVariant =
    p.variants?.find((v) => v.id === selectedColor) ||
    p.variants?.[0] ||
    product.variants?.[0] || {
      id: "silver",
      name: "Silver",
      hex: "#C4C8D0",
      borderHex: "#949DAA",
      image: "/images/hero-silver.jpg",
      tag: "01",
    };

  // Derived current child variant (hardware architecture / sku variance)
  const currentChildVariant =
    p.childVariants?.find((cv) => cv.sku === selectedVariantSku) ||
    p.childVariants?.find(
      (cv) => cv.color?.toLowerCase() === (currentVariant?.name || "").toLowerCase()
    ) ||
    p.childVariants?.[0];

  // Derived TWS component option (if product is TWS)
  const currentTwsOption =
    p.isTws && p.twsComponents
      ? p.twsComponents.find((c) => c.id === selectedTwsComponent) || p.twsComponents[0]
      : null;

  // Active pricing based on color variant / child variant / component selection
  const activePrice = currentTwsOption
    ? currentTwsOption.price
    : (currentChildVariant?.price ?? currentVariant?.price ?? p.price);
  const activePriceInr = currentTwsOption
    ? Math.round(currentTwsOption.price * 83)
    : (currentChildVariant?.priceInr ??
       currentVariant?.priceInr ??
       (activePrice < 1
         ? Number((activePrice * 83).toFixed(2))
         : (p.priceInr ?? Math.round(activePrice * 83))));
  const activeOriginalPrice = currentTwsOption
    ? currentTwsOption.originalPrice
    : p.originalPrice;
  const activeSku = currentTwsOption
    ? currentTwsOption.sku
    : (currentChildVariant?.sku || currentVariant?.tag || p.sku);
  const activeStock = currentTwsOption
    ? currentTwsOption.stock
    : (typeof currentChildVariant?.stock === "number" ? currentChildVariant.stock : p.stock);

  // Derived dynamic multiple images for the active variant
  const variantImages: string[] = React.useMemo(() => {
    if (currentChildVariant?.images && currentChildVariant.images.length > 0) {
      return currentChildVariant.images;
    }
    if (currentVariant?.images && currentVariant.images.length > 0) {
      return currentVariant.images;
    }
    if (currentVariant?.image) {
      return [currentVariant.image];
    }
    return ["/images/hero-silver.jpg"];
  }, [currentChildVariant, currentVariant]);

  // Dynamic media gallery combining all variant-specific images + shared product architecture assets
  const mediaGallery = React.useMemo(() => {
    const angleLabels = [
      "Studio Front View",
      "Precision Macro Detail",
      "Ergonomic Cushion Profile",
      "Lifestyle In-Use",
      "Rotary Dial Control",
      "Acoustic Chamber",
      "Architectural Angle",
    ];

    const items: MediaGalleryItem[] = variantImages.map((imgUrl, i) => ({
      id: `var-img-${i}-${imgUrl.slice(-10)}`,
      url: imgUrl,
      alt: `${product.name} - ${currentChildVariant?.color || currentVariant?.name || "Variant"} - Angle ${i + 1}`,
      type: i === 0 ? "hero" : i === 1 ? "macro" : "lifestyle",
      label: angleLabels[i] || `Angle 0${i + 1}`,
    }));

    // If product has exploded view and it's not already in variant images, append it as technical view
    if (product.explodedView?.image && !variantImages.includes(product.explodedView.image)) {
      items.push({
        id: "exploded-tech",
        url: product.explodedView.image,
        alt: `${product.name} Internal Acoustic Architecture`,
        type: "360" as const,
        label: "Internal Architecture",
      });
    }

    return items;
  }, [variantImages, product.name, currentChildVariant?.color, currentVariant?.name, product.explodedView?.image]);

  // Read initial query params from window.location on mount without blocking SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlColor = params.get("color");
      const urlComp = params.get("component");
      if (urlColor && product.variants.some((v) => v.id === urlColor)) {
        setSelectedColor(urlColor as ProductColor);
      }
      if (urlComp && product.twsComponents?.some((c) => c.id === urlComp)) {
        setSelectedTwsComponent(urlComp as TwsComponentType);
      }
    }
  }, [product.variants, product.twsComponents]);

  // Dynamic URL update using History API without full reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (selectedColor) params.set("color", selectedColor);
      if (product.isTws && selectedTwsComponent) {
        params.set("component", selectedTwsComponent);
      }
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedColor, selectedTwsComponent, product.isTws]);

  // When color changes, switch hero image to match color and sync child variant
  const handleColorSelect = (colorId: ProductColor) => {
    setSelectedColor(colorId);
    const selectedVariant = p.variants?.find((v) => v.id === colorId);
    if (selectedVariant && p.childVariants) {
      const matchingChild = p.childVariants.find(
        (cv) => cv.color.toLowerCase() === selectedVariant.name.toLowerCase()
      );
      if (matchingChild) {
        setSelectedVariantSku(matchingChild.sku);
      }
    }
    setActiveMediaIndex(0);
  };

  // Add to Bag handler
  const handleAddToCart = () => {
    const componentLabel = currentTwsOption && currentTwsOption.id !== "full-set"
      ? currentTwsOption.label
      : undefined;

    const coverImage = variantImages[0] || currentVariant.image;

    addItem({
      productId: p.id,
      name: `${p.name} - ${currentChildVariant?.color || currentVariant.name}`,
      variant: currentVariant.id,
      variantName: `${currentVariant.name}${currentChildVariant?.specOverride ? ` (${currentChildVariant.specOverride})` : ""}`,
      component: componentLabel,
      componentSku: activeSku,
      price: activePrice,
      priceInr: activePriceInr,
      image: coverImage,
      fit: p.categorySlug === "headphones" ? "Adjustable fit" : "Universal ergonomic fit",
    });

    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 2500);
  };

  // Direct Buy Now handler
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  // Fetch dynamic reviews and user purchase eligibility
  const fetchReviewsAndEligibility = React.useCallback(async () => {
    try {
      const targetId = product.productId || product.slug;

      // 1. Fetch live approved reviews and aggregate rating
      const res = await fetch(`/api/reviews?productId=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
          setReviewsList(data.reviews);
          if (typeof data.averageRating === "number") setLiveRating(data.averageRating);
          if (typeof data.reviewCount === "number") setLiveReviewCount(data.reviewCount);
        }
      }

      // 2. Query conditional review validation (LoggedIn + Bought)
      setIsLoadingEligibility(true);
      const eligRes = await fetch(`/api/reviews/eligibility?productId=${targetId}`);
      if (eligRes.ok) {
        const eligData = await eligRes.json();
        setEligibility(eligData);
      }
    } catch (err) {
      console.warn("Reviews/eligibility fetch error:", err);
    } finally {
      setIsLoadingEligibility(false);
    }
  }, [product.productId, product.slug, user]);

  useEffect(() => {
    fetchReviewsAndEligibility();
  }, [fetchReviewsAndEligibility]);

  // Secure 5-Photo Media Pipeline: Direct Browser-to-S3 Presigned Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length + files.length > 5) {
      toast({
        type: "info",
        title: "Photo Limit Exceeded",
        description: `Reviews are limited to a maximum of 5 photos. You currently have ${formImages.length} attached.`,
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Request AWS S3 Presigned URL from backend API route
        const presignRes = await fetch("/api/reviews/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "image/jpeg",
          }),
        });

        const presignData = await presignRes.json();
        if (!presignData.success || !presignData.uploadUrl) {
          throw new Error(presignData.error || "Failed to generate secure S3 presigned URL");
        }

        // 2. Upload directly from the browser to the AWS S3 Bucket
        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Direct S3 upload failed");
        }

        // 3. Store clean S3/CloudFront URL
        newUrls.push(presignData.publicUrl);
      }

      setFormImages((prev) => [...prev, ...newUrls].slice(0, 5));
      toast({
        type: "success",
        title: "Photo Uploaded",
        description: `Direct AWS S3 upload completed for ${newUrls.length} image(s).`,
      });
    } catch (err: any) {
      console.error("Direct S3 photo upload failed:", err);
      toast({
        type: "error",
        title: "Media Upload Failed",
        description: err.message || "Failed to upload photo to S3 storage",
      });
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit verified review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) {
      toast({
        type: "info",
        title: "Review Comment Required",
        description: "Please share a few words about your acoustic experience.",
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const selectedVariantObj = product.childVariants?.find((v) => v.sku === formVariantSku);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId || product.slug,
          slug: product.slug,
          rating: formRating,
          comment: formComment.trim(),
          variantSku: formVariantSku,
          variantName: selectedVariantObj?.color || currentVariant.name,
          images: formImages.slice(0, 5),
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        toast({
          type: "success",
          title: "Verified Review Published!",
          description: "Your rating is reflected across product cards and pages. Edge ISR purged.",
        });

        if (data.review) {
          setReviewsList((prev) => [data.review, ...prev]);
        }
        if (typeof data.averageRating === "number") setLiveRating(data.averageRating);
        if (typeof data.reviewCount === "number") setLiveReviewCount(data.reviewCount);

        setFormComment("");
        setFormImages([]);
        fetchReviewsAndEligibility();
      } else {
        toast({
          type: "error",
          title: "Submission Blocked",
          description: data.error || "Conditional review criteria not met",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to submit review",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Demo purchase helper for fast verification testing
  const handleQuickDemoVerify = async () => {
    try {
      const res = await fetch("/api/reviews/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.slug }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Demo Purchase Linked",
          description: "Completed order registered! Review privileges are now unlocked.",
        });
        fetchReviewsAndEligibility();
      } else {
        toast({
          type: "error",
          title: "Sign In Required",
          description: "Please sign in first to link a demo purchase.",
        });
        setIsAuthModalOpen(true);
      }
    } catch {
      toast({ type: "error", title: "Error", description: "Failed to link demo order" });
    }
  };

  // Filtered reviews
  const filteredReviews = reviewsList.filter((r) => {
    if (reviewFilterTag === "all") return true;
    if (reviewFilterTag === "photos") return r.images && r.images.length > 0;
    return r.tags?.includes(reviewFilterTag);
  });

  // Review tags list
  const availableTags = [
    { id: "all", label: "All Reviews" },
    { id: "photos", label: "📸 With Photos" },
    { id: "ANC performance", label: "ANC performance" },
    { id: "Clamping force & comfort", label: "Clamping force & comfort" },
    { id: "Flight travel", label: "Flight travel" },
    { id: "Bass response", label: "Bass response" },
    { id: "Call clarity", label: "Call clarity" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Header */}
      <Navbar subtitle={`/ ${product.name.toUpperCase()}`} />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-[#EAEAE5] py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between text-xs text-zinc-500">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <Link href="/products" className="hover:text-black transition-colors">
              Audio
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="capitalize">{product.categorySlug}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-zinc-900 font-semibold truncate">{product.name}</span>
          </nav>

          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            SKU: {activeSku}
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION A: HERO MEDIA & SKU CONFIGURATOR
          Split-Screen View: Left media carousel + Right SKU configurator
          ========================================================================= */}
      <section className="py-10 sm:py-16 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column (7 cols): Split-Screen Media Gallery */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Showcase Viewport */}
              <div
                onClick={() => setActiveLightboxImage(mediaGallery[activeMediaIndex]?.url || currentVariant.image)}
                className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl bg-[#F0EFEA] p-6 sm:p-10 overflow-hidden flex items-center justify-center border border-[#EAEAE5] group cursor-zoom-in"
              >
                <Image
                  src={mediaGallery[activeMediaIndex]?.url || currentVariant.image}
                  alt={mediaGallery[activeMediaIndex]?.alt || product.name}
                  fill
                  priority
                  className="object-contain p-4 group-hover:scale-102 transition-transform duration-500 ease-out"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />

                {/* Perspective & Angle Badges */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono tracking-widest text-zinc-800 uppercase font-semibold border border-zinc-200 shadow-2xs">
                    {mediaGallery[activeMediaIndex]?.label || "STUDIO RENDER"}
                  </span>
                  {activeMediaIndex === 3 && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-medium shadow-2xs flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      360 / X-RAY
                    </span>
                  )}
                </div>

                {/* Top Right Counter & Zoom Button */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono font-bold text-zinc-700 border border-zinc-200 shadow-2xs">
                    {activeMediaIndex + 1} / {mediaGallery.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLightboxImage(mediaGallery[activeMediaIndex]?.url || currentVariant.image);
                    }}
                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-700 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-2xs"
                    title="Inspect high resolution"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cycle Arrows (Overlayed on Hover) */}
                {mediaGallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex((prev) => (prev - 1 + mediaGallery.length) % mediaGallery.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-sm"
                      aria-label="Previous angle"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex((prev) => (prev + 1) % mediaGallery.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-sm"
                      aria-label="Next angle"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Color Variant Pill Indicator */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-[11px] font-mono text-zinc-600 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-200">
                  {(currentChildVariant?.color || currentVariant?.name || "Standard").toUpperCase()} · {currentChildVariant?.sku || p.model || product.model}
                </div>
              </div>

              {/* Multi-Angle Thumbnails Carousel */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {mediaGallery.map((media, idx) => (
                  <button
                    key={media.id || idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative shrink-0 w-24 sm:w-28 aspect-4/3 rounded-2xl bg-[#F0EFEA] p-1.5 overflow-hidden border transition-all text-left flex flex-col justify-end group/thumb ${
                      activeMediaIndex === idx
                        ? "border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-zinc-200/80 hover:border-zinc-400 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={media.url}
                      alt={media.alt}
                      fill
                      className="object-contain p-1 group-hover/thumb:scale-105 transition-transform"
                      sizes="120px"
                    />
                    <span className="relative z-10 text-[9px] font-mono text-zinc-800 bg-white/90 px-1.5 py-0.5 rounded-md truncate max-w-full border border-zinc-200/50">
                      {media.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column (5 cols): Dynamic SKU Configurator */}
            <div className="lg:col-span-5 space-y-6">
              {/* Product Title, Model & Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest text-blue-600 uppercase font-semibold">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{liveRating}</span>
                    <span className="text-zinc-400 font-normal">({liveReviewCount} verified reviews)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {product.tagline} {product.description}
                </p>
              </div>

              {/* Live Price Display */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-bold text-zinc-900">
                      ${activePrice}
                    </span>
                    {activeOriginalPrice > activePrice && (
                      <span className="text-sm text-zinc-400 line-through">
                        ${activeOriginalPrice}
                      </span>
                    )}
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      In Stock ({activeStock} units)
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Direct Razorpay checkout · ₹{activePriceInr.toLocaleString("en-IN")} (≈ ${activePrice.toFixed(2)})
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] font-mono text-zinc-400 uppercase">WARRANTY</span>
                  <span className="text-xs font-bold text-zinc-800">2 Years Included</span>
                </div>
              </div>

              {/* =================================================================
                  FRACTIONAL INVENTORY COMPONENT MATRIX FOR TWS EARBUDS
                  ================================================================= */}
              {product.isTws && product.twsComponents && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      COMPONENT INVENTORY MATRIX
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Modular replacements
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Select a complete stereo pair or purchase direct component replacements if an individual bud or case is lost:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {product.twsComponents.map((comp) => {
                      const isSelected = selectedTwsComponent === comp.id;
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setSelectedTwsComponent(comp.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-600"
                              : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900">
                              {comp.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-blue-600">
                              ${comp.price}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                            {comp.description}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                            <span>SKU: {comp.sku}</span>
                            <span className="text-emerald-600">Stock: {comp.stock}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Child Variants: Hardware Feature & Architecture Variance */}
              {product.childVariants && product.childVariants.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {product.type || product.category || "Product"} Variant Architecture
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {product.childVariants.length} configurations
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Select your preferred edition, architectural cut, or specification:
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {product.childVariants.map((v) => {
                      const isSelected = selectedVariantSku === v.sku;
                      return (
                        <button
                          key={v.sku}
                          type="button"
                          onClick={() => {
                            setSelectedVariantSku(v.sku);
                            const matchingColor = product.variants.find(
                              (cv) => cv.name.toLowerCase() === v.color.toLowerCase()
                            );
                            if (matchingColor) setSelectedColor(matchingColor.id);
                            setActiveMediaIndex(0);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-white border-blue-600 shadow-xs ring-1.5 ring-blue-600/30"
                              : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900">{v.color}</span>
                              <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                                {v.sku}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {v.specOverride || "Integrated Acoustic Spec"}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-zinc-900">
                              ${v.price}
                            </div>
                            <span
                              className={`text-[9px] font-mono font-semibold ${
                                v.stock <= 5 ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {v.stock === 0 ? "Sold out" : `${v.stock} units left`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Swatch Selector */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700">
                    Finish: <span className="font-bold text-zinc-900">{currentVariant?.name || "Standard"}</span>
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    Option {currentVariant?.tag || "01"} of {p.variants?.length || product.variants?.length || 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {product.variants.map((v) => {
                    const isSelected = selectedColor === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleColorSelect(v.id)}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "ring-2 ring-blue-600 ring-offset-2 scale-105"
                            : "hover:scale-105"
                        }`}
                        title={v.name}
                        aria-label={`Select ${v.name}`}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/15 shadow-2xs flex items-center justify-center"
                          style={{ backgroundColor: v.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-4 h-4 stroke-[2.5] ${
                                v.id === "white" || v.id === "silver" || v.id === "sandstone"
                                  ? "text-zinc-900"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Add to Bag & Buy Now */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3.5 px-4 rounded-xl border border-zinc-300 hover:border-black active:scale-[0.99] text-zinc-900 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 bg-white"
                  >
                    {isAddedRecently ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Added to Bag!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Now · ${activePrice}</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {product.deliveryEstimate}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    30-Day Risk-Free Trial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: IMMERSIVE FEATURE HIGHLIGHTS & X-RAY EXPLODED VIEW
          ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          {/* Section Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500 uppercase">
                SECTION B · IMMERSIVE ARCHITECTURE
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                Acoustic X-Ray & Value Callouts
              </h2>
              <span className="text-xs font-mono text-zinc-400 uppercase">
                TRANSDUCER PURITY · ZERO DISTORTION
              </span>
            </div>
          </div>

          {/* Interactive X-Ray Exploded View Card */}
          {product.explodedView && (
            <div className="rounded-3xl bg-white border border-[#EAEAE5] overflow-hidden p-6 sm:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Exploded Visual Diagram */}
                <div className="lg:col-span-7 relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-[#F0EFEA] overflow-hidden flex items-center justify-center border border-zinc-200/70">
                  <Image
                    src={product.explodedView.image}
                    alt={product.explodedView.caption}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-mono tracking-wider font-semibold">
                    {product.explodedView.badge}
                  </div>
                </div>

                {/* Hotspot Markers List */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-zinc-900">
                      Precision Component Assembly
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {product.explodedView.caption} Click any numbered stage to inspect acoustic engineering details:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {product.explodedView.callouts.map((c, idx) => (
                      <button
                        key={c.number}
                        type="button"
                        onClick={() => setActiveHotspot(idx)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                          activeHotspot === idx
                            ? "bg-blue-50/60 border-blue-600 shadow-xs ring-1 ring-blue-600/30"
                            : "bg-white border-zinc-200/80 hover:border-zinc-300"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                            activeHotspot === idx
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {c.number}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900">
                            {c.title}
                          </h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            {c.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Category Value Callouts */}
          {product.primaryValueCallouts && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.primaryValueCallouts.map((callout, idx) => (
                <div
                  key={callout.title}
                  className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-7 space-y-3 hover:border-zinc-400 transition-colors shadow-2xs"
                >
                  <span className="text-[10px] font-mono tracking-widest text-blue-600 font-semibold uppercase">
                    0{idx + 1} // {callout.tag}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {callout.title}
                  </h3>
                  <p className="text-xs font-medium text-zinc-700">
                    {callout.subtitle}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {callout.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION C: THE MULTI-TAB TECHNICAL MATRIX
          ========================================================================= */}
      <section id="specs" className="py-16 sm:py-24 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          {/* Header & Multi-Tab Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                SECTION C · TECHNICAL BENCHMARK MATRIX
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                {product.categorySlug === "headphones" || product.categorySlug === "earbuds"
                  ? "Detailed Hardware Specifications"
                  : `${product.category || "Product"} Specifications & Materials`}
              </h2>
            </div>

            {/* 3 Tabs Toggle if tabbedSpecs available */}
            {product.tabbedSpecs && (
              <div className="flex items-center p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveSpecTab("core")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeSpecTab === "core"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Core Specs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSpecTab("battery")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeSpecTab === "battery"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
                  <span>Battery & Charging</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSpecTab("connectivity")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeSpecTab === "connectivity"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connectivity & Intelligence</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabbed Specs Table */}
          {product.tabbedSpecs && (
            <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {product.tabbedSpecs[activeSpecTab].map((row, idx) => (
                <div
                  key={row.label}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-600 sm:w-1/3">
                    {row.label}
                  </span>
                  <div className="sm:w-2/3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-zinc-900">
                      {row.value}
                    </span>
                    {row.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Global & Variant-Overridden Specifications (Category-Agnostic with Spec Diversion) */}
          {(!product.tabbedSpecs && (product.globalSpecs || currentChildVariant?.variantSpecs)) && (() => {
            const global = product.globalSpecs || {};
            const overrides = currentChildVariant?.variantSpecs || {};
            const allKeys = Array.from(new Set([...Object.keys(global), ...Object.keys(overrides)]));

            return (
              <div className="space-y-3">
                {/* Active Architecture Differentiation Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider">
                      Active Architecture:
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                      {currentChildVariant?.specOverride || currentChildVariant?.color || "Standard Architecture"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      ⚡ Variant Override
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      🌐 Global Spec
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100 shadow-2xs">
                  {allKeys.map((label, idx) => {
                    const isOverridden = label in overrides;
                    const displayValue = isOverridden ? overrides[label] : global[label];
                    const globalDefault = global[label];

                    return (
                      <div
                        key={label}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                          isOverridden
                            ? "bg-amber-50/40 hover:bg-amber-50/70"
                            : idx % 2 === 0
                            ? "bg-white"
                            : "bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="sm:w-1/3 flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-700">
                            {label}
                          </span>
                          {isOverridden && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300/80">
                              OVERRIDE
                            </span>
                          )}
                        </div>

                        <div className="sm:w-2/3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                          <span className={`text-xs font-semibold font-mono ${
                            isOverridden ? "text-amber-950 font-bold" : "text-zinc-900"
                          }`}>
                            {displayValue}
                          </span>

                          {isOverridden && globalDefault && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              (Global base: {globalDefault})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* =========================================================================
          SECTION D: HYGIENE, RETURNS & SOCIAL PROOF
          ========================================================================= */}
      <section id="reviews" className="py-16 sm:py-24 bg-[#FBFBFA] border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          {/* Sanitation & Return Policy Warning Banner */}
          {product.hygienePolicy && (
            <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-mono tracking-widest text-amber-800 font-bold uppercase">
                  {product.hygienePolicy.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                {product.hygienePolicy.title}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-4xl">
                {product.hygienePolicy.description}
              </p>
              <div className="pt-2 text-xs font-medium text-amber-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{product.hygienePolicy.exemptionNotice}</span>
              </div>
            </div>
          )}

          {/* User Reviews Header & Filterable Tags */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  VERIFIED COMMUNITY ACOUSTICS
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                  Customer Experiences & Acoustic Reviews
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-zinc-900">{liveRating} / 5.0</span>
                <span>(Based on {liveReviewCount} customer reviews)</span>
              </div>
            </div>

            {/* Pain Point Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-zinc-400 font-medium shrink-0">Filter:</span>
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setReviewFilterTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    reviewFilterTag === tag.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Reviews Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <div
                  key={review.id || review.reviewId}
                  className="rounded-3xl bg-white border border-[#EAEAE5] p-6 space-y-4 flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3" />
                        Verified Buyer
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed font-sans">
                      {review.comment}
                    </p>

                    {/* Photo Gallery (Up to 5 Photos) */}
                    {review.images && review.images.length > 0 && (
                      <div className="pt-2">
                        <div className="flex gap-2 overflow-x-auto py-1">
                          {review.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveLightboxImage(imgUrl)}
                              className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 hover:opacity-90 hover:scale-105 transition-all cursor-pointer group"
                            >
                              <Image
                                src={imgUrl}
                                alt={`Customer photo ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[10px] flex items-center justify-center">
                        {review.initials || "VB"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{review.author || review.userName}</h4>
                        <p className="text-[10px] text-zinc-400">{review.role || review.variant || "Form 01"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {review.createdAt || "Verified buyer"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CONDITIONAL REVIEW COMPOSER (LoggedIn + Bought) */}
            <div className="pt-6">
              {/* Case 1: User is Not Logged In */}
              {!user && (
                <div className="rounded-3xl bg-white border border-[#EAEAE5] p-8 text-center space-y-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                      Share Your Acoustic Experience
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Only verified owners of ancwave hardware can submit reviews. Sign in to your account to share your feedback.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>Sign In to Review</span>
                  </button>
                </div>
              )}

              {/* Case 2: User is Logged In, but has NO purchase */}
              {user && eligibility && !eligibility.eligible && (
                <div className="rounded-3xl bg-amber-50/60 border border-amber-200/80 p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-amber-950">
                      Verified Owner Check: No Purchase Found
                    </h3>
                    <p className="text-xs text-amber-800/80 max-w-lg mx-auto">
                      {eligibility.message ||
                        "Our system cross-references active customer orders before publishing reviews to ensure authentic acoustic insights."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <Link
                      href="/checkout"
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      Purchase {product.name}
                    </Link>
                    <button
                      type="button"
                      onClick={handleQuickDemoVerify}
                      className="px-4 py-2 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-semibold text-xs border border-amber-300 transition-colors"
                    >
                      ⚡ Demo Testing: Quick-Verify Purchase
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3: User is Logged In AND Has Purchased -> Full Review Composer */}
              {user && eligibility?.eligible && (
                <div className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-8 space-y-6 shadow-2xs">
                  <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h3 className="text-lg font-bold text-zinc-900">
                          Submit Your Verified Acoustic Review
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Authenticated as <span className="font-semibold text-zinc-800">{user.name}</span> ({user.email}) · Verified Buyer
                      </p>
                    </div>

                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
                      ✓ Purchase Confirmed
                    </span>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    {/* Interactive 5-Star Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700 block">
                        Acoustic Quality Rating
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (formHoverRating || formRating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setFormHoverRating(star)}
                                onMouseLeave={() => setFormHoverRating(0)}
                                onClick={() => setFormRating(star)}
                                className="p-1 text-amber-400 hover:scale-115 transition-transform"
                                aria-label={`${star} Stars`}
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    isFilled ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-mono font-medium text-zinc-500 ml-2">
                          {formRating === 5
                            ? "5.0 - Acoustic Masterpiece"
                            : formRating === 4
                            ? "4.0 - Exceptional Performance"
                            : formRating === 3
                            ? "3.0 - Good Performance"
                            : formRating === 2
                            ? "2.0 - Fair"
                            : "1.0 - Needs Improvement"}
                        </span>
                      </div>
                    </div>

                    {/* Hardware Variant Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">
                        Tested Hardware Variant
                      </label>
                      <select
                        value={formVariantSku}
                        onChange={(e) => setFormVariantSku(e.target.value)}
                        className="w-full sm:w-80 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-800 bg-zinc-50 focus:outline-none"
                      >
                        {product.childVariants && product.childVariants.length > 0 ? (
                          product.childVariants.map((v) => (
                            <option key={v.sku} value={v.sku}>
                              {v.color} ({v.specOverride || "Standard"})
                            </option>
                          ))
                        ) : (
                          product.variants.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name} Finish
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Review Comment Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">
                        Detailed Listening Impressions
                      </label>
                      <textarea
                        rows={3}
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        placeholder="Detail the spatial soundstage, low-frequency clarity, clamping comfort during extended sessions, or microphone noise rejection..."
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-sans leading-relaxed"
                      />
                    </div>

                    {/* SECURE 5-PHOTO MEDIA PIPELINE (DIRECT S3 PRESIGNED URL UPLOAD) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-zinc-500" />
                          <span>Attach Setup Photos</span>
                        </label>
                        <span className="text-[11px] font-mono text-zinc-400">
                          Photos ({formImages.length}/5) · Direct S3 Presigned Upload
                        </span>
                      </div>

                      {/* Photo preview slots */}
                      <div className="flex flex-wrap items-center gap-3">
                        {formImages.map((imgUrl, i) => (
                          <div
                            key={i}
                            className="relative w-18 h-18 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-300 group shadow-xs shrink-0"
                          >
                            <Image
                              src={imgUrl}
                              alt={`Upload preview ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(i)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Upload Trigger (Max 5 items) */}
                        {formImages.length < 5 && (
                          <label className="w-18 h-18 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-blue-600 hover:bg-blue-50/40 text-zinc-400 hover:text-blue-600 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isUploadingPhoto}
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                            {isUploadingPhoto ? (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            ) : (
                              <>
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-[9px] font-mono mt-1 font-bold">ADD</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        Upload up to 5 photos directly to secure AWS S3 storage. Supported formats: JPEG, PNG, WebP.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview || isUploadingPhoto}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {isSubmittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Posting Review & Purging Cache...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Post Verified Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Q&A Accordion */}
          {product.qna && product.qna.length > 0 && (
            <div className="rounded-3xl bg-white border border-[#EAEAE5] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-zinc-900">
                    Product Questions & Answers
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {product.qna.length} answered
                </span>
              </div>

              <div className="space-y-3">
                {product.qna.map((item) => {
                  const isOpen = openQnaId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-zinc-200/80 rounded-2xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenQnaId(isOpen ? null : item.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-bold text-zinc-900">
                          Q: {item.question}
                        </span>
                        <span className="text-xs font-mono text-blue-600 shrink-0">
                          {isOpen ? "− Hide" : "+ Expand"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white border-t border-zinc-100 text-xs text-zinc-600 leading-relaxed space-y-2">
                          <p>{item.answer}</p>
                          <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                            <span>Answered by {item.author}</span>
                            <span>·</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION E: CROSS-LINKING & BRAND LINEUP CAROUSEL
          "More from ancwave Acoustics"
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                CROSS-PLATFORM RECOMMENDATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                More from ancwave Acoustics
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View complete audio catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="group rounded-3xl bg-[#FBFBFA] border border-[#EAEAE5] p-5 flex flex-col justify-between hover:border-zinc-400 transition-all hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-4/3 rounded-2xl bg-white p-4 overflow-hidden border border-zinc-100">
                    <Image
                      src={rel.variants[0].image}
                      alt={rel.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="300px"
                    />
                    <span className="absolute top-3 left-3 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800">
                      {rel.model}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                      {rel.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-zinc-900">
                      ${rel.price}
                    </span>
                    <span className="block text-[10px] font-mono text-zinc-400">
                      approx. ₹{Math.round(rel.price * 83).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/products/${rel.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Drawer & Minimalist Global Footer */}
      <CartDrawer />
      <Footer />

      {/* Review Photo High-Resolution Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
              <span className="font-mono flex items-center gap-1.5 text-zinc-300">
                <Camera className="w-3.5 h-3.5" />
                Verified Buyer Hardware Media
              </span>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <Image
                src={activeLightboxImage}
                alt="High-resolution verified buyer hardware photo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
