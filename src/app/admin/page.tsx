"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Cpu,
  RefreshCw,
  Flame,
  ArrowLeft,
  Package,
  ShoppingBag,
  Zap,
  Save,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Radio,
  Tag,
  Plus,
  Trash2,
  Sliders,
  Layers,
  Star,
  Check,
  ExternalLink,
  Camera,
  Boxes,
  Key,
  Users,
  Crown,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  User as UserIcon,
  Upload,
} from "lucide-react";
import { ProductData, Order, IVariant, Review, IReview } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

const DEFAULT_REVALIDATE_SECRET = "ancwave_revalidation_secret_token_2026";

export default function AdminPage() {
  const {
    user,
    isAdmin,
    isOwner,
    isLoading,
    isDayTokenVerified,
    verifyDayPasscode,
    lockDashboard,
    setIsAuthModalOpen,
    logout,
    refreshUser,
    login,
    signup,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "inventory" | "variation-engine" | "reviews" | "team"
  >("inventory");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("form-01");
  const [product, setProduct] = useState<ProductData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & IReview)[]>([]);

  // Daily Passcode Gate State
  const [passcodeInput, setPasscodeInput] = useState<string>("ancwave-ops-secure-2026");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState<boolean>(false);

  // Dedicated Admin Authentication Gateway State
  const [adminAuthTab, setAdminAuthTab] = useState<"signin" | "signup">("signin");
  const [adminEmail, setAdminEmail] = useState<string>("owner@ancwave.com");
  const [adminPassword, setAdminPassword] = useState<string>("ownerpassword123");
  const [adminName, setAdminName] = useState<string>("");
  const [adminRegistrationPasscode, setAdminRegistrationPasscode] = useState<string>("ancwave-ops-secure-2026");
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState<boolean>(false);

  // Team Management State (Owner Exclusive)
  const [teamUsers, setTeamUsers] = useState<
    { id: string; email: string; name: string; role: string; createdAt: string }[]
  >([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");
  const [isSearchingTeam, setIsSearchingTeam] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Inventory Inputs
  const [stockInput, setStockInput] = useState<number>(4);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(true);
  const [revalidateSecret, setRevalidateSecret] = useState<string>(DEFAULT_REVALIDATE_SECRET);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  // Variation Engine State
  const [masterProductId, setMasterProductId] = useState<string>("ANC-FORM-01");
  const [masterName, setMasterName] = useState<string>("");
  const [masterDescription, setMasterDescription] = useState<string>("");
  const [masterType, setMasterType] = useState<string>("Over-Ear Headphones");
  const [masterBasePrice, setMasterBasePrice] = useState<number>(349);
  const [masterBaseDiscount, setMasterBaseDiscount] = useState<number>(0);
  const [globalSpecsList, setGlobalSpecsList] = useState<{ key: string; value: string }[]>([]);
  const [childVariants, setChildVariants] = useState<IVariant[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState<boolean>(false);

  const fetchAdminData = async (slugToFetch?: string) => {
    try {
      const target = slugToFetch || selectedSlug;

      // 1. Fetch all products
      const allRes = await fetch("/api/product?all=true");
      if (allRes.ok) {
        const allData = await allRes.json();
        setProducts(allData.products || []);
      }

      // 2. Fetch targeted product
      const prodRes = await fetch(`/api/product?slug=${target}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const p: ProductData = data.product;
        setProduct(p);
        setStockInput(p.stock);
        setDiscountInput(p.activeDiscount || 0);
        setIsFlashSale(p.isFlashSale ?? true);

        // Populate Variation Engine
        setMasterProductId(p.productId || `ANC-${p.id.toUpperCase()}`);
        setMasterName(p.name);
        setMasterDescription(p.description);
        setMasterType(p.type || "Over-Ear Headphones");
        setMasterBasePrice(p.basePrice || p.price);
        setMasterBaseDiscount(p.baseDiscount || 0);

        if (p.globalSpecs) {
          setGlobalSpecsList(
            Object.entries(p.globalSpecs).map(([key, value]) => ({ key, value }))
          );
        } else {
          setGlobalSpecsList([
            { key: "Acoustic Architecture", value: "Bio-Cellulose Transducer" },
            { key: "ANC Level", value: "-42 dB Vector Adaptive" },
            { key: "Battery", value: "38 Hours" },
          ]);
        }

        if (p.childVariants && p.childVariants.length > 0) {
          setChildVariants(p.childVariants);
        } else {
          // Initialize fallback variants from color variants
          setChildVariants(
            (p.variants || []).map((v, i) => ({
              sku: `${p.productId || "ANC"}-${v.name.toUpperCase().replace(/\s+/g, "")}-${i === 0 ? "BOOM" : "INT"}`,
              color: v.name,
              specOverride: i === 0 ? "Detachable Boom Mic" : "Integrated Beamforming Mic",
              price: p.price,
              discount: 0,
              stock: Math.max(1, Math.floor(p.stock / (p.variants.length || 1))),
              images: [v.image],
            }))
          );
        }
      }

      // 3. Fetch completed orders
      const ordRes = await fetch("/api/checkout");
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }

      // 4. Fetch reviews for selected product
      const revRes = await fetch(`/api/reviews?productId=${target}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedSlug]);

  // Handle master stock adjustment
  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          stock: Number(stockInput),
          activeDiscount: Number(discountInput),
          isFlashSale,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        toast({
          type: "success",
          title: "Real-Time Inventory Synced",
          description: `Stock adjusted to ${data.product.stock} units. ISR cache wiped via REVALIDATE_SECRET.`,
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update real-time stock",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle on-demand Next.js ISR purging using REVALIDATE_SECRET
  const handlePurgeAndRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": revalidateSecret,
        },
        body: JSON.stringify({
          path: `/products/${selectedSlug}`,
          tag: "product-details",
          secret: revalidateSecret,
        }),
      });

      const data = await res.json();
      if (data.revalidated) {
        toast({
          type: "success",
          title: "Next.js ISR Cache Wiped",
          description: `Secret verified · Event ID: ${data.awsEventId}. Edge cache purged.`,
        });
        fetchAdminData();
      } else {
        toast({
          type: "error",
          title: "Revalidation Failed",
          description: data.error || "Secret rejection from edge",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Network Error",
        description: "Failed to contact revalidation endpoint",
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  // Quick variant stock adjuster
  const handleQuickVariantStock = async (sku: string, newStock: number) => {
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          variantSku: sku,
          variantStock: Math.max(0, newStock),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variant Stock Updated",
          description: `SKU ${sku} set to ${newStock} units. Live stock: ${data.product.stock}`,
        });
      }
    } catch {
      toast({ type: "error", title: "Stock Update Failed", description: "Could not update variant stock" });
    }
  };

  // Add a new child variant dynamically
  const handleAddChildVariant = () => {
    const newSku = `${masterProductId}-VAR-${childVariants.length + 1}`;
    setChildVariants([
      ...childVariants,
      {
        sku: newSku,
        color: "New Color",
        specOverride: "Custom Variant Feature (e.g., Detachable Mic)",
        price: masterBasePrice,
        discount: 0,
        stock: 5,
        images: ["/images/hero-silver.jpg"],
      },
    ]);
  };

  // Remove child variant
  const handleRemoveChildVariant = (index: number) => {
    if (childVariants.length <= 1) {
      toast({ type: "info", title: "Minimum 1 Variant", description: "Products must have at least one child variant." });
      return;
    }
    const updated = [...childVariants];
    updated.splice(index, 1);
    setChildVariants(updated);
  };

  // Update variant field
  const handleVariantChange = (index: number, field: keyof IVariant, value: any) => {
    const updated = [...childVariants];
    updated[index] = { ...updated[index], [field]: value };
    setChildVariants(updated);
  };

  // Multi-Image Variant Asset Helpers
  const [isVariantUploading, setIsVariantUploading] = useState<number | null>(null);

  const handleVariantAddImage = (variantIdx: number, url = "") => {
    const updated = [...childVariants];
    const currentImages = updated[variantIdx].images || [];
    updated[variantIdx] = {
      ...updated[variantIdx],
      images: [...currentImages, url || "/images/hero-silver.jpg"],
    };
    setChildVariants(updated);
  };

  const handleVariantUpdateImage = (variantIdx: number, imgIdx: number, newUrl: string) => {
    const updated = [...childVariants];
    const currentImages = [...(updated[variantIdx].images || [])];
    currentImages[imgIdx] = newUrl;
    updated[variantIdx] = {
      ...updated[variantIdx],
      images: currentImages,
    };
    setChildVariants(updated);
  };

  const handleVariantRemoveImage = (variantIdx: number, imgIdx: number) => {
    const updated = [...childVariants];
    const currentImages = [...(updated[variantIdx].images || [])];
    if (currentImages.length <= 1) {
      toast({
        type: "info",
        title: "Minimum 1 Photo Required",
        description: "Each variant requires at least one primary showcase image.",
      });
      return;
    }
    currentImages.splice(imgIdx, 1);
    updated[variantIdx] = {
      ...updated[variantIdx],
      images: currentImages,
    };
    setChildVariants(updated);
  };

  const handleVariantDirectS3Upload = async (variantIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsVariantUploading(variantIdx);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const presignRes = await fetch("/api/reviews/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `variant-${variantIdx}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`,
            contentType: file.type || "image/jpeg",
          }),
        });

        const presignData = await presignRes.json();
        if (!presignData.success || !presignData.uploadUrl) {
          throw new Error(presignData.error || "Failed to generate S3 upload signature");
        }

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Direct S3 upload failed");
        }

        uploadedUrls.push(presignData.publicUrl);
      }

      const updated = [...childVariants];
      const existing = updated[variantIdx].images || [];
      updated[variantIdx] = {
        ...updated[variantIdx],
        images: [...existing, ...uploadedUrls],
      };
      setChildVariants(updated);

      toast({
        type: "success",
        title: "S3 Image Pipeline Complete",
        description: `Uploaded and attached ${uploadedUrls.length} image(s) to ${updated[variantIdx].color}.`,
      });
    } catch (err: any) {
      console.error("Variant image upload error:", err);
      toast({
        type: "error",
        title: "Image Upload Failed",
        description: err.message || "Failed to upload image to S3 bucket.",
      });
    } finally {
      setIsVariantUploading(null);
      e.target.value = "";
    }
  };

  // Global specs helper
  const handleSpecChange = (index: number, key: string, value: string) => {
    const updated = [...globalSpecsList];
    updated[index] = { key, value };
    setGlobalSpecsList(updated);
  };

  const handleAddSpecRow = () => {
    setGlobalSpecsList([...globalSpecsList, { key: "New Spec", value: "Value" }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    const updated = [...globalSpecsList];
    updated.splice(index, 1);
    setGlobalSpecsList(updated);
  };

  // Save full master product & child variants
  const handleSaveVariationEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVariants(true);
    try {
      const globalSpecsRecord = globalSpecsList.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
        return acc;
      }, {} as Record<string, string>);

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          productId: masterProductId,
          name: masterName,
          description: masterDescription,
          type: masterType,
          basePrice: Number(masterBasePrice),
          baseDiscount: Number(masterBaseDiscount),
          globalSpecs: globalSpecsRecord,
          childVariants,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variation Engine Synced",
          description: `Saved ${childVariants.length} child variants. Master stock computed to ${data.product.stock} units. ISR purged.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Save Failed", description: "Failed to persist variation engine configuration" });
    } finally {
      setIsSavingVariants(false);
    }
  };

  // Quick Demo Buyer Verification
  const handleQuickDemoVerify = async () => {
    try {
      const res = await fetch("/api/reviews/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedSlug }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Demo Purchase Recorded",
          description: `Order ${data.orderNumber} placed for active user. Review form is now unlocked!`,
        });
        fetchAdminData();
      } else {
        toast({
          type: "error",
          title: "Verification Failed",
          description: data.error || "Please sign in to link demo purchase",
        });
      }
    } catch {
      toast({ type: "error", title: "Error", description: "Failed to create demo purchase" });
    }
  };

  // Fetch team members (Owner only)
  const fetchTeam = async (query = "") => {
    setIsSearchingTeam(true);
    try {
      const res = await fetch(`/api/admin/team?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setTeamUsers(data.users || []);
      } else {
        toast({ type: "error", title: "Team Query Failed", description: data.error });
      }
    } catch {
      toast({ type: "error", title: "Network Error", description: "Could not fetch team members" });
    } finally {
      setIsSearchingTeam(false);
    }
  };

  // Assign or Revoke Admin role (Owner only)
  const handleUpdateUserRole = async (targetEmail: string, newRole: "admin" | "user") => {
    setIsUpdatingRole(targetEmail);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: newRole === "admin" ? "Admin Access Granted" : "Admin Access Revoked",
          description: data.message,
        });
        fetchTeam(teamSearchQuery);
      } else {
        toast({ type: "error", title: "Update Failed", description: data.error });
      }
    } catch {
      toast({ type: "error", title: "Network Error", description: "Failed to update employee role" });
    } finally {
      setIsUpdatingRole(null);
    }
  };

  // Verify daily operations passcode
  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingPasscode(true);
    const result = await verifyDayPasscode(passcodeInput);
    setIsVerifyingPasscode(false);
    if (result.success) {
      toast({
        type: "success",
        title: "24-Hour Day-Token Active",
        description: "Operations passcode verified. Terminal unlocked for 24 hours.",
      });
      fetchAdminData();
      if (isOwner) fetchTeam();
    } else {
      toast({
        type: "error",
        title: "Passcode Rejected",
        description: result.error || "Invalid daily operations passcode.",
      });
    }
  };

  // Lock dashboard immediately
  const handleLock = async () => {
    await lockDashboard();
    toast({
      type: "info",
      title: "Session Locked",
      description: "24-hour day-token cleared. Passcode required to re-enter.",
    });
  };

  // Handle Dedicated Admin Portal Login & Registration
  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminAuthLoading(true);

    if (adminAuthTab === "signup") {
      if (!adminName.trim()) {
        toast({ type: "error", title: "Name Required", description: "Please enter your full name." });
        setIsAdminAuthLoading(false);
        return;
      }
      const res = await signup(adminEmail, adminPassword, adminName, adminRegistrationPasscode);
      setIsAdminAuthLoading(false);
      if (res.success) {
        toast({
          type: "success",
          title: "Admin Account Created",
          description: `Welcome, ${adminName}! Your staff account is authorized. Enter today's passcode to unlock.`,
        });
      } else {
        toast({
          type: "error",
          title: "Registration Failed",
          description: res.error || "Please verify your passcode and credentials.",
        });
      }
    } else {
      const res = await login(adminEmail, adminPassword);
      setIsAdminAuthLoading(false);
      if (res.success) {
        toast({
          type: "success",
          title: "Admin Authenticated",
          description: `Welcome back! Please enter today's 24-hour passcode to proceed.`,
        });
      } else {
        toast({
          type: "error",
          title: "Authentication Failed",
          description: res.error || "Invalid administrator credentials.",
        });
      }
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">
            Verifying cryptographic token & authorization...
          </p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In Screen - Dedicated Admin Operations Gateway
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Terminal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Operations Console</span>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full uppercase font-bold">
                    Admin
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Restricted Staff & Owner Terminal</p>
              </div>
            </div>
          </div>

          {/* Admin Mode Switcher: Sign In vs Register Admin */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl text-xs font-semibold border border-zinc-800">
            <button
              type="button"
              onClick={() => setAdminAuthTab("signin")}
              className={`py-2 rounded-lg transition-all ${
                adminAuthTab === "signin"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => setAdminAuthTab("signup")}
              className={`py-2 rounded-lg transition-all ${
                adminAuthTab === "signup"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register Admin
            </button>
          </div>

          {/* Quick 1-Click Presets for Administrator Access */}
          {adminAuthTab === "signin" && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
                Authorized Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail("owner@ancwave.com");
                    setAdminPassword("ownerpassword123");
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Owner Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail("admin@ancwave.com");
                    setAdminPassword("adminpassword123");
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[11px] font-semibold hover:bg-blue-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Admin Form */}
          <form onSubmit={handleAdminAuthSubmit} className="space-y-3.5">
            {adminAuthTab === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Himesh Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Staff Email Address</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="staff@ancwave.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Staff Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {adminAuthTab === "signup" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Master Operations Passcode</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminRegistrationPasscode("ancwave-ops-secure-2026")}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline"
                  >
                    Paste Default
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={adminRegistrationPasscode}
                  onChange={(e) => setAdminRegistrationPasscode(e.target.value)}
                  placeholder="Enter DAILY_ADMIN_PASSCODE..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-sm text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-400">
                  Required to register authorized admin accounts on the live server.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAdminAuthLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isAdminAuthLoading
                  ? "Verifying Credentials..."
                  : adminAuthTab === "signup"
                  ? "Register Admin & Authorize"
                  : "Sign In to Terminal"}
              </span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Logged In but Not Owner/Admin Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-lg w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Access Restricted</h2>
            <p className="text-xs text-zinc-400">
              Logged in as <span className="text-white font-mono">{user.email}</span> with role{" "}
              <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                {user.role}
              </span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs text-zinc-300">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Staff Authorization Required:</span>
            </div>
            <div className="space-y-2.5 text-[11px] leading-relaxed text-zinc-400">
              <p>
                This terminal is reserved for Owners and Administrators. Customer accounts cannot access live stock adjustments, pricing variation engines, or edge invalidation controls.
              </p>
              <p>
                To access this console, log out and sign in with your staff account or register as an admin using your master operations passcode.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => refreshUser()}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Role</span>
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all text-center"
            >
              Log Out & Sign In as Admin
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated as Owner or Admin, but Day-Token Not Verified Screen
  if (!isDayTokenVerified) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">
                  24-Hour Security Gate
                </h2>
                <p className="text-[11px] text-zinc-400">Daily Operations Passcode Required</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${
                isOwner
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-zinc-300">
              Welcome back, <strong className="text-white">{user.name}</strong>.
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              To guarantee operational security, Owner and Admin accounts must enter today&apos;s operations passcode (<code className="text-emerald-400 font-mono">DAILY_ADMIN_PASSCODE</code>) to obtain a 24-hour session day-token.
            </p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Daily Passcode</label>
                <button
                  type="button"
                  onClick={() => setPasscodeInput("ancwave-ops-secure-2026")}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline"
                >
                  Paste Default
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter daily passcode..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPasscode ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock 24h Dashboard Session</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800">
            <button
              onClick={logout}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign Out
            </button>
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] text-zinc-950 font-sans pb-24">
      {/* Top Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                  ancwave Product & Inventory Console
                </h1>
                <p className="text-[11px] text-zinc-500 hidden sm:block">
                  Real-time stock orchestration, variation engine & ISR revalidation
                </p>
              </div>
            </div>
          </div>

          {/* Product Selector, Edge Cache Purge & Security Session Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User Role Badge */}
            {isOwner ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Owner</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Admin</span>
              </span>
            )}

            {/* 24h Day-Token Active Pill */}
            <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>24h Session Active</span>
            </span>

            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl px-2.5 sm:px-3 py-2 font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            >
              <option value="form-01">Form 01 (Over-Ear)</option>
              <option value="form-air-tws">Form Air TWS (Earbuds)</option>
              <option value="form-pulse-iem">Form Pulse IEM (Sports)</option>
            </select>

            <button
              onClick={handlePurgeAndRevalidate}
              disabled={isRevalidating}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {isRevalidating ? "Purging Edge..." : "Wipe ISR Cache"}
              </span>
              <span className="sm:hidden">Wipe</span>
            </button>

            {/* Console Lock Button */}
            <button
              onClick={handleLock}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Lock Dashboard Session"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 border-t border-zinc-100 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Stock Orchestration & ISR</span>
          </button>

          <button
            onClick={() => setActiveTab("variation-engine")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "variation-engine"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>The Variation Engine ({childVariants.length} Child Variants)</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "reviews"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Customer Reviews & Media ({reviews.length})</span>
          </button>

          {isOwner && (
            <button
              onClick={() => {
                setActiveTab("team");
                fetchTeam(teamSearchQuery);
              }}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "team"
                  ? "border-amber-600 text-amber-600 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>Team Access & Roles (Owner Only)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>LIVE TOTAL STOCK</span>
              <Package className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-950">
              {product ? product.stock : 4} <span className="text-xs font-normal text-zinc-500">units</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {product && product.stock <= (product.lowStockThreshold || 5) ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Few Left alert triggered (&le;5)
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">Healthy inventory levels</span>
              )}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>ROOT PRODUCT CODE</span>
              <Boxes className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-900 font-mono truncate">
              {masterProductId}
            </div>
            <p className="text-[11px] text-zinc-500">
              {childVariants.length} active child variants attached
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>DYNAMIC RATING</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-950 flex items-center gap-2">
              {product?.averageRating || product?.rating || 4.9}★
              <span className="text-xs font-normal text-zinc-500">
                ({product?.reviewCount || reviews.length} reviews)
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Computed dynamically from reviews
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>ISR REVALIDATION</span>
              <Key className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-4 h-4" /> REVALIDATE_SECRET Active
            </div>
            <p className="text-[11px] text-zinc-500 font-mono truncate">
              Last: {product?.lastRevalidatedAt ? new Date(product.lastRevalidatedAt).toLocaleTimeString() : "Recent"}
            </p>
          </div>
        </div>

        {/* TAB 1: REAL-TIME STOCK ORCHESTRATION & ISR */}
        {activeTab === "inventory" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Form: Real-time Stock Modifier */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">
                    Adjust Master Stock & Flash Alert Badge
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Setting stock to 5 or lower triggers the animated “🔥 Few left!” badge instantaneously for edge visitors.
                  </p>
                </div>

                <form onSubmit={handleUpdateInventory} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Total Inventory Units ({product?.name})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={stockInput}
                        onChange={(e) => setStockInput(Number(e.target.value))}
                        className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setStockInput(3)}
                        className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
                      >
                        Quick Set: 3 (Few Left)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockInput(15)}
                        className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition-colors"
                      >
                        Quick Set: 15
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Active Instant Discount ($ Off MSRP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <input
                      type="checkbox"
                      id="flashSaleToggle"
                      checked={isFlashSale}
                      onChange={(e) => setIsFlashSale(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="flashSaleToggle" className="text-xs font-medium text-zinc-700 cursor-pointer">
                      Enable "Few Left" Flash Alert Trigger when stock &le; 5 units
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>REVALIDATE_SECRET Token</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Header: x-revalidate-secret</span>
                    </label>
                    <input
                      type="text"
                      value={revalidateSecret}
                      onChange={(e) => setRevalidateSecret(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 bg-zinc-50 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdating ? "Saving & Purging..." : "Save Stock & Purge Stale Cache"}</span>
                  </button>
                </form>
              </div>

              {/* Right: Real-time Child Variant Stock Quick Toggles */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">
                      Child Variant Real-Time Inventory
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Individual SKU counters mutate the master inventory count in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("variation-engine")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Manage Engine &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {childVariants.map((v) => (
                    <div
                      key={v.sku}
                      className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">{v.color}</span>
                          <span className="text-[10px] font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                            {v.sku}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {v.specOverride || "Standard spec"} · ${v.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleQuickVariantStock(v.sku, Math.max(0, v.stock - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-sm shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-sm text-zinc-900">
                          {v.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickVariantStock(v.sku, v.stock + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-sm shadow-xs"
                        >
                          +
                        </button>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-md font-semibold font-mono ${
                            v.stock === 0
                              ? "bg-red-100 text-red-700"
                              : v.stock <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {v.stock === 0 ? "SOLD OUT" : v.stock <= 5 ? "LOW STOCK" : "IN STOCK"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CloudFront / ISR Information */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-zinc-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Edge ISR & EventBridge Synchronization</span>
                  </div>
                  <p>
                    Every inventory mutation triggers an AWS EventBridge <code>StockUpdated</code> event and issues Next.js on-demand ISR revalidation via <code>revalidatePath</code>, ensuring subsequent visitors hit zero-latency CloudFront edge caches.
                  </p>
                </div>
              </div>
            </div>

            {/* Completed Transactions Table */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-zinc-500" />
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                    Completed Customer Transactions ({orders.length})
                  </h3>
                </div>
                <button
                  onClick={handleQuickDemoVerify}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  ＋ Add Demo Verified Purchase
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No orders yet. Place a test order via the checkout flow.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-mono">
                        <th className="py-2.5 font-normal">ORDER #</th>
                        <th className="py-2.5 font-normal">CUSTOMER</th>
                        <th className="py-2.5 font-normal">PRODUCT / SKU</th>
                        <th className="py-2.5 font-normal">STATUS</th>
                        <th className="py-2.5 font-normal">TOTAL</th>
                        <th className="py-2.5 font-normal">EVENT LOG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {orders.slice(0, 8).map((ord) => (
                        <tr key={ord.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 font-mono font-bold text-zinc-900">{ord.orderNumber}</td>
                          <td className="py-3 text-zinc-700">
                            <div>{ord.customer.fullName}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{ord.customer.email}</div>
                          </td>
                          <td className="py-3 text-zinc-600">
                            {ord.items.map((i, idx) => (
                              <div key={idx} className="truncate max-w-[200px]">
                                {i.name} ({i.variantName})
                              </div>
                            ))}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                              {ord.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-zinc-900">${ord.total.toFixed(2)}</td>
                          <td className="py-3 text-zinc-400 font-mono text-[10px]">
                            {ord.awsEventBridgeDispatched ? "AWS Dispatched" : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: THE VARIATION ENGINE */}
        {activeTab === "variation-engine" && (
          <form onSubmit={handleSaveVariationEngine} className="space-y-8 animate-in fade-in duration-200">
            {/* Master Product Header */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-bold text-zinc-950 font-sans">
                      The Variation Engine: Master Product Configuration
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Define parent product parameters and link dynamic child variants with specialized hardware features and stock allocations.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingVariants}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingVariants ? "Saving Engine..." : "Save Master & Child Variants"}</span>
                </button>
              </div>

              {/* Master Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">
                    Root Product Code (productId)
                  </label>
                  <input
                    type="text"
                    value={masterProductId}
                    onChange={(e) => setMasterProductId(e.target.value)}
                    placeholder="e.g. ANC-AIR-TWS"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-zinc-900 bg-zinc-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Product Name</label>
                  <input
                    type="text"
                    value={masterName}
                    onChange={(e) => setMasterName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 bg-zinc-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Audio Category Type</label>
                  <select
                    value={masterType}
                    onChange={(e) => setMasterType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                  >
                    <option value="Over-Ear Headphones">Over-Ear Headphones</option>
                    <option value="TWS Earbuds">TWS Earbuds</option>
                    <option value="Wireless Earphones">Wireless Earphones</option>
                    <option value="Studio Reference Monitors">Studio Reference Monitors</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-semibold text-zinc-700">Description</label>
                  <textarea
                    rows={2}
                    value={masterDescription}
                    onChange={(e) => setMasterDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Base Master Price ($)</label>
                  <input
                    type="number"
                    value={masterBasePrice}
                    onChange={(e) => setMasterBasePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Base Master Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={masterBaseDiscount}
                    onChange={(e) => setMasterBaseDiscount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50"
                  />
                </div>
              </div>

              {/* Shared Global Specs Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                    Shared Global Specifications (All Variants)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    ＋ Add Spec Attribute
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {globalSpecsList.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, e.target.value, spec.value)}
                        placeholder="Spec Name"
                        className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-medium text-zinc-800"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, spec.key, e.target.value)}
                        placeholder="Specification Value"
                        className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        className="text-zinc-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Child Variants List */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-950 font-sans">
                    Child Variant Allocations ({childVariants.length} Active)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    E.g., Variant A with a detachable mic vs. Variant B with an integrated dual-beamforming mic.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddChildVariant}
                  className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Child Variant</span>
                </button>
              </div>

              <div className="space-y-4">
                {childVariants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200 space-y-4 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          {variant.color || "Untitled Variant"}
                        </span>
                        <span className="text-[10px] font-mono bg-zinc-200 px-2 py-0.5 rounded text-zinc-700">
                          {variant.sku}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveChildVariant(idx)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600">SKU (Stock Keeping Unit)</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600">Color Variant</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-zinc-600">
                          Feature Spec Override (e.g., Detachable Mic vs Built-in)
                        </label>
                        <input
                          type="text"
                          value={variant.specOverride}
                          onChange={(e) => handleVariantChange(idx, "specOverride", e.target.value)}
                          placeholder="e.g. Detachable Mic, Attached Mic"
                          className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600">Variant Price ($)</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(idx, "price", Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600">Discount (%)</label>
                        <input
                          type="number"
                          value={variant.discount}
                          onChange={(e) => handleVariantChange(idx, "discount", Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-600">Real-Time Inventory (Units)</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(idx, "stock", Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-bold font-mono bg-white border border-zinc-200 rounded-xl text-blue-900"
                        />
                      </div>
                    </div>

                    {/* Dedicated Multi-Image Asset Management */}
                    <div className="pt-4 border-t border-zinc-200/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                              Variant Photography & Angle Assets ({(variant.images || []).length} Attached)
                            </h4>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            First photo acts as the primary storefront hero. Add multiple angles, macro details, and lifestyle shots.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`file-variant-upload-${idx}`}
                            className="cursor-pointer inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isVariantUploading === idx ? "Uploading to S3..." : "Direct S3 Upload"}</span>
                          </label>
                          <input
                            id={`file-variant-upload-${idx}`}
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isVariantUploading === idx}
                            onChange={(e) => handleVariantDirectS3Upload(idx, e)}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => handleVariantAddImage(idx)}
                            className="inline-flex items-center gap-1 text-xs bg-white hover:bg-zinc-100 text-zinc-800 font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Angle</span>
                          </button>
                        </div>
                      </div>

                      {/* Attached Images Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {(variant.images && variant.images.length > 0 ? variant.images : ["/images/hero-silver.jpg"]).map(
                          (imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2 relative group hover:border-zinc-300 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    imgIdx === 0
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : "bg-zinc-100 text-zinc-700"
                                  }`}
                                >
                                  {imgIdx === 0 ? "★ Primary Cover" : `Angle 0${imgIdx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleVariantRemoveImage(idx, imgIdx)}
                                  className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                  title="Remove angle"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="relative aspect-16/10 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center">
                                <img
                                  src={imgUrl}
                                  alt={`Variant ${variant.color} angle ${imgIdx + 1}`}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = "0.3";
                                  }}
                                />
                              </div>

                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={imgUrl}
                                  onChange={(e) => handleVariantUpdateImage(idx, imgIdx, e.target.value)}
                                  placeholder="/images/... or https://..."
                                  className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:bg-white"
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Quick Asset Presets Picker */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-mono text-zinc-400">Quick Presets:</span>
                        {[
                          { name: "Silver Studio", url: "/images/hero-silver.jpg" },
                          { name: "Graphite Studio", url: "/images/hero-graphite.jpg" },
                          { name: "Sandstone Studio", url: "/images/hero-sandstone.jpg" },
                          { name: "Aluminum Gimbal", url: "/images/feature-aluminum.jpg" },
                          { name: "Foam Cushion", url: "/images/feature-foam.jpg" },
                          { name: "Rotary Dial", url: "/images/feature-dial.jpg" },
                          { name: "Exploded X-Ray", url: "/images/exploded-assembly.jpg" },
                          { name: "Workspace Scene", url: "/images/lifestyle-workspace.jpg" },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleVariantAddImage(idx, preset.url)}
                            className="text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded transition-colors"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingVariants}
                  className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingVariants ? "Persisting Changes..." : "Save All & Revalidate Edge ISR"}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: CUSTOMER REVIEWS & MEDIA PIPELINE */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-950 font-sans flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>Customer Reviews & 5-Photo Media Pipeline</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Conditional verification requires active JWT + verified order. Media uploads directly to S3 via presigned URLs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/products/${selectedSlug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <span>View on Storefront</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={handleQuickDemoVerify}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
                  >
                    ＋ Grant Verified Order
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reviews.map((rev) => (
                  <div
                    key={rev.id || rev.reviewId}
                    className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      </div>

                      <p className="text-xs text-zinc-800 leading-relaxed font-sans">
                        {rev.comment}
                      </p>

                      {/* Photo Gallery (Max 5 photos) */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            <span>{rev.images.length} Verified Media Asset(s)</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {rev.images.map((imgUrl, i) => (
                              <div
                                key={i}
                                className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 shrink-0"
                              >
                                <Image
                                  src={imgUrl}
                                  alt={`Review Photo ${i + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
                      <div>
                        <span className="font-bold text-zinc-900">{rev.author || rev.userName}</span>
                        <span className="text-zinc-400"> · {rev.variant || "Form 01"}</span>
                      </div>
                      <span className="font-mono">{rev.createdAt || "Recent"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OWNER TEAM ACCESS & ROLE ASSIGNMENT */}
        {activeTab === "team" && isOwner && (
          <div className="space-y-6">
            {/* Top Control Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                      Owner Operations Console · Team Access & Permissions
                    </h2>
                    <p className="text-xs text-zinc-600">
                      Search employees by email and dynamically grant or revoke Admin permissions in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Root Owner Authority: Active</span>
                  </span>
                </div>
              </div>

              {/* Architecture Steps Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Employee Sign Up</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    When employees create an account on ancwave, their account is initialized with default{" "}
                    <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-bold">
                      role: &quot;user&quot;
                    </code>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>Grant Admin Access</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Search their email below and click{" "}
                    <strong className="text-emerald-700 font-semibold">&quot;Grant Admin Access&quot;</strong>. They gain access to manage inventory, variations, and review pipelines.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 space-y-1.5 shadow-xs">
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Revoke Anytime</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Click{" "}
                    <strong className="text-red-700 font-semibold">&quot;Revoke Admin&quot;</strong>{" "}
                    to instantly demote them back to user. Root Owner accounts are managed directly in MongoDB Atlas.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar & Teammates Directory */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => {
                      setTeamSearchQuery(e.target.value);
                      fetchTeam(e.target.value);
                    }}
                    placeholder="Search teammate by email (e.g. employee@ancwave.com) or full name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-zinc-50/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchTeam(teamSearchQuery)}
                    disabled={isSearchingTeam}
                    className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingTeam ? "animate-spin" : ""}`} />
                    <span>Search Directory</span>
                  </button>
                  {teamSearchQuery && (
                    <button
                      onClick={() => {
                        setTeamSearchQuery("");
                        fetchTeam("");
                      }}
                      className="px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Teammates List Table */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                      <th className="py-3 px-4">Employee / Teammate</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {teamUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-400">
                          {isSearchingTeam ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                              <span>Querying accounts in database...</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-semibold text-zinc-700">No matching accounts found</p>
                              <p className="text-[11px] text-zinc-400">
                                {teamSearchQuery
                                  ? `No registered user matches "${teamSearchQuery}". Ask your teammate to sign up on the site first.`
                                  : "Click 'Search Directory' to list registered accounts."}
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      teamUsers.map((u) => {
                        const isThisUserOwner = u.role === "owner";
                        const isThisUserAdmin = u.role === "admin";
                        const isBusy = isUpdatingRole === u.email;

                        return (
                          <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                  {u.name?.slice(0, 2).toUpperCase() || "EM"}
                                </div>
                                <div>
                                  <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {u.email.toLowerCase() === user.email.toLowerCase() && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-zinc-500">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <code className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                                {u.id}
                              </code>
                            </td>

                            <td className="py-3.5 px-4">
                              {isThisUserOwner ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  <span>Owner</span>
                                </span>
                              ) : isThisUserAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                                  <span>Admin</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  <UserIcon className="w-3 h-3 text-zinc-400" />
                                  <span>User</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isThisUserOwner ? (
                                <span className="text-[11px] font-medium text-zinc-400 italic">
                                  Root Account (Atlas Managed)
                                </span>
                              ) : isThisUserAdmin ? (
                                <button
                                  onClick={() => handleUpdateUserRole(u.email, "user")}
                                  disabled={isBusy}
                                  className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>{isBusy ? "Revoking..." : "Revoke Admin Access"}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateUserRole(u.email, "admin")}
                                  disabled={isBusy}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>{isBusy ? "Assigning..." : "Grant Admin Access"}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
