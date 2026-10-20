export type ProductColor = "silver" | "graphite" | "sandstone";

export interface ColorVariant {
  id: ProductColor;
  name: string;
  hex: string;
  borderHex: string;
  image: string;
  tag: string;
}

export type ProductVariant = ColorVariant;

export interface ProductData {
  _id?: string;
  id: string;
  name: string;
  model: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  activeDiscount: number;
  stock: number;
  lowStockThreshold: number;
  isFlashSale: boolean;
  warrantyYears: number;
  returnDays: number;
  deliveryEstimate: string;
  variants: ColorVariant[];
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
  author: string;
  role: string;
  initials: string;
  variant: string;
  rating: number;
  comment: string;
  verified: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  variant: ProductColor;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
  fit: string;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  role: "admin" | "customer";
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
