export type ProductColor = "silver" | "graphite" | "sandstone" | "white" | "black" | "teal" | string;

export interface ColorVariant {
  id: ProductColor;
  name: string;
  hex: string;
  borderHex: string;
  image: string;
  images?: string[]; // Multiple high-res images for this variant
  tag: string;
  price?: number;
  priceInr?: number;
  stock?: number;
}

export type ProductVariant = ColorVariant;

export type TwsComponentType = "full-set" | "left-bud" | "right-bud" | "charging-case";

export interface TwsComponentOption {
  id: TwsComponentType;
  label: string;
  description: string;
  sku: string;
  price: number;
  originalPrice: number;
  stock: number;
}

export interface MediaGalleryItem {
  id: string;
  url: string;
  alt: string;
  type: "hero" | "macro" | "lifestyle" | "360";
  label: string;
}

export interface ValueCallout {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface TabbedSpecRow {
  label: string;
  value: string;
  badge?: string;
}

export interface TabbedSpecs {
  core: TabbedSpecRow[];
  battery: TabbedSpecRow[];
  connectivity: TabbedSpecRow[];
}

export interface ExplodedViewData {
  image: string;
  caption: string;
  badge: string;
  callouts: {
    number: string;
    title: string;
    description: string;
  }[];
}

export interface HygienePolicyData {
  title: string;
  badge: string;
  description: string;
  exemptionNotice: string;
}

export interface ProductQnA {
  id: string;
  question: string;
  answer: string;
  author: string;
  date: string;
}

export interface IVariantColor {
  id?: string;
  sku: string;
  color: string;
  hex?: string;
  price?: number;
  priceInr?: number;
  discount?: number;
  stock: number;
  images: string[];
}

export interface IVariantGroup {
  id: string; // e.g. "A1", "A2", "arch-1"
  name: string; // e.g. "Large Display Edition"
  specOverride?: string;
  variantSpecs?: Record<string, string>; // Variant-specific spec overrides e.g. { "Display Size": "6.0 inch", "Battery": "5500mAh" }
  price?: number;
  priceInr?: number;
  discount?: number;
  colors: IVariantColor[];
}

export interface IVariant {
  sku: string;               // Unique stock keeping unit: e.g. NVX1-A1-BLK
  color: string;             // Variant color
  specOverride: string;      // Specific variance details (e.g., "A1 (Large Display Edition)")
  variantSpecs?: Record<string, string>; // Specific specs overrides for this variant
  price: number;             // Override price if different from parent
  priceInr?: number;         // Override price in INR for direct payment testing
  discount: number;          // Specific variant discount percentage
  stock: number;             // Real-time inventory count
  images: string[];          // S3 URLs / CloudFront Paths specific to this variant
}

export function variantGroupsToChildVariants(groups: IVariantGroup[], defaultPrice = 99): IVariant[] {
  const result: IVariant[] = [];
  (groups || []).forEach((g) => {
    (g.colors || []).forEach((c) => {
      const effPrice = c.price ?? g.price ?? defaultPrice;
      const effPriceInr = c.priceInr ?? g.priceInr ?? (typeof effPrice === "number" ? Math.round(effPrice * 83) : undefined);
      result.push({
        sku: c.sku,
        color: c.color,
        specOverride: g.name || g.specOverride || "Standard Edition",
        variantSpecs: g.variantSpecs,
        price: effPrice,
        priceInr: effPriceInr,
        discount: c.discount ?? g.discount ?? 0,
        stock: c.stock ?? 0,
        images: c.images && c.images.length > 0 ? c.images : ["/images/hero-silver.jpg"],
      });
    });
  });
  return result;
}

export function childVariantsToVariantGroups(childVariants: IVariant[], basePrice = 99): IVariantGroup[] {
  const map = new Map<string, IVariantGroup>();
  (childVariants || []).forEach((cv, idx) => {
    const groupName = cv.specOverride?.trim() || "Standard Architecture";
    const groupId = groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `group-${idx}`;
    if (!map.has(groupId)) {
      map.set(groupId, {
        id: groupId,
        name: groupName,
        specOverride: groupName,
        variantSpecs: cv.variantSpecs,
        price: cv.price ?? basePrice,
        priceInr: cv.priceInr,
        discount: cv.discount ?? 0,
        colors: [],
      });
    }
    const group = map.get(groupId)!;
    if (!group.variantSpecs && cv.variantSpecs) {
      group.variantSpecs = cv.variantSpecs;
    }
    const hex = cv.color.toLowerCase().includes("green") ? "#2E7D32" :
      cv.color.toLowerCase().includes("black") ? "#101010" :
      cv.color.toLowerCase().includes("blue") ? "#1565C0" :
      cv.color.toLowerCase().includes("white") ? "#FAFAFA" :
      cv.color.toLowerCase().includes("red") ? "#B71C1C" :
      cv.color.toLowerCase().includes("silver") || cv.color.toLowerCase().includes("titanium") ? "#C0C0C0" :
      cv.color.toLowerCase().includes("sandstone") ? "#D6C4A6" : "#333333";
    group.colors.push({
      id: `color-${group.colors.length + 1}`,
      sku: cv.sku,
      color: cv.color,
      hex,
      price: cv.price,
      priceInr: cv.priceInr,
      discount: cv.discount,
      stock: cv.stock,
      images: cv.images,
    });
  });
  return Array.from(map.values());
}

export function getColorHex(colorName: string = ""): { hex: string; borderHex: string } {
  const c = (colorName || "").toLowerCase().trim();
  if (c.includes("silver") || c.includes("mist") || c.includes("titanium") || c.includes("platinum")) {
    return { hex: "#C4C8D0", borderHex: "#949DAA" };
  }
  if (c.includes("graphite") || c.includes("charcoal") || c.includes("obsidian")) {
    return { hex: "#22252A", borderHex: "#111215" };
  }
  if (c.includes("black") || c.includes("pitch") || c.includes("midnight") || c.includes("stealth") || c.includes("matte obsidian")) {
    return { hex: "#121214", borderHex: "#050507" };
  }
  if (c.includes("sandstone") || c.includes("gold") || c.includes("beige") || c.includes("desert") || c.includes("champagne")) {
    return { hex: "#D6C4A6", borderHex: "#B8A27E" };
  }
  if (c.includes("white") || c.includes("polar") || c.includes("pearl") || c.includes("arctic") || c.includes("ivory")) {
    return { hex: "#F5F5F7", borderHex: "#D2D2D7" };
  }
  if (c.includes("green") || c.includes("forest") || c.includes("sage") || c.includes("olive") || c.includes("emerald")) {
    return { hex: "#2E5339", borderHex: "#1E3826" };
  }
  if (c.includes("blue") || c.includes("ocean") || c.includes("mineral") || c.includes("navy") || c.includes("cobalt")) {
    return { hex: "#2B4C7E", borderHex: "#1A3254" };
  }
  if (c.includes("red") || c.includes("crimson") || c.includes("ruby") || c.includes("scarlet") || c.includes("burgundy")) {
    return { hex: "#A92424", borderHex: "#6E1313" };
  }
  if (c.includes("teal") || c.includes("cyan") || c.includes("glacier")) {
    return { hex: "#16697A", borderHex: "#0D404A" };
  }
  if (c.includes("yellow") || c.includes("amber")) {
    return { hex: "#D97706", borderHex: "#92400E" };
  }
  if (c.includes("purple") || c.includes("violet") || c.includes("lavender")) {
    return { hex: "#7C3AED", borderHex: "#5B21B6" };
  }
  return { hex: "#4B5563", borderHex: "#1F2937" };
}

export function normalizeProductData(raw: any): ProductData {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      slug: "unknown",
      name: "Product",
      categorySlug: "general",
      category: "General",
      model: "Standard Edition",
      tagline: "",
      description: "",
      price: 99,
      originalPrice: 120,
      activeDiscount: 0,
      stock: 0,
      lowStockThreshold: 5,
      isFlashSale: false,
      warrantyYears: 2,
      returnDays: 30,
      deliveryEstimate: "Ready to ship · 2–4 days",
      rating: 5.0,
      reviewCount: 0,
      sku: "PROD-UNKNOWN",
      variants: [
        {
          id: "standard",
          name: "Standard",
          hex: "#22252A",
          borderHex: "#111215",
          image: "/images/hero-silver.jpg",
          images: ["/images/hero-silver.jpg"],
          tag: "01",
          price: 99,
          priceInr: 8217,
          stock: 10,
        },
      ],
      lastRevalidatedAt: new Date().toISOString(),
    };
  }

  const clean = JSON.parse(JSON.stringify(raw));
  if (clean._id && typeof clean._id !== "string") {
    clean._id = String(clean._id);
  }

  const slug = clean.slug || clean.id || (clean.name ? clean.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "product");
  const productId = clean.productId || `PROD-${slug.toUpperCase()}`;
  const price = Number(clean.price) || Number(clean.basePrice) || 99;
  const basePrice = Number(clean.basePrice) || price;
  const priceInr = Number(clean.priceInr) || Math.round(price * 83);
  const originalPrice = Number(clean.originalPrice) || Math.round(price * 1.25);

  const rawVariants: any[] = Array.isArray(clean.variants) ? clean.variants : [];
  const rawColorVariants: any[] = Array.isArray(clean.colorVariants) ? clean.colorVariants : [];
  const rawChildVariants: any[] = Array.isArray(clean.childVariants) ? clean.childVariants : [];
  const rawVariantGroups: any[] = Array.isArray(clean.variantGroups) ? clean.variantGroups : [];

  // Determine if a variant item is corrupted (missing name, color, id, and sku)
  const isCorrupted = (item: any) =>
    !item || (!item.name && !item.color && !item.id && !item.sku);

  // Extract raw colors pool from available sources in priority order
  let colorCandidates: any[] = [];
  if (rawColorVariants.some((cv) => !isCorrupted(cv))) {
    colorCandidates = rawColorVariants.filter((cv) => !isCorrupted(cv));
  } else if (rawVariants.some((v) => !isCorrupted(v))) {
    colorCandidates = rawVariants.filter((v) => !isCorrupted(v));
  } else if (rawVariantGroups.length > 0) {
    colorCandidates = rawVariantGroups.flatMap((g) => g.colors || []);
  } else if (rawChildVariants.some((cv) => !isCorrupted(cv))) {
    colorCandidates = rawChildVariants.filter((cv) => !isCorrupted(cv));
  }

  // If still empty (e.g. completely empty variants or all corrupted), fallback to slug defaults
  if (colorCandidates.length === 0) {
    if (slug === "form-01") {
      colorCandidates = [
        { id: "silver", name: "Silver mist", hex: "#C4C8D0", borderHex: "#949DAA", image: "/images/hero-silver.jpg", price: 349, stock: 4 },
        { id: "graphite", name: "Graphite", hex: "#22252A", borderHex: "#111215", image: "/images/hero-graphite.jpg", price: 349, stock: 6 },
        { id: "sandstone", name: "Sandstone", hex: "#D6C4A6", borderHex: "#B8A27E", image: "/images/hero-sandstone.jpg", price: 369, stock: 2 },
      ];
    } else if (slug === "form-air-tws") {
      colorCandidates = [
        { id: "white", name: "Polar White", hex: "#F5F5F7", borderHex: "#D2D2D7", image: "/images/earbuds-white.jpg", price: 199, stock: 12 },
        { id: "black", name: "Matte Obsidian", hex: "#1E1E22", borderHex: "#0D0D10", image: "/images/earphones-black.jpg", price: 199, stock: 8 },
      ];
    } else if (slug === "form-pulse-iem") {
      colorCandidates = [
        { id: "black", name: "Midnight Black", hex: "#1A1A1D", borderHex: "#333338", image: "/images/earphones-black.jpg", price: 149, stock: 8 },
        { id: "teal", name: "Glacier Teal", hex: "#0E8388", borderHex: "#2E4F4F", image: "/images/earphones-teal.jpg", price: 149, stock: 6 },
      ];
    } else if (slug === "nova-x1-smartphone") {
      colorCandidates = [
        { id: "c-a1-blk", name: "Midnight Black", hex: "#101010", borderHex: "#050505", image: "/images/hero-graphite.jpg", price: 499, stock: 35 },
        { id: "c-a1-blu", name: "Ocean Blue", hex: "#1565C0", borderHex: "#0D3C73", image: "/images/hero-silver.jpg", price: 499, stock: 22 },
        { id: "c-a1-slv", name: "Titanium Silver", hex: "#C0C0C0", borderHex: "#909090", image: "/images/lifestyle-workspace.jpg", price: 519, stock: 18 },
        { id: "c-a2-grn", name: "Forest Green", hex: "#2E7D32", borderHex: "#1B4D1F", image: "/images/lifestyle-cafe.jpg", price: 449, stock: 30 },
        { id: "c-a2-wht", name: "Pearl White", hex: "#FAFAFA", borderHex: "#D0D0D0", image: "/images/hero-sandstone.jpg", price: 459, stock: 16 },
        { id: "c-a2-red", name: "Crimson Red", hex: "#B71C1C", borderHex: "#6D1111", image: "/images/lifestyle-urban.jpg", price: 469, stock: 11 },
      ];
    } else {
      colorCandidates = [
        {
          id: "standard",
          name: "Standard Edition",
          hex: "#22252A",
          borderHex: "#111215",
          image: clean.image || "/images/hero-silver.jpg",
          price,
          stock: clean.stock || 10,
        },
      ];
    }
  }

  // Deduplicate and map candidates into strict ColorVariant[]
  const seenIds = new Set<string>();
  const normalizedColorVariants: ColorVariant[] = colorCandidates.map((c, idx) => {
    const rawName = c.name || c.color || (c.sku ? c.sku.split("-").pop() : `Edition ${idx + 1}`) || "Standard";
    let baseId = (c.id || c.color || rawName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `var-${idx + 1}`;
    
    if (seenIds.has(baseId)) {
      baseId = `${baseId}-${idx + 1}`;
    }
    seenIds.add(baseId);

    const hexInfo = getColorHex(c.hex ? "" : rawName);
    const hex = c.hex || hexInfo.hex;
    const borderHex = c.borderHex || hexInfo.borderHex;

    const primaryImage =
      c.image ||
      (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null) ||
      clean.image ||
      "/images/hero-silver.jpg";

    const imagesArray =
      Array.isArray(c.images) && c.images.length > 0
        ? c.images
        : [primaryImage];

    const varPrice = Number(c.price) || price;
    const varPriceInr = Number(c.priceInr) || Math.round(varPrice * 83);
    const varStock = typeof c.stock === "number" ? c.stock : 10;

    return {
      id: baseId,
      name: rawName,
      hex,
      borderHex,
      image: primaryImage,
      images: imagesArray,
      tag: c.tag || String(idx + 1).padStart(2, "0"),
      price: varPrice,
      priceInr: varPriceInr,
      stock: varStock,
    };
  });

  // Ensure normalizedChildVariants
  let normalizedChildVariants: IVariant[] = [];
  if (rawChildVariants.some((cv) => !isCorrupted(cv))) {
    normalizedChildVariants = rawChildVariants
      .filter((cv) => !isCorrupted(cv))
      .map((cv, idx) => ({
        sku: cv.sku || `${productId}-VAR-${idx + 1}`,
        color: cv.color || normalizedColorVariants[idx % normalizedColorVariants.length]?.name || "Standard",
        specOverride: cv.specOverride || "Standard Architecture",
        variantSpecs: cv.variantSpecs,
        price: Number(cv.price) || price,
        priceInr: Number(cv.priceInr) || Math.round((Number(cv.price) || price) * 83),
        discount: Number(cv.discount) || 0,
        stock: typeof cv.stock === "number" ? cv.stock : 10,
        images: Array.isArray(cv.images) && cv.images.length > 0
          ? cv.images
          : [cv.image || normalizedColorVariants[idx % normalizedColorVariants.length]?.image || "/images/hero-silver.jpg"],
      }));
  } else if (rawVariantGroups.length > 0) {
    normalizedChildVariants = variantGroupsToChildVariants(rawVariantGroups, price);
  } else {
    normalizedChildVariants = normalizedColorVariants.map((v, idx) => ({
      sku: `${productId}-${v.id.toUpperCase()}-${idx + 1}`,
      color: v.name,
      specOverride: "Standard Architecture",
      price: v.price || price,
      priceInr: v.priceInr || Math.round((v.price || price) * 83),
      discount: 0,
      stock: v.stock || 10,
      images: v.images && v.images.length > 0 ? v.images : [v.image || "/images/hero-silver.jpg"],
    }));
  }

  // Ensure normalizedVariantGroups
  const normalizedVariantGroups: IVariantGroup[] =
    rawVariantGroups.length > 0
      ? rawVariantGroups
      : childVariantsToVariantGroups(normalizedChildVariants, basePrice);

  const totalCalculatedStock = normalizedChildVariants.reduce(
    (sum, cv) => sum + (Number(cv.stock) || 0),
    0
  );

  return {
    ...clean,
    id: slug,
    slug,
    productId,
    name: clean.name || "Product",
    category: clean.category || "General Goods",
    categorySlug: clean.categorySlug || "general",
    model: clean.model || "Official Release",
    tagline: clean.tagline || "Engineered for utility and Scandinavian precision.",
    description: clean.description || "Authentic quality product crafted with high-grade components.",
    price,
    basePrice,
    priceInr,
    originalPrice,
    activeDiscount: Number(clean.activeDiscount) || 0,
    baseDiscount: Number(clean.baseDiscount) || 0,
    stock: totalCalculatedStock > 0 ? totalCalculatedStock : (Number(clean.stock) || 10),
    lowStockThreshold: Number(clean.lowStockThreshold) || 5,
    isFlashSale: Boolean(clean.isFlashSale),
    warrantyYears: Number(clean.warrantyYears) || 2,
    returnDays: Number(clean.returnDays) || 30,
    deliveryEstimate: clean.deliveryEstimate || "Ready to ship · Fast delivery in 2–4 business days",
    rating: Number(clean.rating) || 5.0,
    averageRating: Number(clean.averageRating || clean.rating) || 5.0,
    reviewCount: Number(clean.reviewCount) || 0,
    sku: clean.sku || `${productId}-MASTER`,
    globalSpecs: clean.globalSpecs || {},
    variants: normalizedColorVariants,
    colorVariants: normalizedColorVariants,
    childVariants: normalizedChildVariants,
    variantGroups: normalizedVariantGroups,
    lastRevalidatedAt: clean.lastRevalidatedAt || new Date().toISOString(),
  };
}

export interface IProduct {
  productId: string;         // Root product code (e.g., "ANC-AIR-TWS")
  name: string;
  description: string;
  globalSpecs: Record<string, string>; // Shared specifications across all variants
  basePrice: number;
  baseDiscount: number;
  type: string;              // "TWS Earbuds", "Over-Ear Headphones", etc.
  variants: IVariant[];      // Child array for flexible multi-variant configurations
  averageRating: number;     // Combined dynamic rating average
  reviewCount: number;
}

export interface IReview {
  reviewId: string;
  productId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  variantSku?: string;
  rating: number;            // 1 to 5 stars
  comment: string;
  images: string[];          // Maximum 5 items. Holds S3/CloudFront reference paths
  createdAt: string | Date;
}

export interface ProductCategoryDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  topSellingItems: string;
  growthDriver: string;
  defaultSpecs: Array<{ key: string; value: string }>;
}

export const ECOMMERCE_CATEGORIES: ProductCategoryDefinition[] = [
  {
    id: "apparel-fashion",
    name: "Apparel & Fashion",
    slug: "apparel-fashion",
    description: "Clothing, footwear, activewear, traditional wear",
    topSellingItems: "Clothing, footwear, activewear, traditional wear",
    growthDriver: "High repeat purchase rates and seasonal trends.",
    defaultSpecs: [
      { key: "Material / Fabric", value: "100% Organic Combed Cotton" },
      { key: "Fit Type", value: "Tailored Relaxed Fit" },
      { key: "Care Instructions", value: "Machine Wash Cold, Line Dry" },
      { key: "Origin / Make", value: "Ethically Milled & Crafted" },
    ],
  },
  {
    id: "electronics-accessories",
    name: "Electronics & Mobile Accessories",
    slug: "electronics-accessories",
    description: "Smartphones, chargers, earphones, power banks",
    topSellingItems: "Smartphones, chargers, earphones, power banks",
    growthDriver: "Constant tech upgrades and high consumer demand.",
    defaultSpecs: [
      { key: "Power Output / Charging", value: "65W GaN Fast Charging" },
      { key: "Ports & Connectivity", value: "USB-C PD 3.0 & MagSafe Qi" },
      { key: "Chassis Material", value: "CNC Anodized Aluminum" },
      { key: "Compatibility", value: "Universal iOS, Android & Mac/PC" },
    ],
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "Skincare, cosmetics, haircare, daily hygiene",
    topSellingItems: "Skincare, cosmetics, haircare, daily hygiene",
    growthDriver: "Strong brand loyalty and consumable replenishment.",
    defaultSpecs: [
      { key: "Active Formulation", value: "Dermatologically Tested, Cruelty-Free" },
      { key: "Net Volume / Weight", value: "100 ml / 3.4 fl oz" },
      { key: "Skin Type", value: "All Skin Types & Sensitive Barrier" },
      { key: "Shelf Life", value: "24 Months" },
    ],
  },
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Storage organizers, cookware, smart decor, bedding",
    topSellingItems: "Storage organizers, cookware, smart decor, bedding",
    growthDriver: "Remote work lifestyles and functional home utility.",
    defaultSpecs: [
      { key: "Dimensions", value: "38 cm x 25 cm x 12 cm" },
      { key: "Core Material", value: "Solid Japanese Walnut & Powdered Steel" },
      { key: "Assembly", value: "Zero Tools Required, Pre-assembled" },
      { key: "Load Capacity", value: "Up to 30 kg" },
    ],
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    slug: "health-wellness",
    description: "Vitamins, supplements, protein powders, OTC items",
    topSellingItems: "Vitamins, supplements, protein powders, OTC items",
    growthDriver: "Rising health awareness and subscription orders.",
    defaultSpecs: [
      { key: "Purity & Testing", value: "GMP Certified, 3rd Party Tested" },
      { key: "Servings", value: "30 Servings (1 Month Supply)" },
      { key: "Dietary", value: "100% Vegan, Non-GMO, Gluten-Free" },
      { key: "Recommended Use", value: "1 Scoop daily in water or shake" },
    ],
  },
  {
    id: "grocery-consumables",
    name: "Grocery & Consumables",
    slug: "grocery-consumables",
    description: "Snacks, instant meal kits, beverages, staple foods",
    topSellingItems: "Snacks, instant meal kits, beverages, staple foods",
    growthDriver: "Hyper-local quick-commerce delivery networks.",
    defaultSpecs: [
      { key: "Ingredients", value: "Single-Origin Artisanal Roast" },
      { key: "Net Weight", value: "500 grams (Whole Bean)" },
      { key: "Flavor Notes", value: "Dark Chocolate, Honeycomb, Citrus" },
      { key: "Storage Condition", value: "Airtight valve seal, Store dry" },
    ],
  },
  {
    id: "baby-kids",
    name: "Baby & Kids Products",
    slug: "baby-kids",
    description: "Diapers, wet wipes, baby food, educational toys",
    topSellingItems: "Diapers, wet wipes, baby food, educational toys",
    growthDriver: "Non-negotiable daily household necessity.",
    defaultSpecs: [
      { key: "Safety Certification", value: "ASTM / EN71 Certified, BPA-Free" },
      { key: "Age Grade", value: "0 to 36 Months" },
      { key: "Material", value: "Hypoallergenic Food-Grade Silicone" },
      { key: "Cleaning", value: "Sterilizer Safe & Dishwasher Safe" },
    ],
  },
  {
    id: "fitness-sports",
    name: "Fitness & Sports Gear",
    slug: "fitness-sports",
    description: "Yoga mats, resistance bands, activewear, dumbbells",
    topSellingItems: "Yoga mats, resistance bands, activewear, dumbbells",
    growthDriver: "Growing focus on home workouts and preventative health.",
    defaultSpecs: [
      { key: "Grip Surface", value: "Laser-Textured Anti-Slip Surface" },
      { key: "Resistance Range", value: "10 to 60 lbs Variable Tension" },
      { key: "Core Material", value: "Eco-Friendly Natural Tree Rubber" },
      { key: "Weight", value: "2.1 kg (Includes Carry Strap)" },
    ],
  },
  {
    id: "pet-care",
    name: "Pet Care Supplies",
    slug: "pet-care",
    description: "Dog/cat food, pet grooming products, toys",
    topSellingItems: "Dog/cat food, pet grooming products, toys",
    growthDriver: "High recurring spend by dedicated pet parents.",
    defaultSpecs: [
      { key: "Breed Size", value: "All Breeds (Puppy to Senior)" },
      { key: "Durability", value: "Tear-Proof Ballistic Nylon Weave" },
      { key: "Safety", value: "100% Non-Toxic & Lead-Free" },
      { key: "Washing", value: "Machine Washable Cover" },
    ],
  },
  {
    id: "fashion-jewellery",
    name: "Fashion Jewellery",
    slug: "fashion-jewellery",
    description: "Imitation rings, earrings, trend necklaces, watches",
    topSellingItems: "Imitation rings, earrings, trend necklaces, watches",
    growthDriver: "Low manufacturing costs and high retail profit margins.",
    defaultSpecs: [
      { key: "Plating & Base", value: "18K Gold Triple PVD on 316L Steel" },
      { key: "Water Resistance", value: "100% Waterproof, Sweatproof & Hypoallergenic" },
      { key: "Chain Length", value: "45 cm + 5 cm Extender" },
      { key: "Packaging", value: "Luxury Velvet Pouch & Certificate" },
    ],
  },
];

export interface ProductData {
  _id?: string;
  id: string;
  slug: string;
  productId?: string;
  categorySlug: string;
  name: string;
  model: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  priceInr?: number;
  basePrice?: number;
  baseDiscount?: number;
  type?: string;
  activeDiscount: number;
  stock: number;
  lowStockThreshold: number;
  isFlashSale: boolean;
  warrantyYears: number;
  returnDays: number;
  deliveryEstimate: string;
  rating: number;
  averageRating?: number;
  reviewCount: number;
  sku: string;
  isTws?: boolean;
  twsComponents?: TwsComponentOption[];
  mediaGallery?: MediaGalleryItem[];
  primaryValueCallouts?: ValueCallout[];
  explodedView?: ExplodedViewData;
  tabbedSpecs?: TabbedSpecs;
  globalSpecs?: Record<string, string>;
  hygienePolicy?: HygienePolicyData;
  qna?: ProductQnA[];
  variants: ColorVariant[];
  childVariants?: IVariant[];
  variantGroups?: IVariantGroup[];
  specs?: {
    dimensionsMetric?: string;
    dimensionsImperial?: string;
    weightMetric?: string;
    weightImperial?: string;
    batteryLife?: string;
    charging?: string;
    driver?: string;
    noiseControl?: string;
    connectivity?: string;
    codecs?: string;
    materials?: string;
    inTheBox?: string;
    [key: string]: string | undefined;
  };
  metrics?: {
    playtime?: string;
    driverSize?: string;
    weight?: string;
    bluetooth?: string;
    [key: string]: string | undefined;
  };
  lastRevalidatedAt: string;
}

export interface Review {
  id: string;
  reviewId?: string;
  productId?: string;
  userId?: string;
  author: string;
  role: string;
  initials: string;
  variant: string;
  variantSku?: string;
  rating: number;
  comment: string;
  verified: boolean;
  images?: string[];
  tags?: string[];
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  variant: ProductColor;
  variantName: string;
  component?: string;
  componentSku?: string;
  price: number;
  priceInr?: number;
  quantity: number;
  image: string;
  fit: string;
}

export interface OrderEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "order" | "payment" | "delivery" | "cancellation" | "refund";
  actor?: string;
}

export interface OrderCancellation {
  requested: boolean;
  requestedAt?: string;
  reason?: string;
  status: "none" | "requested" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export type TransportMode = "bike" | "van" | "truck" | "train" | "plane";

export interface GateOtpSession {
  active: boolean;
  otp?: string;
  triggeredAt?: string;
  expiresAt?: string;
  remainingSeconds?: number;
  verified?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: {
    fullName: string;
    email: string;
    contact?: string;
    country?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: "razorpay" | "apple_pay" | "google_pay";
  paymentStatus: "paid" | "pending" | "refunded" | "refund_initiated";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpayRefundId?: string;
  refundAmount?: number;
  refundInitiatedAt?: string;
  deliveryStatus?: "processing" | "dispatched" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled";
  currentHub?: string;
  trackingNumber?: string;
  transitMode?: TransportMode;
  vehicleNo?: string;
  manifestVerified?: boolean;
  gateOtpSession?: GateOtpSession;
  cancellation?: OrderCancellation;
  events?: OrderEvent[];
  createdAt: string;
  awsEventBridgeDispatched: boolean;
  cacheRevalidated: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "user" | "customer";
}

export interface AWSEventLog {
  id: string;
  eventId: string;
  source: string;
  detailType: string;
  timestamp: string;
  detail: Record<string, unknown>;
  lambdaExecution: {
    status: "SUCCEEDED" | "FAILED";
    durationMs: number;
    logStream: string;
  };
  revalidationStatus: {
    revalidatedPath: string;
    tags: string[];
    status: "SUCCESS" | "FAILED";
  };
}

export interface ShippingSettings {
  generalDeliveryPriceUsd: number;
  generalDeliveryPriceInr: number;
  expressDeliveryPriceUsd: number;
  expressDeliveryPriceInr: number;
}

