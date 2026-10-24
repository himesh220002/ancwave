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
  PackagePlus,
  FolderPlus,
  X,
  ChevronRight,
  Grid,
} from "lucide-react";
import {
  ProductData,
  Order,
  IVariant,
  IVariantGroup,
  IVariantColor,
  childVariantsToVariantGroups,
  variantGroupsToChildVariants,
  Review,
  IReview,
  ECOMMERCE_CATEGORIES,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

const DEFAULT_REVALIDATE_SECRET = "ancwave_revalidation_secret_token_2026";

export interface INewProdColor {
  id: string;
  color: string;
  hex: string;
  sku: string;
  stock: number;
  price: number;
  images: string[];
}

export interface INewProdArchitecture {
  id: string;
  name: string;
  price: number;
  variantSpecs: Array<{ key: string; value: string }>;
  colors: INewProdColor[];
}

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
  const [variantGroups, setVariantGroups] = useState<IVariantGroup[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState<boolean>(false);

  // Dedicated Variant Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<ProductData | null>(null);
  const [variantStockDrafts, setVariantStockDrafts] = useState<Record<string, number>>({});
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);

  // Dynamic Product Creator Modal State (10 Top-Selling E-Commerce Categories)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [newProdCategory, setNewProdCategory] = useState<string>("apparel-fashion");
  const [newProdName, setNewProdName] = useState<string>("");
  const [newProdSlug, setNewProdSlug] = useState<string>("");
  const [newProdModel, setNewProdModel] = useState<string>("ORGANIC HEAVYWEIGHT 450 GSM");
  const [newProdTagline, setNewProdTagline] = useState<string>("Ultra-dense combed cotton with tailored architectural cut.");
  const [newProdDescription, setNewProdDescription] = useState<string>(
    "Crafted from 100% sustainable combed cotton. Designed with dual variant architectures: A1 (Regular Fit) and A2 (Oversized Streetwear Fit)."
  );
  const [newProdPrice, setNewProdPrice] = useState<number>(120);
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<number>(145);
  const [newProdSpecs, setNewProdSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "Material / Fabric", value: "100% Organic Combed Ring-Spun Cotton" },
    { key: "Fabric Density", value: "450 GSM Heavyweight French Terry" },
    { key: "Fit Architecture", value: "A1 Regular Fit & A2 Streetwear Oversized Cut" },
    { key: "Care Instructions", value: "Cold wash inside out, lay flat to dry" },
  ]);
  const [newProdArchitectures, setNewProdArchitectures] = useState<INewProdArchitecture[]>([
    {
      id: "A1",
      name: "A1 (Regular Fit)",
      price: 120,
      variantSpecs: [{ key: "Fit Cut", value: "Regular Tailored Cut" }],
      colors: [
        { id: "c1", color: "Forest Green", hex: "#2E5339", sku: "PROD-A1-GREEN", stock: 5, price: 120, images: ["/images/lifestyle-workspace.jpg"] },
        { id: "c2", color: "Pitch Black", hex: "#1A1A1A", sku: "PROD-A1-BLACK", stock: 2, price: 120, images: ["/images/hero-graphite.jpg"] },
        { id: "c3", color: "Mineral Blue", hex: "#3B6978", sku: "PROD-A1-BLUE", stock: 4, price: 120, images: ["/images/hero-silver.jpg"] },
      ],
    },
    {
      id: "A2",
      name: "A2 (Oversized Fit)",
      price: 130,
      variantSpecs: [{ key: "Fit Cut", value: "Streetwear Oversized Drop Shoulder" }],
      colors: [
        { id: "c4", color: "Arctic White", hex: "#ECECEC", sku: "PROD-A2-WHITE", stock: 8, price: 130, images: ["/images/hero-sandstone.jpg"] },
        { id: "c5", color: "Forest Green", hex: "#2E5339", sku: "PROD-A2-GREEN", stock: 7, price: 130, images: ["/images/lifestyle-cafe.jpg"] },
      ],
    },
  ]);
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

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

        if (p.variantGroups && p.variantGroups.length > 0) {
          setVariantGroups(p.variantGroups);
          setChildVariants(
            p.childVariants && p.childVariants.length > 0
              ? p.childVariants
              : variantGroupsToChildVariants(p.variantGroups, p.basePrice || p.price)
          );
        } else if (p.childVariants && p.childVariants.length > 0) {
          setChildVariants(p.childVariants);
          setVariantGroups(childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price));
        } else {
          // Initialize fallback variant groups from color variants
          const fallbackGroups: IVariantGroup[] = [
            {
              id: "A1",
              name: "A1 (Standard Cut)",
              specOverride: "A1 (Standard Cut)",
              price: p.price,
              discount: 0,
              colors: (p.variants || []).map((v, i) => ({
                id: `A1-VAR-${i + 1}`,
                sku: `${p.productId || "ANC"}-A1-${v.name.toUpperCase().replace(/\s+/g, "")}`,
                color: v.name,
                hex: v.hex || "#22252A",
                price: p.price,
                discount: 0,
                stock: Math.max(1, Math.floor(p.stock / Math.max(1, p.variants.length))),
                images: [v.image],
              })),
            },
          ];
          setVariantGroups(fallbackGroups);
          setChildVariants(variantGroupsToChildVariants(fallbackGroups, p.price));
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

  // Quick variant stock adjuster (updates both variantGroups and childVariants)
  const handleQuickVariantStock = async (sku: string, newStock: number) => {
    try {
      const val = Math.max(0, newStock);
      // Optimistic local state update
      setVariantGroups((prev) =>
        prev.map((g) => ({
          ...g,
          colors: g.colors.map((c) => (c.sku === sku ? { ...c, stock: val } : c)),
        }))
      );
      setChildVariants((prev) =>
        prev.map((v) => (v.sku === sku ? { ...v, stock: val } : v))
      );

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          variantSku: sku,
          variantStock: val,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variant Stock Updated",
          description: `SKU ${sku} set to ${val} units. Live product inventory: ${data.product.stock} units.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Stock Update Failed", description: "Could not update variant stock" });
    }
  };

  // --- Hierarchical Variant Architecture & Colorway Studio Helpers ---

  // 1. Add a new Architecture Cut (e.g. A3)
  const handleAddArchitectureGroup = () => {
    const nextNum = variantGroups.length + 1;
    const newArchId = `A${nextNum}`;
    const newArchName = `A${nextNum} (${nextNum === 1 ? "Regular Fit" : nextNum === 2 ? "Oversized Fit" : "Performance Cut"})`;
    const newSku = `${masterProductId}-${newArchId}-BLK`;

    const newGroup: IVariantGroup = {
      id: newArchId,
      name: newArchName,
      specOverride: newArchName,
      price: masterBasePrice,
      discount: masterBaseDiscount,
      colors: [
        {
          id: `${newArchId}-C1`,
          sku: newSku,
          color: "Pitch Black",
          hex: "#1A1A1A",
          price: masterBasePrice,
          discount: 0,
          stock: 5,
          images: ["/images/hero-graphite.jpg"],
        },
      ],
    };

    const updated = [...variantGroups, newGroup];
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
    toast({
      type: "success",
      title: "Architecture Created",
      description: `Added "${newArchName}" with 1 initial colorway. Click "+ Add Color" to add more colors.`,
    });
  };

  // 2. Remove an entire Architecture
  const handleRemoveArchitectureGroup = (groupId: string) => {
    if (variantGroups.length <= 1) {
      toast({
        type: "info",
        title: "Minimum 1 Architecture Required",
        description: "Products must have at least one variant architecture.",
      });
      return;
    }
    const updated = variantGroups.filter((g) => g.id !== groupId);
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 3. Update Architecture Header
  const handleUpdateArchitectureName = (groupId: string, newName: string) => {
    const updated = variantGroups.map((g) =>
      g.id === groupId ? { ...g, name: newName, specOverride: newName } : g
    );
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleUpdateArchitecturePrice = (groupId: string, price: number) => {
    const updated = variantGroups.map((g) =>
      g.id === groupId ? { ...g, price: Math.max(0, price) } : g
    );
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 4. Add a Colorway to a specific Architecture
  const handleAddColorToArchitecture = (groupId: string, initialColor = "New Color", initialStock = 5) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const cleanName = initialColor.trim() || `Color ${g.colors.length + 1}`;
      const code = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || `C${g.colors.length + 1}`;
      const newSku = `${masterProductId}-${g.id.toUpperCase()}-${code}`;
      const colorLower = cleanName.toLowerCase();
      const hex = colorLower.includes("green") ? "#2E5339" :
                  colorLower.includes("black") ? "#1A1A1A" :
                  colorLower.includes("blue") ? "#3B6978" :
                  colorLower.includes("white") ? "#ECECEC" :
                  colorLower.includes("red") ? "#DC2626" :
                  colorLower.includes("grey") || colorLower.includes("gray") ? "#6B7280" :
                  colorLower.includes("sandstone") || colorLower.includes("beige") ? "#D4B996" :
                  "#4F46E5";

      const newColor: IVariantColor = {
        id: `${g.id}-${newSku}`,
        sku: newSku,
        color: cleanName,
        hex,
        price: g.price || masterBasePrice,
        discount: g.discount || 0,
        stock: Math.max(0, initialStock),
        images: ["/images/hero-silver.jpg"],
      };

      return {
        ...g,
        colors: [...g.colors, newColor],
      };
    });

    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
    toast({
      type: "success",
      title: "Colorway Added",
      description: `Added "${initialColor}" to ${groupId}.`,
    });
  };

  // 5. Remove a Colorway from Architecture
  const handleRemoveColorFromArchitecture = (groupId: string, colorIndex: number) => {
    const targetGroup = variantGroups.find((g) => g.id === groupId);
    if (targetGroup && targetGroup.colors.length <= 1) {
      toast({
        type: "info",
        title: "Minimum 1 Colorway Required",
        description: "Each architecture must maintain at least one colorway.",
      });
      return;
    }
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      newColors.splice(colorIndex, 1);
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 6. Update Colorway details
  const handleUpdateArchitectureColor = (
    groupId: string,
    colorIndex: number,
    field: keyof IVariantColor,
    val: any
  ) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      newColors[colorIndex] = { ...newColors[colorIndex], [field]: val };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  // 7. Multi-Image Asset Management for Architecture Colors
  const [uploadingColorKey, setUploadingColorKey] = useState<string | null>(null);

  const handleAddImageToColor = (groupId: string, colorIndex: number, url = "/images/hero-silver.jpg") => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = newColors[colorIndex].images || [];
      newColors[colorIndex] = { ...newColors[colorIndex], images: [...curImages, url] };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleUpdateImageInColor = (groupId: string, colorIndex: number, imgIndex: number, newUrl: string) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = [...(newColors[colorIndex].images || [])];
      curImages[imgIndex] = newUrl;
      newColors[colorIndex] = { ...newColors[colorIndex], images: curImages };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleRemoveImageFromColor = (groupId: string, colorIndex: number, imgIndex: number) => {
    const updated = variantGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newColors = [...g.colors];
      const curImages = [...(newColors[colorIndex].images || [])];
      if (curImages.length <= 1) {
        toast({
          type: "info",
          title: "Minimum 1 Photo Required",
          description: "Each colorway requires at least one primary showcase image.",
        });
        return g;
      }
      curImages.splice(imgIndex, 1);
      newColors[colorIndex] = { ...newColors[colorIndex], images: curImages };
      return { ...g, colors: newColors };
    });
    setVariantGroups(updated);
    setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));
  };

  const handleColorDirectS3Upload = async (
    groupId: string,
    colorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadKey = `${groupId}-${colorIndex}`;
    setUploadingColorKey(uploadKey);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const presignRes = await fetch("/api/reviews/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `variant-${groupId}-${colorIndex}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`,
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

        if (!uploadRes.ok) throw new Error("Direct S3 upload failed");
        uploadedUrls.push(presignData.publicUrl);
      }

      const updated = variantGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newColors = [...g.colors];
        const curImages = newColors[colorIndex].images || [];
        newColors[colorIndex] = { ...newColors[colorIndex], images: [...curImages, ...uploadedUrls] };
        return { ...g, colors: newColors };
      });

      setVariantGroups(updated);
      setChildVariants(variantGroupsToChildVariants(updated, masterBasePrice));

      toast({
        type: "success",
        title: "S3 Photos Uploaded",
        description: `Attached ${uploadedUrls.length} image(s) to colorway.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Upload Failed",
        description: err.message || "Failed to upload image to S3 bucket.",
      });
    } finally {
      setUploadingColorKey(null);
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

  // Save full master product & hierarchical variant groups
  const handleSaveVariationEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVariants(true);
    try {
      const globalSpecsRecord = globalSpecsList.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
        return acc;
      }, {} as Record<string, string>);

      const syncedChildVariants = variantGroupsToChildVariants(variantGroups, Number(masterBasePrice));

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
          variantGroups,
          childVariants: syncedChildVariants,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        setStockInput(data.product.stock);
        toast({
          type: "success",
          title: "Variation Engine Synced",
          description: `Saved ${variantGroups.length} architectures with ${data.product.childVariants?.length || 0} colors. Live stock: ${data.product.stock} units. ISR purged.`,
        });
      } else {
        toast({ type: "error", title: "Save Failed", description: data.error || "Could not save variation engine." });
      }
    } catch {
      toast({ type: "error", title: "Save Failed", description: "Failed to persist variation engine configuration" });
    } finally {
      setIsSavingVariants(false);
    }
  };

  // Open Dedicated Variant Restock Modal
  const openRestockModal = (target: ProductData) => {
    setRestockTargetProduct(target);
    const drafts: Record<string, number> = {};
    if (target.variantGroups && target.variantGroups.length > 0) {
      target.variantGroups.forEach((g) => {
        g.colors.forEach((c) => {
          drafts[c.sku] = c.stock;
        });
      });
    } else if (target.childVariants && target.childVariants.length > 0) {
      target.childVariants.forEach((v) => {
        drafts[v.sku] = v.stock;
      });
    } else if (target.variants && target.variants.length > 0) {
      target.variants.forEach((v, i) => {
        const sku = `${target.productId || target.id.toUpperCase()}-VAR-${i + 1}`;
        drafts[sku] = Math.max(1, Math.floor(target.stock / target.variants.length));
      });
    }
    setVariantStockDrafts(drafts);
    setIsRestockModalOpen(true);
  };

  // Add a Colorway directly from the Restock Modal with instant persistence
  const handleModalAddColor = async (groupIdOrName: string, colorName: string, stock: number) => {
    if (!restockTargetProduct) return;
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "addColor",
          groupId: groupIdOrName,
          color: {
            color: colorName,
            stock: Math.max(0, stock),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) {
          setVariantGroups(data.product.variantGroups);
        }
        if (data.product.childVariants) {
          setChildVariants(data.product.childVariants);
        }
        const updatedDrafts = { ...variantStockDrafts };
        data.product.childVariants?.forEach((v: IVariant) => {
          if (updatedDrafts[v.sku] === undefined) {
            updatedDrafts[v.sku] = v.stock;
          }
        });
        setVariantStockDrafts(updatedDrafts);
        setStockInput(data.product.stock);

        toast({
          type: "success",
          title: "Color Added & Revalidated",
          description: `Added "${colorName}" (${stock} units) to ${groupIdOrName}.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Add Color Failed", description: "Could not add color to architecture." });
    }
  };

  // Remove a Colorway directly from the Restock Modal
  const handleModalRemoveColor = async (sku: string) => {
    if (!restockTargetProduct) return;
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          action: "removeColor",
          variantSku: sku,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setRestockTargetProduct(data.product);
        setProduct(data.product);
        if (data.product.variantGroups) setVariantGroups(data.product.variantGroups);
        if (data.product.childVariants) setChildVariants(data.product.childVariants);
        const updatedDrafts = { ...variantStockDrafts };
        delete updatedDrafts[sku];
        setVariantStockDrafts(updatedDrafts);
        setStockInput(data.product.stock);

        toast({
          type: "success",
          title: "Colorway Removed",
          description: `Removed SKU ${sku}.`,
        });
      }
    } catch {
      toast({ type: "error", title: "Remove Failed", description: "Could not remove colorway." });
    }
  };

  // Submit Batch Variant Restock to API
  const handleSaveBatchRestock = async () => {
    if (!restockTargetProduct) return;
    setIsSubmittingRestock(true);
    try {
      const variantUpdates = Object.entries(variantStockDrafts).map(([sku, stock]) => ({
        sku,
        stock: Math.max(0, Number(stock) || 0),
      }));

      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restockTargetProduct.slug,
          variantUpdates,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        toast({
          type: "success",
          title: "Variants Restocked Successfully",
          description: `Updated ${restockTargetProduct.name} across ${variantUpdates.length} colors. Live stock: ${data.product.stock} units.`,
        });
        setIsRestockModalOpen(false);
        await fetchAdminData(restockTargetProduct.slug);
      } else {
        toast({
          type: "error",
          title: "Restock Failed",
          description: data.error || "Could not update variant stock.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Restock Error",
        description: err.message || "Failed to update variant stock.",
      });
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Category Selector in Product Creator Modal
  const handleCategorySelect = (catSlug: string) => {
    setNewProdCategory(catSlug);
    const cat = ECOMMERCE_CATEGORIES.find((c) => c.slug === catSlug);
    if (cat) {
      setNewProdSpecs([...cat.defaultSpecs]);
      const firstItem = cat.topSellingItems.split(",")[0].trim();
      setNewProdModel(firstItem.toUpperCase());
      setNewProdTagline(`Premium ${cat.name} engineered for exceptional durability, comfort and style.`);
      setNewProdDescription(`High-grade ${cat.name.toLowerCase()} manufactured with premium materials and rigorous quality testing.`);
    }
  };

  // Architecture & Colorway Studio Helpers for Dynamic Product Creation
  const handleNewProdAddArchitecture = () => {
    const nextNum = newProdArchitectures.length + 1;
    const nextId = `A${nextNum}`;
    setNewProdArchitectures((prev) => [
      ...prev,
      {
        id: nextId,
        name: `${nextId} (Edition ${nextNum})`,
        price: newProdPrice || 120,
        variantSpecs: [],
        colors: [
          {
            id: `color-${Date.now()}-1`,
            color: "Pitch Black",
            hex: "#1A1A1A",
            sku: `PROD-${nextId}-BLK`,
            stock: 5,
            price: newProdPrice || 120,
            images: ["/images/hero-graphite.jpg"],
          },
        ],
      },
    ]);
  };

  const handleNewProdRemoveArchitecture = (archIdx: number) => {
    if (newProdArchitectures.length <= 1) {
      toast({
        type: "error",
        title: "Architecture Required",
        description: "Product must have at least one architecture cut.",
      });
      return;
    }
    setNewProdArchitectures((prev) => prev.filter((_, idx) => idx !== archIdx));
  };

  const handleNewProdAddColor = (archIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const nextColorNum = arch.colors.length + 1;
      const archId = arch.id || `A${archIdx + 1}`;
      const defaultHex = nextColorNum === 2 ? "#ECECEC" : nextColorNum === 3 ? "#3B6978" : "#2563EB";
      const defaultName = nextColorNum === 2 ? "Arctic White" : nextColorNum === 3 ? "Mineral Blue" : `Color ${nextColorNum}`;

      arch.colors = [
        ...arch.colors,
        {
          id: `color-${Date.now()}-${nextColorNum}`,
          color: defaultName,
          hex: defaultHex,
          sku: `PROD-${archId}-${defaultName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || nextColorNum}`,
          stock: 5,
          price: arch.price || newProdPrice || 120,
          images: ["/images/hero-silver.jpg"],
        },
      ];
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdRemoveColor = (archIdx: number, colorIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      if (arch.colors.length <= 1) {
        toast({
          type: "error",
          title: "Color Required",
          description: "Architecture cut must have at least one colorway.",
        });
        return prev;
      }
      arch.colors = arch.colors.filter((_, idx) => idx !== colorIdx);
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateColor = (
    archIdx: number,
    colorIdx: number,
    field: "color" | "hex" | "sku" | "stock" | "price",
    value: any
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const colors = [...arch.colors];
      colors[colorIdx] = {
        ...colors[colorIdx],
        [field]: value,
      };
      arch.colors = colors;
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateArchitecture = (
    archIdx: number,
    field: "name" | "id" | "price",
    value: any
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      updated[archIdx] = {
        ...updated[archIdx],
        [field]: value,
      };
      return updated;
    });
  };

  // Spec Divergence / Override Handlers for Architecture Cuts
  const handleNewProdAddSpecOverride = (archIdx: number, specKey: string, defaultValue = "") => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const currentSpecs = arch.variantSpecs || [];
      if (currentSpecs.some((s) => s.key.toLowerCase() === specKey.toLowerCase())) {
        toast({
          type: "info",
          title: "Already Diverged",
          description: `"${specKey}" is already overridden in this architecture cut.`,
        });
        return prev;
      }
      const globalMatch = newProdSpecs.find((s) => s.key.toLowerCase() === specKey.toLowerCase());
      arch.variantSpecs = [
        ...currentSpecs,
        {
          key: specKey,
          value: defaultValue || globalMatch?.value || "Divergent Specification Value",
        },
      ];
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdRemoveSpecOverride = (archIdx: number, specIdx: number) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      arch.variantSpecs = (arch.variantSpecs || []).filter((_, i) => i !== specIdx);
      updated[archIdx] = arch;
      return updated;
    });
  };

  const handleNewProdUpdateSpecOverride = (
    archIdx: number,
    specIdx: number,
    field: "key" | "value",
    val: string
  ) => {
    setNewProdArchitectures((prev) => {
      const updated = [...prev];
      const arch = { ...updated[archIdx] };
      const specs = [...(arch.variantSpecs || [])];
      specs[specIdx] = { ...specs[specIdx], [field]: val };
      arch.variantSpecs = specs;
      updated[archIdx] = arch;
      return updated;
    });
  };

  // Load Example Product A Variant Structure (A1 & A2)
  const handleLoadProductAExample = () => {
    setNewProdCategory("apparel-fashion");
    setNewProdName("Product A - Studio Minimalist Hoodie");
    setNewProdSlug("product-a");
    setNewProdModel("ORGANIC HEAVYWEIGHT 450 GSM");
    setNewProdTagline("Ultra-dense combed cotton with tailored architectural cut.");
    setNewProdDescription("Crafted from 100% sustainable combed cotton. Features dual architectural cuts: A1 (Regular Fit) and A2 (Oversized Streetwear Fit).");
    setNewProdPrice(120);
    setNewProdOriginalPrice(145);
    setNewProdSpecs([
      { key: "Material / Fabric", value: "100% Organic Combed Ring-Spun Cotton" },
      { key: "Fabric Density", value: "450 GSM Heavyweight French Terry" },
      { key: "Fit Architecture", value: "A1 Regular Fit & A2 Streetwear Oversized Cut" },
      { key: "Care Instructions", value: "Cold wash inside out, lay flat to dry" },
      { key: "Origin", value: "Ethically milled and tailored in Portugal" },
    ]);
    setNewProdArchitectures([
      {
        id: "A1",
        name: "A1 (Regular Fit)",
        price: 120,
        variantSpecs: [{ key: "Fit Cut", value: "Regular Tailored Cut" }],
        colors: [
          { id: "c-a1-1", sku: "PROD-A1-GREEN", color: "Forest Green", hex: "#2E5339", stock: 5, price: 120, images: ["/images/lifestyle-workspace.jpg"] },
          { id: "c-a1-2", sku: "PROD-A1-BLACK", color: "Pitch Black", hex: "#1A1A1A", stock: 2, price: 120, images: ["/images/hero-graphite.jpg"] },
          { id: "c-a1-3", sku: "PROD-A1-BLUE", color: "Mineral Blue", hex: "#3B6978", stock: 4, price: 120, images: ["/images/hero-silver.jpg"] },
        ],
      },
      {
        id: "A2",
        name: "A2 (Oversized Fit)",
        price: 130,
        variantSpecs: [{ key: "Fit Cut", value: "Streetwear Oversized Drop Shoulder" }],
        colors: [
          { id: "c-a2-1", sku: "PROD-A2-WHITE", color: "Arctic White", hex: "#ECECEC", stock: 8, price: 130, images: ["/images/hero-sandstone.jpg"] },
          { id: "c-a2-2", sku: "PROD-A2-GREEN", color: "Forest Green", hex: "#2E5339", stock: 7, price: 130, images: ["/images/lifestyle-cafe.jpg"] },
        ],
      },
    ]);
    toast({
      type: "info",
      title: "Product A Architecture Loaded",
      description: "A1 {Green: 5, Black: 2, Blue: 4} & A2 {White: 8, Green: 7} loaded.",
    });
  };

  // Load Example Nova X1 Flagship Smartphone (Dual Architecture Spec Overrides)
  const handleLoadNovaSmartphoneExample = () => {
    setNewProdCategory("electronics-accessories");
    setNewProdName("Nova X1 Flagship Smartphone");
    setNewProdSlug("nova-x1-smartphone");
    setNewProdModel("X1 SERIES FLAGSHIP 5G");
    setNewProdTagline("Powerful smartphone built for all-day performance with dual display architectures.");
    setNewProdDescription("Nova X1 delivers flagship-grade Snapdragon 8 performance with dual architectural formats: A1 Large Display Edition (6.0\", 5500mAh, Gorilla Glass Victus) and A2 Compact Edition (5.5\", 4700mAh, Dragon Shield Glass).");
    setNewProdPrice(499);
    setNewProdOriginalPrice(599);
    setNewProdSpecs([
      { key: "Brand", value: "Nova" },
      { key: "Processor", value: "Snapdragon 8 Series" },
      { key: "RAM", value: "8GB LPDDR5X" },
      { key: "Storage", value: "128GB UFS 4.0" },
      { key: "Rear Camera", value: "50MP Main + 12MP Ultra-Wide" },
      { key: "Front Camera", value: "16MP HDR" },
      { key: "OS", value: "Android 16" },
      { key: "Fast Charging", value: "65W Wired Fast Charging" },
      { key: "Network", value: "5G Dual SIM + Wi-Fi 7" },
      { key: "Fingerprint", value: "Ultrasonic In-Display" },
      { key: "Water Resistance", value: "IP68 Certified" },
    ]);
    setNewProdArchitectures([
      {
        id: "A1",
        name: "Large Display Edition",
        price: 499,
        variantSpecs: [
          { key: "Display Size", value: "6.0 inch LTPO AMOLED" },
          { key: "Screen Protection", value: "Corning Gorilla Glass Victus" },
          { key: "Battery Capacity", value: "5500mAh Dual-Cell" },
          { key: "Weight", value: "210g" },
        ],
        colors: [
          { id: "c-a1-blk", sku: "NVX1-A1-BLK", color: "Midnight Black", hex: "#101010", stock: 35, price: 499, images: ["/images/hero-graphite.jpg"] },
          { id: "c-a1-blu", sku: "NVX1-A1-BLU", color: "Ocean Blue", hex: "#1565C0", stock: 22, price: 499, images: ["/images/hero-silver.jpg"] },
          { id: "c-a1-slv", sku: "NVX1-A1-SLV", color: "Titanium Silver", hex: "#C0C0C0", stock: 18, price: 519, images: ["/images/lifestyle-workspace.jpg"] },
        ],
      },
      {
        id: "A2",
        name: "Compact Edition",
        price: 449,
        variantSpecs: [
          { key: "Display Size", value: "5.5 inch Compact AMOLED" },
          { key: "Screen Protection", value: "Dragon Shield Glass" },
          { key: "Battery Capacity", value: "4700mAh High-Density" },
          { key: "Weight", value: "185g" },
        ],
        colors: [
          { id: "c-a2-grn", sku: "NVX1-A2-GRN", color: "Forest Green", hex: "#2E7D32", stock: 30, price: 449, images: ["/images/lifestyle-cafe.jpg"] },
          { id: "c-a2-wht", sku: "NVX1-A2-WHT", color: "Pearl White", hex: "#FAFAFA", stock: 16, price: 459, images: ["/images/hero-sandstone.jpg"] },
          { id: "c-a2-red", sku: "NVX1-A2-RED", color: "Crimson Red", hex: "#B71C1C", stock: 11, price: 469, images: ["/images/lifestyle-urban.jpg"] },
        ],
      },
    ]);
    toast({
      type: "info",
      title: "Nova X1 Smartphone Architecture Loaded",
      description: "A1 (6.0\" / 5500mAh Victus) & A2 (5.5\" / 4700mAh Dragon Shield) loaded with 132 units.",
    });
  };

  // Submit Dynamic New Product
  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast({ type: "error", title: "Product Title Required", description: "Please enter product name." });
      return;
    }

    const totalColorsCount = newProdArchitectures.reduce((sum, a) => sum + (a.colors?.length || 0), 0);
    if (totalColorsCount === 0) {
      toast({ type: "error", title: "Variant Required", description: "Product must have at least one colorway variant." });
      return;
    }

    setIsCreatingProduct(true);
    try {
      const selectedCategoryDef = ECOMMERCE_CATEGORIES.find((c) => c.slug === newProdCategory);
      const generatedSlug = (newProdSlug || newProdName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const globalSpecsRecord = newProdSpecs.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
        return acc;
      }, {} as Record<string, string>);

      // Map newProdArchitectures to IVariantGroup with variantSpecs
      const formattedVariantGroups: IVariantGroup[] = newProdArchitectures.map((arch) => {
        const variantSpecsRecord = (arch.variantSpecs || []).reduce((acc, curr) => {
          if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
          return acc;
        }, {} as Record<string, string>);

        return {
          id: arch.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: arch.name.trim() || `${arch.id} Architecture`,
          specOverride: arch.name.trim() || `${arch.id} Architecture`,
          variantSpecs: Object.keys(variantSpecsRecord).length > 0 ? variantSpecsRecord : undefined,
          price: Number(arch.price) || Number(newProdPrice) || 99,
          discount: 0,
          colors: arch.colors.map((c) => ({
            id: c.id,
            sku: c.sku.trim() || `PROD-${arch.id.toUpperCase()}-${c.color.replace(/[^a-z0-9]+/gi, "").toUpperCase()}`,
            color: c.color.trim() || "Standard",
            hex: c.hex || "#333333",
            stock: Number(c.stock) || 0,
            price: Number(c.price) || Number(arch.price) || Number(newProdPrice) || 99,
            images: c.images && c.images.length > 0 ? c.images : ["/images/hero-silver.jpg"],
          })),
        };
      });

      // Flatten to IVariant for childVariants
      const formattedChildVariants: IVariant[] = [];
      formattedVariantGroups.forEach((vg) => {
        vg.colors.forEach((c) => {
          formattedChildVariants.push({
            sku: c.sku,
            color: c.color,
            specOverride: vg.name,
            variantSpecs: vg.variantSpecs,
            price: c.price ?? vg.price ?? newProdPrice,
            discount: 0,
            stock: c.stock,
            images: c.images,
          });
        });
      });

      const formattedColorVariants = formattedChildVariants.map((v, i) => {
        const matchingHex = formattedVariantGroups
          .flatMap((g) => g.colors)
          .find((c) => c.sku === v.sku)?.hex || "#333333";
        return {
          id: (v.color || `color-${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: v.color || "Standard",
          hex: matchingHex,
          borderHex: "#111111",
          image: v.images?.[0] || "/images/hero-silver.jpg",
          images: v.images && v.images.length > 0 ? v.images : ["/images/hero-silver.jpg"],
          tag: String(i + 1).padStart(2, "0"),
        };
      });

      const totalMasterStock = formattedChildVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

      const payload = {
        name: newProdName.trim(),
        slug: generatedSlug,
        productId: `PROD-${generatedSlug.toUpperCase()}`,
        category: selectedCategoryDef?.name || "General Goods",
        categorySlug: newProdCategory,
        model: newProdModel.trim() || selectedCategoryDef?.topSellingItems?.split(",")[0] || "PREMIUM QUALITY",
        tagline: newProdTagline.trim() || "Engineered with precision and architectural beauty.",
        description: newProdDescription.trim() || "Authentic high-grade product designed for exceptional daily utility.",
        price: Number(newProdPrice) || 99,
        basePrice: Number(newProdPrice) || 99,
        originalPrice: Number(newProdOriginalPrice) || (Number(newProdPrice) || 99) * 1.25,
        type: selectedCategoryDef?.name || "Standard Goods",
        globalSpecs: globalSpecsRecord,
        stock: totalMasterStock,
        variantGroups: formattedVariantGroups,
        childVariants: formattedChildVariants,
        variants: formattedColorVariants,
      };

      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Product Created & Edge Synchronized!",
          description: `${data.product.name} created with ${data.product.childVariants?.length || 0} variants (${data.product.stock} total units).`,
        });
        setIsNewProductModalOpen(false);
        setSelectedSlug(data.product.slug);
        await fetchAdminData(data.product.slug);
      } else {
        toast({
          type: "error",
          title: "Creation Failed",
          description: data.error || "Unable to save new product.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Error",
        description: err.message || "Failed to create new product.",
      });
    } finally {
      setIsCreatingProduct(false);
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

            <div className="flex items-center gap-1.5">
              <select
                value={selectedSlug}
                onChange={(e) => {
                  setSelectedSlug(e.target.value);
                  fetchAdminData(e.target.value);
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl px-2.5 sm:px-3 py-2 font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 max-w-[210px] truncate"
              >
                {products.length === 0 ? (
                  <option value="form-01">Form 01 (Over-Ear)</option>
                ) : (
                  products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({p.category || p.categorySlug}) · {p.stock} units
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-semibold shadow-xs transition-colors shrink-0"
                title="Create New Dynamic Product across 10 Categories"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            </div>

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
            <span>The Variation Engine ({variantGroups.length} Architectures · {childVariants.length} Colors)</span>
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
              {/* Left Column: Variant-Aware Restock & Alert Center */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      {product?.category || "Apparel & Tech"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans mt-1">
                      {product?.name || "Active Product"} Restock
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Total Inventory: <strong className="font-mono text-zinc-950 text-sm">{product?.stock || 0} units</strong> across {childVariants.length} variants
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-zinc-400">SKU:</span>
                    <div className="text-xs font-mono font-bold text-zinc-800">{product?.productId || product?.sku}</div>
                  </div>
                </div>

                {/* Primary Restock Button that opens the Dedicated Variant Popup */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <PackagePlus className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950">
                        Multi-Variant Restock Studio
                      </h4>
                      <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                        Restock individual architectures (A1, A2) and colorways without ambiguity. Never increment a blind master number.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => product && openRestockModal(product)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>+ Restock Variants & Colors (Popup)</span>
                  </button>
                </div>

                {/* Visual Architecture & Colorway Summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                    Current Architecture & Color Allocations:
                  </span>
                  <div className="space-y-1.5">
                    {(variantGroups && variantGroups.length > 0 ? variantGroups : childVariantsToVariantGroups(childVariants)).map((g, gIdx) => (
                      <div key={g.id || gIdx} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 font-mono">
                          <span className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold font-mono shrink-0">
                              {g.id.length <= 4 ? g.id : `Arch 0${gIdx + 1}`}
                            </span>
                            <span>{g.name}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-normal">
                            {(g.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0)} units total
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(g.colors || []).map((c) => (
                            <span
                              key={c.sku}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-800 font-mono"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c.hex || "#333" }}
                              />
                              <span>{c.color}</span>
                              <span className="bg-zinc-100 px-1.5 py-0.2 rounded font-bold text-blue-600">
                                {c.stock}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flash Sale, Discount & ISR Edge Settings */}
                <form onSubmit={handleUpdateInventory} className="space-y-4 pt-3 border-t border-zinc-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        Instant Discount ($ Off)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="150"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50 font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        REVALIDATE_SECRET
                      </label>
                      <input
                        type="text"
                        value={revalidateSecret}
                        onChange={(e) => setRevalidateSecret(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 bg-zinc-50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    <input
                      type="checkbox"
                      id="flashSaleToggle"
                      checked={isFlashSale}
                      onChange={(e) => setIsFlashSale(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="flashSaleToggle" className="text-xs font-medium text-zinc-700 cursor-pointer">
                      Enable "🔥 Few Left" Flash Alert when stock &le; 5 units
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdating ? "Purging Edge Cache..." : "Save Discount & Edge Rules"}</span>
                  </button>
                </form>
              </div>

              {/* Right: Architecture & Colorway Real-Time Inventory Control */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">
                      Architecture & Colorway Inventory
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Independent colorway counters organized by architecture cut (A1, A2).
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("variation-engine")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Manage Engine &rarr;
                  </button>
                </div>

                <div className="space-y-4">
                  {(variantGroups && variantGroups.length > 0 ? variantGroups : childVariantsToVariantGroups(childVariants)).map((g, gIdx) => {
                    const groupUnits = (g.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0);
                    return (
                      <div
                        key={g.id || gIdx}
                        className="rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden shadow-2xs space-y-3 p-4 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold font-mono shrink-0 whitespace-nowrap">
                              {g.id.length <= 4 ? g.id : `Arch 0${gIdx + 1}`}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 font-sans">
                              {g.name}
                            </span>
                            <span className="text-[10px] font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                              {(g.colors || []).length} {(g.colors || []).length === 1 ? "color" : "colors"}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-800">
                            Total Units: <span className="text-blue-600 font-bold">{groupUnits}</span>
                          </span>
                        </div>

                        {/* Colors in this Architecture */}
                        <div className="space-y-2">
                          {(g.colors || []).map((c) => (
                            <div
                              key={c.sku}
                              className="p-3 rounded-xl bg-white border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                    style={{ backgroundColor: c.hex || "#333" }}
                                  />
                                  <span className="text-xs font-bold text-zinc-900">{c.color}</span>
                                  <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                                    {c.sku}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                  ${c.price || g.price || product?.price} · {c.stock} units in stock
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleQuickVariantStock(c.sku, Math.max(0, c.stock - 1))}
                                  className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-mono font-bold text-xs text-zinc-900">
                                  {c.stock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickVariantStock(c.sku, c.stock + 1)}
                                  className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                                >
                                  +
                                </button>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono ${
                                    c.stock === 0
                                      ? "bg-red-100 text-red-700"
                                      : c.stock <= 5
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {c.stock === 0 ? "SOLD OUT" : c.stock <= 5 ? "LOW STOCK" : "IN STOCK"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inline Quick Add Color to this Architecture */}
                        <div className="pt-2 border-t border-zinc-200/60 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add Color (e.g. Heather Grey)"
                            id={`quick-add-color-${g.id}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 focus:outline-none"
                          />
                          <input
                            type="number"
                            min="0"
                            defaultValue={5}
                            id={`quick-add-stock-${g.id}`}
                            className="w-14 px-2 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-mono font-bold text-center text-zinc-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nameInput = document.getElementById(`quick-add-color-${g.id}`) as HTMLInputElement;
                              const stockInputEl = document.getElementById(`quick-add-stock-${g.id}`) as HTMLInputElement;
                              const colorName = nameInput?.value?.trim();
                              const initialStock = parseInt(stockInputEl?.value) || 5;
                              if (!colorName) return;
                              handleAddColorToArchitecture(g.id, colorName, initialStock);
                              if (nameInput) nameInput.value = "";
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Color</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
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

            {/* Multi-Category Inventory & Product Catalog Hub */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                      Multi-Category Inventory Hub ({products.length} Products)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Manage stock allocations, architectures, and variants across 10 top-selling e-commerce categories
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Product</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 text-zinc-400 font-mono">
                      <th className="py-2.5 px-3 font-normal">PRODUCT & ROOT SKU</th>
                      <th className="py-2.5 px-3 font-normal">CATEGORY</th>
                      <th className="py-2.5 px-3 font-normal">RETAIL PRICE</th>
                      <th className="py-2.5 px-3 font-normal">TOTAL STOCK</th>
                      <th className="py-2.5 px-3 font-normal">VARIANTS & ARCHITECTURES</th>
                      <th className="py-2.5 px-3 font-normal text-right">RESTOCK ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {products.map((p) => {
                      const isSelected = p.slug === selectedSlug;
                      const hasLowStock = p.stock <= (p.lowStockThreshold || 5);
                      const isSoldOut = p.stock === 0;

                      return (
                        <tr
                          key={p.slug}
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            isSelected ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-900">{p.name}</span>
                                {isSelected && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400">
                                {p.productId || p.sku} · {p.model}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {p.category || p.categorySlug}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono font-semibold text-zinc-900">
                            ${p.price}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-zinc-950">{p.stock} units</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                  isSoldOut
                                    ? "bg-red-100 text-red-700"
                                    : hasLowStock
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isSoldOut ? "SOLD OUT" : hasLowStock ? "LOW" : "HEALTHY"}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1.5 max-w-sm">
                              {(() => {
                                const groups = p.variantGroups && p.variantGroups.length > 0
                                  ? p.variantGroups
                                  : p.childVariants && p.childVariants.length > 0
                                  ? childVariantsToVariantGroups(p.childVariants)
                                  : [];
                                if (groups.length === 0) {
                                  return (
                                    <div className="flex flex-wrap gap-1">
                                      {(p.variants || []).map((v) => (
                                        <span
                                          key={v.id}
                                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
                                        >
                                          {v.name}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                }
                                return groups.map((vg, vgIdx) => {
                                  const archBadge = vg.id?.length <= 4 ? vg.id : `Arch 0${vgIdx + 1}`;
                                  return (
                                    <div key={vg.id || vgIdx} className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 shrink-0"
                                        title={vg.name}
                                      >
                                        {archBadge}
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {(vg.colors || []).map((c) => (
                                          <span
                                            key={c.sku}
                                            className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-zinc-700 border border-zinc-200 shadow-2xs"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.hex || "#666" }} />
                                            <span>{c.color}</span>
                                            <span className="font-bold text-blue-600">({c.stock})</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openRestockModal(p)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-2xs"
                                title="Open Dedicated Variant Restock Popup"
                              >
                                <PackagePlus className="w-3 h-3" />
                                <span>+ Restock</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSlug(p.slug);
                                  fetchAdminData(p.slug);
                                  setActiveTab("variation-engine");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                                title="Edit in Variation Engine"
                              >
                                Edit
                              </button>

                              <Link
                                href={`/products/${p.slug}`}
                                target="_blank"
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                                title="View on Storefront"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

            {/* Hierarchical Variant Architecture & Colorway Studio */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-950 font-sans flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Variant Architecture & Colorway Studio ({variantGroups.length} Architectures Active)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Model multiple variant architectures (e.g. A1 Regular Fit, A2 Streetwear Oversized Cut). Each architecture contains multiple colorways with their own stock counters, SKUs, and photography.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddArchitectureGroup}
                  className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Variant Architecture (A{variantGroups.length + 1})</span>
                </button>
              </div>

              {/* Architectures Container */}
              <div className="space-y-6">
                {variantGroups.map((group, gIdx) => {
                  const groupUnits = group.colors.reduce((sum, c) => sum + (c.stock || 0), 0);

                  return (
                    <div
                      key={group.id}
                      className="p-5 sm:p-6 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-5 transition-all shadow-2xs"
                    >
                      {/* Architecture Group Header Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                            {group.id}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                                Architecture Cut #{gIdx + 1}
                              </span>
                              <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                {group.colors.length} {group.colors.length === 1 ? "colorway" : "colorways"}
                              </span>
                              <span className="text-[10px] font-mono bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full font-bold">
                                {groupUnits} units total
                              </span>
                            </div>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) => handleUpdateArchitectureName(group.id, e.target.value)}
                              placeholder="e.g. A1 (Regular Fit) or A2 (Oversized Cut)"
                              className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg mt-1 w-full sm:w-80 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-semibold text-zinc-500 font-mono">Base Price ($):</label>
                            <input
                              type="number"
                              value={group.price ?? masterBasePrice}
                              onChange={(e) => handleUpdateArchitecturePrice(group.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveArchitectureGroup(group.id)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Arch</span>
                          </button>
                        </div>
                      </div>

                      {/* Colorways Nested in this Architecture */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                            Colorways & Stock for {group.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddColorToArchitecture(group.id, `Color ${group.colors.length + 1}`, 5)}
                            className="inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Color to {group.id}</span>
                          </button>
                        </div>

                        {group.colors.map((colorItem, cIdx) => (
                          <div
                            key={colorItem.sku || cIdx}
                            className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-4"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: colorItem.hex || "#333" }}
                                />
                                <span className="text-xs font-bold text-zinc-900">
                                  {colorItem.color || "Untitled Color"}
                                </span>
                                <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                                  {colorItem.sku}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveColorFromArchitecture(group.id, cIdx)}
                                className="text-xs text-zinc-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Color</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Color Name + Swatch Picker */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-600">Colorway Name</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={colorItem.hex || "#22252A"}
                                    onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "hex", e.target.value)}
                                    className="w-7 h-7 rounded border border-zinc-200 p-0 cursor-pointer shrink-0"
                                    title="Choose color hex"
                                  />
                                  <input
                                    type="text"
                                    value={colorItem.color}
                                    onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "color", e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-semibold focus:bg-white"
                                  />
                                </div>
                              </div>

                              {/* SKU */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-600">SKU (Stock Keeping Unit)</label>
                                <input
                                  type="text"
                                  value={colorItem.sku}
                                  onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "sku", e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white"
                                />
                              </div>

                              {/* Price Override */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-600">Color Price ($)</label>
                                <input
                                  type="number"
                                  value={colorItem.price ?? group.price ?? masterBasePrice}
                                  onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "price", Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:bg-white"
                                />
                              </div>

                              {/* Real-time Inventory */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-zinc-600">Real-Time Units (Stock)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={colorItem.stock}
                                  onChange={(e) => handleUpdateArchitectureColor(group.id, cIdx, "stock", Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 focus:bg-white"
                                />
                              </div>
                            </div>

                            {/* Photography & Angles for this Color */}
                            <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-[11px] font-bold text-zinc-800">
                                    Photography ({(colorItem.images || []).length} Attached)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor={`upload-color-${group.id}-${cIdx}`}
                                    className="cursor-pointer inline-flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>{uploadingColorKey === `${group.id}-${cIdx}` ? "Uploading S3..." : "Direct S3 Upload"}</span>
                                  </label>
                                  <input
                                    id={`upload-color-${group.id}-${cIdx}`}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={uploadingColorKey === `${group.id}-${cIdx}`}
                                    onChange={(e) => handleColorDirectS3Upload(group.id, cIdx, e)}
                                    className="hidden"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleAddImageToColor(group.id, cIdx)}
                                    className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-1 rounded-md border border-zinc-200 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Angle</span>
                                  </button>
                                </div>
                              </div>

                              {/* Thumbnails */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                {(colorItem.images && colorItem.images.length > 0 ? colorItem.images : ["/images/hero-silver.jpg"]).map(
                                  (imgUrl, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1 relative group"
                                    >
                                      <div className="relative aspect-square rounded bg-white overflow-hidden flex items-center justify-center">
                                        <img
                                          src={imgUrl}
                                          alt={`${colorItem.color} angle ${imgIdx + 1}`}
                                          className="w-full h-full object-contain p-0.5"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImageFromColor(group.id, cIdx, imgIdx)}
                                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded transition-colors"
                                          title="Remove photo"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={imgUrl}
                                        onChange={(e) => handleUpdateImageInColor(group.id, cIdx, imgIdx, e.target.value)}
                                        className="w-full px-1.5 py-0.5 text-[9px] font-mono bg-white border border-zinc-200 rounded text-zinc-600 focus:outline-none"
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prominent Add Color to Architecture Button */}
                      <button
                        type="button"
                        onClick={() => handleAddColorToArchitecture(group.id, `Color ${group.colors.length + 1}`, 5)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add More Colors to {group.name}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddArchitectureGroup}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-900 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>+ Add New Variant Architecture (A{variantGroups.length + 1})</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingVariants}
                  className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* =========================================================================
          MODAL 1: VARIANT RESTOCK POPUP MODAL
          Allows restocking variant by variant, color by color (e.g., A1 green: 5, black: 2, blue: 4; A2 white: 8, green: 7)
          ========================================================================= */}
      {isRestockModalOpen && restockTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                      Restock Variants & Colors
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                      {restockTargetProduct.category || "General Goods"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">
                    Product: <span className="font-semibold text-zinc-900">{restockTargetProduct.name}</span> ({restockTargetProduct.productId || restockTargetProduct.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable list of variants grouped by Architecture/Fit */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-zinc-600 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-blue-950">Precise Inventory Control</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Never blindly guess which variant is restocked. Adjust quantity counters directly for each architecture and colorway. Live total will be recalculated automatically and pushed to edge CloudFront caches.
                  </p>
                </div>
              </div>

              {/* Group variants by specOverride (Architecture e.g. A1, A2) */}
              {(() => {
                const variantsList = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                  ? restockTargetProduct.childVariants
                  : (restockTargetProduct.variants || []).map((v, i) => ({
                      sku: `${restockTargetProduct.productId || restockTargetProduct.id.toUpperCase()}-VAR-${i + 1}`,
                      color: v.name,
                      specOverride: "Standard Architecture",
                      price: restockTargetProduct.price,
                      discount: 0,
                      stock: Math.max(1, Math.floor(restockTargetProduct.stock / Math.max(1, restockTargetProduct.variants.length))),
                      images: [v.image],
                    }));

                // Group by specOverride
                const groups: Record<string, typeof variantsList> = {};
                variantsList.forEach((v) => {
                  const arch = v.specOverride || "Standard Edition";
                  if (!groups[arch]) groups[arch] = [];
                  groups[arch].push(v);
                });

                return Object.entries(groups).map(([archName, items]) => {
                  const archTotalStock = items.reduce((sum, item) => sum + (variantStockDrafts[item.sku] ?? item.stock), 0);

                  return (
                    <div key={archName} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
                      {/* Architecture Group Header */}
                      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-900 font-mono">
                            Architecture / Cut: {archName}
                          </span>
                          <span className="text-[10px] font-mono bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">
                            {items.length} {items.length === 1 ? "colorway" : "colorways"}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-zinc-700">
                          Group Units: <span className="text-blue-600">{archTotalStock}</span>
                        </span>
                      </div>

                      {/* Items in Architecture */}
                      <div className="divide-y divide-zinc-100">
                        {items.map((v) => {
                          const currentDraftStock = variantStockDrafts[v.sku] ?? v.stock;
                          const diff = currentDraftStock - v.stock;

                          return (
                            <div key={v.sku} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 transition-colors">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {/* Color Dot */}
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                    style={{
                                      backgroundColor:
                                        v.color.toLowerCase().includes("green") ? "#2E5339" :
                                        v.color.toLowerCase().includes("black") ? "#1A1A1A" :
                                        v.color.toLowerCase().includes("blue") ? "#3B6978" :
                                        v.color.toLowerCase().includes("white") ? "#F5F5F5" :
                                        v.color.toLowerCase().includes("silver") ? "#D1D5DB" :
                                        v.color.toLowerCase().includes("sandstone") ? "#D4B996" :
                                        "#4F46E5",
                                    }}
                                  />
                                  <span className="text-xs font-bold text-zinc-900">{v.color}</span>
                                  <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                    {v.sku}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 font-mono">
                                    ${v.price}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                  <span>Original: <strong className="font-mono text-zinc-700">{v.stock}</strong> units</span>
                                  {diff !== 0 && (
                                    <span className={`font-mono font-semibold ${diff > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                      ({diff > 0 ? `+${diff}` : diff} units)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Stepper & Quick Add Chips */}
                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                {/* Quick Chips */}
                                <div className="hidden md:flex items-center gap-1">
                                  {[1, 5, 10, 25].map((addQty) => (
                                    <button
                                      key={addQty}
                                      type="button"
                                      onClick={() => {
                                        setVariantStockDrafts((prev) => ({
                                          ...prev,
                                          [v.sku]: (prev[v.sku] ?? v.stock) + addQty,
                                        }));
                                      }}
                                      className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] font-mono font-semibold text-zinc-600 transition-colors cursor-pointer"
                                    >
                                      +{addQty}
                                    </button>
                                  ))}
                                </div>

                                {/* Stepper */}
                                <div className="flex items-center border border-zinc-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariantStockDrafts((prev) => ({
                                        ...prev,
                                        [v.sku]: Math.max(0, (prev[v.sku] ?? v.stock) - 1),
                                      }));
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentDraftStock}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setVariantStockDrafts((prev) => ({
                                        ...prev,
                                        [v.sku]: val,
                                      }));
                                    }}
                                    className="w-14 text-center font-mono font-bold text-sm text-zinc-900 border-x border-zinc-200 py-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariantStockDrafts((prev) => ({
                                        ...prev,
                                        [v.sku]: (prev[v.sku] ?? v.stock) + 1,
                                      }));
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <span
                                  className={`text-[10px] font-mono px-2 py-1 rounded-md font-semibold ${
                                    currentDraftStock === 0
                                      ? "bg-red-100 text-red-700"
                                      : currentDraftStock <= 5
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {currentDraftStock === 0 ? "SOLD OUT" : currentDraftStock <= 5 ? "LOW STOCK" : "IN STOCK"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleModalRemoveColor(v.sku)}
                                  className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                  title="Delete colorway"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Add Colorway to Architecture within Restock Modal */}
                      <div className="p-3 bg-blue-50/60 border-t border-blue-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Add colorway to ${archName} (e.g., Heather Grey)`}
                          id={`modal-color-name-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          defaultValue={5}
                          id={`modal-color-stock-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`}
                          placeholder="Qty"
                          className="w-16 px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-mono font-bold text-center text-zinc-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const nameId = `modal-color-name-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            const stockId = `modal-color-stock-${archName.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            const nameEl = document.getElementById(nameId) as HTMLInputElement;
                            const stockEl = document.getElementById(stockId) as HTMLInputElement;
                            const colorName = nameEl?.value?.trim();
                            const initialQty = parseInt(stockEl?.value) || 5;
                            if (!colorName) return;
                            await handleModalAddColor(archName, colorName, initialQty);
                            if (nameEl) nameEl.value = "";
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Color</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Calculation & Actions */}
            <div className="p-4 sm:p-6 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                {(() => {
                  const originalSum = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                    ? restockTargetProduct.childVariants.reduce((sum, v) => sum + v.stock, 0)
                    : restockTargetProduct.stock;
                  const newSum = restockTargetProduct.childVariants && restockTargetProduct.childVariants.length > 0
                    ? restockTargetProduct.childVariants.reduce((sum, v) => sum + (variantStockDrafts[v.sku] ?? v.stock), 0)
                    : Object.values(variantStockDrafts).reduce((a, b) => a + b, 0);
                  const netChange = newSum - originalSum;

                  return (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 font-mono uppercase">Master Inventory:</span>
                        <span className="font-mono text-zinc-400 line-through">{originalSum} units</span>
                        <span>&rarr;</span>
                        <span className="font-mono font-bold text-sm text-zinc-950">{newSum} units</span>
                        {netChange !== 0 && (
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${netChange > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {netChange > 0 ? `+${netChange}` : netChange} units
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Calculated dynamically by summing all child variant stocks.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchRestock}
                  disabled={isSubmittingRestock}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRestock ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restocking & Purging...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Apply Variant Restock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: DYNAMIC PRODUCT CREATOR STUDIO
          Supports ANY e-commerce category (10 Top-Selling Categories)
          ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-950 font-sans">
                    Dynamic Product Studio
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Add any product category: Apparel, Electronics, Beauty, Home, Fitness, Decor, Wearables & more
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Form */}
            <form onSubmit={handleCreateNewProduct} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Step 1: 10 Top-Selling E-Commerce Categories */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    1. Select E-Commerce Category
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">10 Top-Selling Market Niches</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ECOMMERCE_CATEGORIES.map((cat) => {
                    const isSelected = newProdCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                        <span className="text-[9px] text-zinc-400 truncate mt-1">{cat.topSellingItems.split(",")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Core Details */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    2. Core Product Information
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadNovaSmartphoneExample}
                      className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Load "Nova X1 Smartphone" Example (6.0" 5500mAh vs 5.5" 4700mAh)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadProductAExample}
                      className="text-[11px] text-zinc-600 hover:text-zinc-900 font-medium underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Load "Product A" Example</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => {
                        setNewProdName(e.target.value);
                        if (!newProdSlug) {
                          setNewProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                        }
                      }}
                      placeholder="e.g. Product A - Studio Minimalist Hoodie"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">URL Slug / Identifier *</label>
                    <input
                      type="text"
                      required
                      value={newProdSlug}
                      onChange={(e) => setNewProdSlug(e.target.value)}
                      placeholder="product-a"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Model / Edition Tag</label>
                    <input
                      type="text"
                      value={newProdModel}
                      onChange={(e) => setNewProdModel(e.target.value)}
                      placeholder="ORGANIC HEAVYWEIGHT 450 GSM"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Retail Price ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Original MSRP ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProdOriginalPrice}
                      onChange={(e) => setNewProdOriginalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Tagline / Key Value Highlight</label>
                  <input
                    type="text"
                    value={newProdTagline}
                    onChange={(e) => setNewProdTagline(e.target.value)}
                    placeholder="Ultra-dense combed cotton with tailored architectural cut."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Description</label>
                  <textarea
                    rows={2}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    placeholder="Detailed description of features, materials, and origin..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 3: Dynamic Category Specifications */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                      3. Technical & Category Specifications
                    </label>
                    <p className="text-[11px] text-zinc-500">Key-value parameters displayed on the storefront specifications table</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProdSpecs([...newProdSpecs, { key: "New Spec", value: "Value" }])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newProdSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => {
                          const updated = [...newProdSpecs];
                          updated[sIdx].key = e.target.value;
                          setNewProdSpecs(updated);
                        }}
                        placeholder="Spec Attribute"
                        className="w-1/3 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold focus:outline-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...newProdSpecs];
                          updated[sIdx].value = e.target.value;
                          setNewProdSpecs(updated);
                        }}
                        placeholder="Spec Value"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...newProdSpecs];
                          updated.splice(sIdx, 1);
                          setNewProdSpecs(updated);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Multi-Variant Architecture & Colors Builder */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>4. Variant Architectures & Colorways</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Organize products into architecture cuts (A1, A2, or custom cuts) with nested color stocks and pricing
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewProdAddArchitecture}
                    className="text-xs text-white bg-zinc-950 hover:bg-zinc-800 font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Architecture Cut</span>
                  </button>
                </div>

                {/* Architecture Cuts List */}
                <div className="space-y-4">
                  {newProdArchitectures.map((arch, archIdx) => {
                    const archTotalUnits = (arch.colors || []).reduce((sum, c) => sum + (Number(c.stock) || 0), 0);

                    return (
                      <div
                        key={arch.id || archIdx}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/70 overflow-hidden shadow-xs transition-all space-y-3 p-4"
                      >
                        {/* Architecture Cut Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold shrink-0">
                              Cut #{String(archIdx + 1).padStart(2, "0")}
                            </span>

                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <input
                                type="text"
                                value={arch.id}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "id", e.target.value)}
                                placeholder="A1"
                                className="w-16 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                title="Architecture ID (e.g. A1, A2, CUT-1)"
                              />
                              <input
                                type="text"
                                value={arch.name}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "name", e.target.value)}
                                placeholder="e.g. A1 (Regular Fit) or Attached Mic"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center gap-1 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[10px] text-zinc-400 font-mono">Base $</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={arch.price}
                                onChange={(e) => handleNewProdUpdateArchitecture(archIdx, "price", parseFloat(e.target.value) || 0)}
                                className="w-14 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                              />
                            </div>

                            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-200/80 text-zinc-800">
                              {archTotalUnits} units
                            </span>

                            {newProdArchitectures.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleNewProdRemoveArchitecture(archIdx)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Architecture Cut"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Architecture Spec Overrides (Inheritance & Divergence Studio) */}
                        <div
                          className="p-3.5 rounded-xl bg-white border border-zinc-200/90 shadow-2xs space-y-3"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const key = e.dataTransfer.getData("text/plain");
                            if (key) {
                              handleNewProdAddSpecOverride(archIdx, key);
                            }
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                                  Architecture Spec Overrides & Divergence
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                  {(arch.variantSpecs || []).length} overridden
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                Attributes that differ from Global Specs for this cut (e.g. Display Size, Battery, Protection Glass). Click or drag chips below to diverge.
                              </p>
                            </div>

                            {/* Quick action: Add custom divergence */}
                            <button
                              type="button"
                              onClick={() => handleNewProdAddSpecOverride(archIdx, "New Spec Attribute", "Custom Divergent Value")}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Custom Override</span>
                            </button>
                          </div>

                          {/* Global Spec Chips (Click to diverge or Drag into Cut) */}
                          {newProdSpecs.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                Click or drag global specs into {arch.id || `Arch ${archIdx + 1}`} to override:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {newProdSpecs.map((gSpec, gsIdx) => {
                                  const isAlreadyOverridden = (arch.variantSpecs || []).some(
                                    (s) => s.key.toLowerCase() === gSpec.key.toLowerCase()
                                  );

                                  if (isAlreadyOverridden) {
                                    return (
                                      <span
                                        key={gsIdx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/90 text-[11px] font-medium"
                                        title={`Already overridden in ${arch.id || "this cut"}`}
                                      >
                                        <span className="text-[10px] font-mono font-bold text-amber-600">⚡</span>
                                        <span className="font-semibold">{gSpec.key}</span>
                                        <span className="text-[10px] text-amber-700 font-mono">(Diverged)</span>
                                      </span>
                                    );
                                  }

                                  return (
                                    <button
                                      key={gsIdx}
                                      type="button"
                                      draggable
                                      onDragStart={(e) => e.dataTransfer.setData("text/plain", gSpec.key)}
                                      onClick={() => handleNewProdAddSpecOverride(archIdx, gSpec.key, gSpec.value)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium border border-zinc-200 transition-colors cursor-pointer group"
                                      title="Click or drag to diverge this spec in this architecture cut"
                                    >
                                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700" />
                                      <span>{gSpec.key}</span>
                                      <span className="text-[10px] text-zinc-400 font-mono">({gSpec.value})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Active Overrides Rows */}
                          {(arch.variantSpecs || []).length === 0 ? (
                            <div className="p-2.5 rounded-lg bg-zinc-50 border border-dashed border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>🌐</span>
                                <span>Inheriting 100% of Global Specs (Display, Battery, RAM, etc. inherit seamlessly from Master).</span>
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">Click any chip above to diverge</span>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1 border-t border-zinc-100">
                              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                <span>Active Overrides for {arch.id || `Cut ${archIdx + 1}`}:</span>
                                <span className="text-[10px] font-mono text-amber-700 font-semibold">
                                  {(arch.variantSpecs || []).length} Divergent {arch.variantSpecs?.length === 1 ? "Spec" : "Specs"}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {(arch.variantSpecs || []).map((vSpec, vsIdx) => (
                                  <div
                                    key={vsIdx}
                                    className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50/70 border border-amber-200/80"
                                  >
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold shrink-0">
                                      ⚡ OVERRIDE
                                    </span>
                                    <input
                                      type="text"
                                      value={vSpec.key}
                                      onChange={(e) => handleNewProdUpdateSpecOverride(archIdx, vsIdx, "key", e.target.value)}
                                      placeholder="Attribute Key"
                                      className="w-1/3 px-2.5 py-1 rounded-md border border-amber-200/90 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <input
                                      type="text"
                                      value={vSpec.value}
                                      onChange={(e) => handleNewProdUpdateSpecOverride(archIdx, vsIdx, "value", e.target.value)}
                                      placeholder="Overridden Value (e.g. 6.0 inch LTPO AMOLED)"
                                      className="flex-1 px-2.5 py-1 rounded-md border border-amber-200/90 text-xs font-mono font-medium text-amber-950 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleNewProdRemoveSpecOverride(archIdx, vsIdx)}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                                      title="Revert back to Global Spec inheritance"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Colorways Table inside this Architecture Cut */}
                        <div className="space-y-2">
                          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-mono text-zinc-500 uppercase px-2 font-semibold">
                            <div className="col-span-4">Colorway & Swatch</div>
                            <div className="col-span-3">Variant SKU</div>
                            <div className="col-span-2">Initial Units</div>
                            <div className="col-span-2">Price ($)</div>
                            <div className="col-span-1 text-right">Action</div>
                          </div>

                          {arch.colors.map((c, cIdx) => (
                            <div
                              key={c.id || cIdx}
                              className="p-2.5 sm:p-2 rounded-xl bg-white border border-zinc-200/90 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center shadow-2xs"
                            >
                              {/* Color & Hex */}
                              <div className="sm:col-span-4 flex items-center gap-2">
                                <input
                                  type="color"
                                  value={c.hex || "#333333"}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "hex", e.target.value)}
                                  className="w-7 h-7 rounded border border-zinc-300 p-0 cursor-pointer shrink-0"
                                  title="Pick Color Hex Swatch"
                                />
                                <input
                                  type="text"
                                  value={c.color}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "color", e.target.value)}
                                  placeholder="Color Name (e.g. Pitch Black)"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* SKU */}
                              <div className="sm:col-span-3">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">SKU</label>
                                <input
                                  type="text"
                                  value={c.sku}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "sku", e.target.value)}
                                  placeholder="PROD-A1-BLK"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Stock */}
                              <div className="sm:col-span-2">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">Stock Units</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={c.stock}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "stock", parseInt(e.target.value) || 0)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Price */}
                              <div className="sm:col-span-2">
                                <label className="sm:hidden text-[10px] font-mono text-zinc-400 uppercase">Price ($)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={c.price}
                                  onChange={(e) => handleNewProdUpdateColor(archIdx, cIdx, "price", parseFloat(e.target.value) || 0)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Delete Color */}
                              <div className="sm:col-span-1 flex items-center justify-end">
                                {arch.colors.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleNewProdRemoveColor(archIdx, cIdx)}
                                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                    title="Remove this color"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* + Add Color Button for THIS Architecture Cut */}
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleNewProdAddColor(archIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200/80 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Color to {arch.id || `Arch ${archIdx + 1}`}</span>
                          </button>

                          <span className="text-[11px] font-mono text-zinc-500">
                            {arch.colors.length} {arch.colors.length === 1 ? "colorway" : "colorways"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Master Inventory Calculated Box */}
                {(() => {
                  const masterTotalUnits = newProdArchitectures.reduce(
                    (total, arch) => total + (arch.colors || []).reduce((sum, c) => sum + (Number(c.stock) || 0), 0),
                    0
                  );
                  const totalColorways = newProdArchitectures.reduce(
                    (total, arch) => total + (arch.colors || []).length,
                    0
                  );

                  return (
                    <div className="p-4 bg-zinc-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Calculated Master Inventory
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {masterTotalUnits} units total
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            across {newProdArchitectures.length} {newProdArchitectures.length === 1 ? "cut" : "cuts"} & {totalColorways} colorways
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {newProdArchitectures.map((arch, aIdx) => {
                          const units = (arch.colors || []).reduce((s, c) => s + (Number(c.stock) || 0), 0);
                          return (
                            <span
                              key={arch.id || aIdx}
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200"
                            >
                              <strong className="text-white">{arch.id || `A${aIdx + 1}`}</strong>: {units} u
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating & Purging Cache...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Deploy Product to Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
