import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel, ProductModel } from "@/lib/models";
import { Order, OrderEvent } from "@/types";
import { dispatchOrderPlacedEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

/**
 * Validates the cryptographic HMAC-SHA256 signature sent by Razorpay in the x-razorpay-signature header
 */
function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret || !rawBody) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    console.error("Signature verification exception:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify cryptographic signature if secret is configured (and not the default placeholder)
    const isLiveSecretConfigured =
      webhookSecret &&
      webhookSecret.trim() !== "" &&
      webhookSecret !== "your_razorpay_webhook_secret_key";

    if (isLiveSecretConfigured) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn("[Razorpay Webhook] Invalid signature rejection. Received:", signature);
        return NextResponse.json(
          { success: false, error: "Invalid Razorpay webhook signature" },
          { status: 400 }
        );
      }
    } else {
      console.log(
        "[Razorpay Webhook] Notice: RAZORPAY_WEBHOOK_SECRET is in dev/mock mode. Skipping signature rejection."
      );
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const eventType: string = event.event;
    console.log(`[Razorpay Webhook] Received Event: ${eventType} (ID: ${event.id || "N/A"})`);

    // Handle payment.captured OR order.paid
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const razorpayPaymentId = paymentEntity?.id || "pay_webhook_" + Date.now().toString(36);
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id || "order_webhook_" + Date.now().toString(36);
      const amountPaise = paymentEntity?.amount || orderEntity?.amount || 36100;
      const totalUSD = amountPaise / 100; // Razorpay uses 100-base sub-units (paise/cents)

      const notes = {
        ...(orderEntity?.notes || {}),
        ...(paymentEntity?.notes || {}),
      };

      const customerEmail = paymentEntity?.email || notes.email || "customer@ancwave.com";
      const customerName = notes.fullName || notes.name || "Verified Customer";
      const orderNumber = notes.orderNumber || orderEntity?.receipt || ("ANC-" + Math.floor(100000 + Math.random() * 900000));
      const productId = notes.productId || "form-01";
      const variantSku = notes.variantSku || "ANC-FORM01-SILVER-BOOM";
      const quantity = Number(notes.quantity) || 1;

      // 1. Check if order already exists in MongoDB
      let existingOrder: Order | null = null;
      const db = await connectDB();
      if (db) {
        try {
          const dbOrder = await OrderModel.findOne({
            $or: [{ razorpayOrderId }, { orderNumber }, { razorpayPaymentId }],
          });
          if (dbOrder) {
            dbOrder.paymentStatus = "paid";
            dbOrder.razorpayPaymentId = razorpayPaymentId;
            dbOrder.razorpayOrderId = razorpayOrderId;
            await dbOrder.save();
            existingOrder = dbOrder.toObject() as unknown as Order;
            console.log(`[Razorpay Webhook] Updated existing MongoDB order: ${orderNumber}`);
          }
        } catch (dbErr) {
          console.warn("[Razorpay Webhook] DB lookup warning:", dbErr);
        }
      }

      // 2. Check if order exists in in-memory store
      if (!existingOrder) {
        const storeOrders = store.getOrders();
        const found = storeOrders.find(
          (o) =>
            o.razorpayOrderId === razorpayOrderId ||
            o.orderNumber === orderNumber ||
            o.razorpayPaymentId === razorpayPaymentId
        );
        if (found) {
          found.paymentStatus = "paid";
          found.razorpayPaymentId = razorpayPaymentId;
          found.razorpayOrderId = razorpayOrderId;
          existingOrder = found;
          console.log(`[Razorpay Webhook] Updated existing store order: ${orderNumber}`);
        }
      }

      // 3. If order doesn't exist yet (webhook arrived first), create and fulfill it automatically
      let finalOrder = existingOrder;
      if (!finalOrder) {
        // Deduct inventory stock
        const { product: updatedProduct } = store.reduceStock(quantity, productId);

        finalOrder = {
          id: "ord-wh-" + Math.random().toString(36).substring(2, 9),
          orderNumber,
          customer: {
            fullName: customerName,
            email: customerEmail,
            address: notes.address || "1420 NW Johnson Street",
            city: notes.city || "Portland",
            state: notes.state || "Oregon",
            zipCode: notes.zipCode || "97209",
            contact: paymentEntity?.contact,
          },
          items: [
            {
              productId,
              name: "Form 01",
              variant: "silver",
              variantName: "Silver mist",
              componentSku: variantSku,
              price: 349,
              quantity,
              image: "/images/hero-silver.jpg",
              fit: "One size · adjustable",
            },
          ],
          subtotal: 349,
          shipping: 12,
          tax: 0,
          total: totalUSD,
          paymentMethod: "razorpay",
          paymentStatus: "paid",
          razorpayPaymentId,
          razorpayOrderId,
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
          events: [
            {
              id: "ev-" + Math.random().toString(36).substring(2, 9),
              title: "Payment Verified via Razorpay Webhook",
              description: `Payment ID: ${razorpayPaymentId}. Amount: $${totalUSD.toFixed(2)} USD captured.`,
              timestamp: new Date().toISOString(),
              type: "payment",
              actor: "Razorpay Webhook",
            },
            {
              id: "ev-" + Math.random().toString(36).substring(2, 9),
              title: "Order Placed & Queued for Processing",
              description: `Order #${orderNumber} registered at Portland Primary Logistics Center.`,
              timestamp: new Date().toISOString(),
              type: "order",
              actor: "Fulfillment Pipeline",
            },
          ],
          createdAt: new Date().toISOString(),
          awsEventBridgeDispatched: true,
          cacheRevalidated: true,
        };

        // Persist to store
        store.addOrder(finalOrder);

        // Persist to MongoDB
        if (db) {
          try {
            await OrderModel.create(finalOrder);
            await ProductModel.findOneAndUpdate(
              { slug: productId },
              { stock: updatedProduct.stock }
            );
          } catch (dbSaveErr) {
            console.warn("[Razorpay Webhook] DB creation warning:", dbSaveErr);
          }
        }
        console.log(`[Razorpay Webhook] Created new verified order from webhook: ${orderNumber}`);
      }

      // 4. Dispatch AWS EventBridge Event: OrderPlaced
      let awsLog;
      try {
        awsLog = await dispatchOrderPlacedEvent(finalOrder);
      } catch (awsErr) {
        console.warn("[Razorpay Webhook] EventBridge dispatch notice:", awsErr);
      }

      // 5. On-Demand Next.js ISR Edge Cache Revalidation
      try {
        revalidatePath("/");
        revalidatePath("/api/product");
        revalidatePath(`/products/${productId}`);
      } catch (revalErr) {
        console.warn("[Razorpay Webhook] Revalidation notice:", revalErr);
      }

      return NextResponse.json({
        success: true,
        received: true,
        event: eventType,
        orderNumber: finalOrder.orderNumber,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        awsEventId: awsLog?.eventId,
        message: `Razorpay webhook processed. Order ${finalOrder.orderNumber} marked paid and edge cache revalidated.`,
      });
    }

    // Handle payment.failed
    if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const errorCode = paymentEntity?.error_code;
      const errorDescription = paymentEntity?.error_description;

      console.warn(
        `[Razorpay Webhook] Payment failed for Order ${razorpayOrderId}. Code: ${errorCode}, Description: ${errorDescription}`
      );

      // Update order status if in DB
      const db = await connectDB();
      if (db && razorpayOrderId) {
        try {
          await OrderModel.findOneAndUpdate(
            { razorpayOrderId },
            { paymentStatus: "pending" }
          );
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        success: true,
        received: true,
        event: eventType,
        orderId: razorpayOrderId,
        errorCode,
        errorDescription,
        message: "Payment failure acknowledged.",
      });
    }

    // Handle refund.processed
    if (eventType === "refund.processed") {
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      console.log(`[Razorpay Webhook] Refund processed for Payment ${paymentId}`);

      const db = await connectDB();
      if (db && paymentId) {
        try {
          await OrderModel.findOneAndUpdate(
            { razorpayPaymentId: paymentId },
            { paymentStatus: "refunded" as any }
          );
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        success: true,
        received: true,
        event: eventType,
        paymentId,
        refundId: refundEntity?.id,
        message: "Refund processed acknowledged.",
      });
    }

    // Acknowledge any other unhandled Razorpay events with 200
    return NextResponse.json({
      success: true,
      received: true,
      event: eventType,
      message: `Event '${eventType}' received and acknowledged.`,
    });
  } catch (error) {
    console.error("[Razorpay Webhook] Server error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}

/**
 * Health check & configuration guide endpoint
 */
export async function GET() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const isConfigured =
    Boolean(webhookSecret) &&
    webhookSecret !== "your_razorpay_webhook_secret_key";

  return NextResponse.json({
    status: "active",
    endpoint: "/api/razorpay/webhook",
    service: "ancwave Razorpay Webhook Orchestrator",
    isSecretConfigured: isConfigured,
    supportedEvents: [
      "payment.captured",
      "order.paid",
      "payment.failed",
      "refund.processed",
    ],
    instructions: {
      step1: "Log into the Razorpay Dashboard (https://dashboard.razorpay.com).",
      step2: "Go to Settings ➔ Webhooks ➔ Add New Webhook.",
      step3: "Set Webhook URL to: <YOUR_APP_URL>/api/razorpay/webhook",
      step4: "Set Secret to match RAZORPAY_WEBHOOK_SECRET in your .env.local file.",
      step5: "Check events: payment.captured, order.paid, payment.failed, refund.processed.",
    },
  });
}
