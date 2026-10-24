export type ProductColor = "silver" | "graphite" | "sandstone" | "white" | "black" | "teal" | string;

export interface ColorVariant {
  id: ProductColor;
  name: string;
  hex: string;
  borderHex: string;
  image: string;
  images?: string[]; // Multiple high-res images for this variant
  tag: string;
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
  discount?: number;
  colors: IVariantColor[];
}

export interface IVariant {
  sku: string;               // Unique stock keeping unit: e.g. NVX1-A1-BLK
  color: string;             // Variant color
  specOverride: string;      // Specific variance details (e.g., "A1 (Large Display Edition)")
  variantSpecs?: Record<string, string>; // Specific specs overrides for this variant
  price: number;             // Override price if different from parent
  discount: number;          // Specific variant discount percentage
  stock: number;             // Real-time inventory count
  images: string[];          // S3 URLs / CloudFront Paths specific to this variant
}

export function variantGroupsToChildVariants(groups: IVariantGroup[], defaultPrice = 99): IVariant[] {
  const result: IVariant[] = [];
  (groups || []).forEach((g) => {
    (g.colors || []).forEach((c) => {
      result.push({
        sku: c.sku,
        color: c.color,
        specOverride: g.name || g.specOverride || "Standard Edition",
        variantSpecs: g.variantSpecs,
        price: c.price ?? g.price ?? defaultPrice,
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
      discount: cv.discount,
      stock: cv.stock,
      images: cv.images,
    });
  });
  return Array.from(map.values());
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
  quantity: number;
  image: string;
  fit: string;
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
  paymentStatus: "paid" | "pending";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
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
