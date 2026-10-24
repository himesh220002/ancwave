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

export interface IVariant {
  sku: string;               // Unique stock keeping unit
  color: string;             // Variant color
  specOverride: string;      // Specific variance details (e.g., "Detachable Mic", "Attached Mic")
  price: number;             // Override price if different from parent
  discount: number;          // Specific variant discount percentage
  stock: number;             // Real-time inventory count
  images: string[];          // S3 URLs / CloudFront Paths specific to this variant
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

export interface ProductData {
  _id?: string;
  id: string;
  slug: string;
  productId?: string;
  categorySlug: "headphones" | "earbuds" | "earphones";
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
  specs: {
    dimensionsMetric: string;
    dimensionsImperial: string;
    weightMetric: string;
    weightImperial: string;
    batteryLife: string;
    charging: string;
    driver: string;
    noiseControl: string;
    connectivity: string;
    codecs: string;
    materials: string;
    inTheBox: string;
  };
  metrics: {
    playtime: string;
    driverSize: string;
    weight: string;
    bluetooth: string;
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
