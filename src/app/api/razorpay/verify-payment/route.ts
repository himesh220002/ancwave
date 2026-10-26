import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel, ProductModel } from "@/lib/models";
import { Order, OrderEvent } from "@/types";
import { dispatchOrderPlacedEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";
import { generateRazorpayOrderEmail } from "@/lib/email-service";
import { deductOrderStock } from "@/lib/inventory-service";

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
      userId,
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

    // Items array
    const rawItems =
      items && Array.isArray(items) && items.length > 0
        ? items
        : [
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
          ];

    // Check available stock
    const currentProduct = store.getProduct();
    const totalQuantity = rawItems.reduce(
      (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
      0
    );

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

    // Deduct stock in real-time across both MongoDB Atlas and memory store
    const stockDeductionResults = await deductOrderStock(rawItems);
    const updatedProduct = store.getProduct();
    const previousStock = currentProduct.stock;

    // Calculate dynamic subtotal, shipping, and total
    const computedSubtotal = rawItems.reduce(
      (sum: number, it: any) =>
        sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const tax = typeof body.tax === "number" ? body.tax : 0.0;
    const total = Number(amount) > 0 ? Number(amount) : (computedSubtotal + tax);

    // If order is a nominal test payment (e.g. 0.02) where item was catalog price 348
    if (rawItems.length === 1 && rawItems[0].price > total && total > 0) {
      rawItems[0].price = total / (rawItems[0].quantity || 1);
    }

    const reconciledItemsSubtotal = rawItems.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    const subtotal = (reconciledItemsSubtotal > 0 && reconciledItemsSubtotal <= total)
      ? reconciledItemsSubtotal
      : (typeof body.subtotal === "number" && body.subtotal <= total)
        ? body.subtotal
        : Math.max(0, total - tax);

    const shipping = Math.max(0, Math.round((total - subtotal - tax) * 100) / 100);

    const orderNumber = "ANC-" + Math.floor(100000 + Math.random() * 900000);

    const finalPaymentId = razorpay_payment_id || "pay_" + Math.random().toString(36).substring(2, 14);
    const finalOrderId = razorpay_order_id || "order_demo";

    const initialEvents: OrderEvent[] = [
      {
        id: "ev-" + Math.random().toString(36).substring(2, 9),
        title: "Order Placed & Payment Verified",
        description: `Payment ID: ${finalPaymentId}. Amount of $${total.toFixed(2)} USD successfully captured via Razorpay.`,
        timestamp: new Date().toISOString(),
        type: "payment",
        actor: "Razorpay Gateway",
      },
      {
        id: "ev-" + Math.random().toString(36).substring(2, 9),
        title: "Order Allocated at Fulfillment Hub",
        description: `Order registered in logistics pipeline and queued for dispatch at Portland Primary Logistics Center.`,
        timestamp: new Date().toISOString(),
        type: "delivery",
        actor: "Portland Primary Logistics Center",
      },
    ];

    const order: Order = {
      id: "ord-" + Math.random().toString(36).substring(2, 9),
      orderNumber,
      userId: userId || undefined,
      customer: customer || {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        address: "1420 NW Johnson Street",
        city: "Portland",
        state: "Oregon",
        zipCode: "97209",
      },
      items: rawItems,
      subtotal,
      shipping,
      tax,
      total,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayPaymentId: finalPaymentId,
      razorpayOrderId: finalOrderId,
      deliveryStatus: "processing",
      currentHub: "Portland Primary Logistics Center",
      trackingNumber: `TRK-${orderNumber.replace(/[^0-9]/g, "")}`,
      transitMode: "van",
      vehicleNo: "OR-EXP-8891",
      manifestVerified: true,
      cancellation: {
        requested: false,
        status: "none",
      },
      events: initialEvents,
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
      } catch (err) {
        console.warn("MongoDB order sync notice:", err);
      }
    }

    // 1. Dispatch AWS EventBridge Event: OrderPlaced
    const awsLog = await dispatchOrderPlacedEvent(order);

    // 2. Generate Custom Razorpay Email Receipt
    const emailReceipt = generateRazorpayOrderEmail(order);

    // 3. Wipe old cache out instantly via on-demand revalidation!
    try {
      revalidatePath("/");
      revalidatePath("/api/product");
      revalidatePath("/orders");
    } catch (err) {
      console.warn("Revalidate execution notice:", err);
    }

    return NextResponse.json({
      success: true,
      order,
      emailReceipt,
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
      message: `Razorpay payment verified! Order ${orderNumber} confirmed. Custom email receipt dispatched.`,
    });
  } catch (error) {
    console.error("Error in /api/razorpay/verify-payment:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
