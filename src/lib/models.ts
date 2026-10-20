import mongoose, { Schema, Document } from "mongoose";
import { ProductData, Order, User, AWSEventLog } from "@/types";

export type IProductDoc = Document & Omit<ProductData, "id" | "_id" | "model"> & {
  model: string;
};
export interface IOrderDoc extends Document, Omit<Order, "id" | "_id"> {}
export interface IUserDoc extends Document, Omit<User, "id" | "_id"> {
  passwordHash: string;
}
export interface IAWSEventLogDoc extends Document, Omit<AWSEventLog, "id" | "_id"> {}

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    model: { type: String, required: true },
    category: { type: String, default: "Audio / Over-Ear" },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    activeDiscount: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 5 },
    lowStockThreshold: { type: Number, default: 5 },
    isFlashSale: { type: Boolean, default: false },
    warrantyYears: { type: Number, default: 2 },
    returnDays: { type: Number, default: 30 },
    deliveryEstimate: { type: String, default: "Ready to ship · US delivery in 3–5 business days" },
    variants: [
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

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      contact: { type: String },
      country: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    items: [
      {
        productId: String,
        name: String,
        variant: String,
        variantName: String,
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
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
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

export const OrderModel =
  mongoose.models.Order || mongoose.model<IOrderDoc>("Order", OrderSchema);

export const UserModel =
  mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);

export const AWSEventLogModel =
  mongoose.models.AWSEventLog || mongoose.model<IAWSEventLogDoc>("AWSEventLog", AWSEventLogSchema);
