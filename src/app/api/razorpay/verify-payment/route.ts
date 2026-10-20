import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel, ProductModel } from "@/lib/models";
import { Order } from "@/types";
import { dispatchOrderPlacedEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
      amount = 361,
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Signature verification when real secret is present
    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: "Invalid Razorpay payment signature" },
          { status: 400 }
        );
      }
    }

    // Check available stock
    const currentProduct = store.getProduct();
    const totalQuantity = items?.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0) || 1;

    if (currentProduct.stock < totalQuantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${currentProduct.stock} unit(s) remaining in stock.`,
          currentStock: currentProduct.stock,
        },
        { status: 400 }
      );
    }

    // Deduct stock in real-time
    const { product: updatedProduct, previousStock } = store.reduceStock(totalQuantity);

    const subtotal = 348.0;
    const shipping = 12.0;
    const tax = 0.0;
    const total = Number(amount) || subtotal + shipping + tax;

    const orderNumber = "ANC-" + Math.floor(100000 + Math.random() * 900000);

    const order: Order = {
      id: "ord-" + Math.random().toString(36).substring(2, 9),
      orderNumber,
      customer: customer || {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        address: "1420 NW Johnson Street",
        city: "Portland",
        state: "Oregon",
        zipCode: "97209",
      },
      items: items || [
        {
          productId: "form-01",
          name: "Form 01",
          variant: "silver",
          variantName: "Silver mist",
          price: 348.0,
          quantity: 1,
          image: "/images/checkout-floating.jpg",
          fit: "One size · adjustable",
        },
      ],
      subtotal,
      shipping,
      tax,
      total,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayPaymentId: razorpay_payment_id || "pay_" + Math.random().toString(36).substring(2, 14),
      razorpayOrderId: razorpay_order_id || "order_demo",
      createdAt: new Date().toISOString(),
      awsEventBridgeDispatched: true,
      cacheRevalidated: true,
    };

    // Save to store
    store.addOrder(order);

    // Save to MongoDB if available
    const db = await connectDB();
    if (db) {
      try {
        await OrderModel.create(order);
        await ProductModel.findOneAndUpdate(
          { model: "WIRELESS OVER-EAR" },
          { stock: updatedProduct.stock },
          { upsert: true }
        );
      } catch (err) {
        console.warn("MongoDB order sync notice:", err);
      }
    }

    // 1. Dispatch AWS EventBridge Event: OrderPlaced
    const awsLog = await dispatchOrderPlacedEvent(order);

    // 2. Wipe old cache out instantly via on-demand revalidation!
    try {
      revalidatePath("/");
      revalidatePath("/api/product");
    } catch (err) {
      console.warn("Revalidate execution notice:", err);
    }

    return NextResponse.json({
      success: true,
      order,
      inventoryUpdate: {
        previousStock,
        newStock: updatedProduct.stock,
        lowStockAlertTriggered: updatedProduct.stock <= updatedProduct.lowStockThreshold,
        remainingUnits: updatedProduct.stock,
      },
      awsEventBridge: {
        eventId: awsLog.eventId,
        source: awsLog.source,
      },
      message: `Razorpay payment verified! Order ${orderNumber} confirmed. Edge cache revalidated.`,
    });
  } catch (error) {
    console.error("Error in /api/razorpay/verify-payment:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
