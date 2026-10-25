import mongoose, { Schema, Document } from "mongoose";
import { ProductData, Order, User, AWSEventLog, IVariant, IProduct, IReview } from "@/types";

export interface IVariantDoc extends Document, IVariant {}

export type IProductDoc = Document &
  Omit<ProductData, "id" | "_id" | "model"> & {
    productId: string;
    globalSpecs: Record<string, string>;
    basePrice: number;
    baseDiscount: number;
    type: string;
    model: string;
    childVariants?: IVariant[];
    averageRating: number;
    reviewCount: number;
  };

export interface IReviewDoc extends Document, Omit<IReview, "id" | "_id"> {
  createdAt: Date;
}

export interface IOrderDoc extends Document, Omit<Order, "id" | "_id"> {
  userId?: string;
}

export interface IUserDoc extends Document, Omit<User, "id" | "_id"> {
  passwordHash: string;
}

export interface IAWSEventLogDoc extends Document, Omit<AWSEventLog, "id" | "_id"> {}

const VariantSchema = new Schema(
  {
    sku: { type: String, required: true },
    color: { type: String, required: true },
    specOverride: { type: String, default: "" },
    price: { type: Number, default: 0 },
    priceInr: { type: Number },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    // Master Product Specification
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    globalSpecs: { type: Schema.Types.Mixed, default: {} },
    basePrice: { type: Number, required: true },
    baseDiscount: { type: Number, default: 0 },
    type: { type: String, default: "Over-Ear Headphones" },
    variants: [VariantSchema],
    averageRating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },

    // E-Commerce Storefront Compatibility
    slug: { type: String, index: true },
    model: { type: String, default: "WIRELESS OVER-EAR" },
    category: { type: String, default: "Audio / Over-Ear" },
    categorySlug: { type: String, default: "headphones" },
    tagline: { type: String, default: "Less noise. More you." },
    price: { type: Number, default: 349 },
    priceInr: { type: Number },
    originalPrice: { type: Number, default: 399 },
    activeDiscount: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 4 },
    lowStockThreshold: { type: Number, default: 5 },
    isFlashSale: { type: Boolean, default: false },
    warrantyYears: { type: Number, default: 2 },
    returnDays: { type: Number, default: 30 },
    deliveryEstimate: { type: String, default: "Ready to ship · US delivery in 3–5 business days" },
    rating: { type: Number, default: 5.0 },
    sku: { type: String, default: "ANC-MASTER-01" },

    colorVariants: [
      {
        id: String,
        name: String,
        hex: String,
        borderHex: String,
        image: String,
        tag: String,
      },
    ],
    specs: {
      dimensionsMetric: String,
      dimensionsImperial: String,
      weightMetric: String,
      weightImperial: String,
      batteryLife: String,
      charging: String,
      driver: String,
      noiseControl: String,
      connectivity: String,
      codecs: String,
      materials: String,
      inTheBox: String,
    },
    metrics: {
      playtime: String,
      driverSize: String,
      weight: String,
      bluetooth: String,
    },
    lastRevalidatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const ReviewSchema = new Schema(
  {
    reviewId: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "Verified Buyer" },
    userRole: { type: String, default: "Acoustic Enthusiast" },
    userInitials: { type: String, default: "VB" },
    variantSku: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: {
      type: [String],
      validate: {
        validator: function (val: string[]) {
          return !val || val.length <= 5;
        },
        message: "Maximum limit of 5 photos per review exceeded",
      },
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, index: true },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, index: true },
      contact: { type: String },
      country: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    items: [
      {
        productId: { type: String, required: true, index: true },
        name: String,
        variant: String,
        variantName: String,
        componentSku: String,
        price: Number,
        quantity: Number,
        image: String,
        fit: String,
      },
    ],
    subtotal: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    paymentMethod: {
      type: String,
      enum: ["razorpay", "apple_pay", "google_pay"],
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid",
    },
    razorpayPaymentId: String,
    razorpayOrderId: String,
    awsEventBridgeDispatched: { type: Boolean, default: true },
    cacheRevalidated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "user", "customer"],
      default: "user",
    },
  },
  { timestamps: true }
);

const AWSEventLogSchema = new Schema(
  {
    eventId: { type: String, required: true },
    source: { type: String, required: true },
    detailType: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    detail: { type: Schema.Types.Mixed },
    lambdaExecution: {
      status: { type: String, enum: ["SUCCEEDED", "FAILED"], default: "SUCCEEDED" },
      durationMs: Number,
      logStream: String,
    },
    revalidationStatus: {
      revalidatedPath: String,
      tags: [String],
      status: { type: String, default: "SUCCESS" },
    },
  },
  { timestamps: true }
);

export const ProductModel =
  mongoose.models.Product || mongoose.model<IProductDoc>("Product", ProductSchema);

export const ReviewModel =
  mongoose.models.Review || mongoose.model<IReviewDoc>("Review", ReviewSchema);

export const OrderModel =
  mongoose.models.Order || mongoose.model<IOrderDoc>("Order", OrderSchema);

export const UserModel =
  mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);

export const AWSEventLogModel =
  mongoose.models.AWSEventLog || mongoose.model<IAWSEventLogDoc>("AWSEventLog", AWSEventLogSchema);

export interface IShippingSettingsDoc extends Document {
  key: string;
  generalDeliveryPriceUsd: number;
  generalDeliveryPriceInr: number;
  expressDeliveryPriceUsd: number;
  expressDeliveryPriceInr: number;
}

const ShippingSettingsSchema = new Schema(
  {
    key: { type: String, default: "global_shipping_fixtures", unique: true },
    generalDeliveryPriceUsd: { type: Number, default: 0 },
    generalDeliveryPriceInr: { type: Number, default: 0 },
    expressDeliveryPriceUsd: { type: Number, default: 15 },
    expressDeliveryPriceInr: { type: Number, default: 1200 },
  },
  { timestamps: true }
);

export const ShippingSettingsModel =
  mongoose.models.ShippingSettings ||
  mongoose.model<IShippingSettingsDoc>("ShippingSettings", ShippingSettingsSchema);

