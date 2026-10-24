import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { Order } from "@/types";
import { generateRazorpayOrderEmail } from "@/lib/email-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const userId = searchParams.get("userId");
    const orderNumber = searchParams.get("orderNumber");
    const all = searchParams.get("all") === "true";

    let orders: Order[] = [];

    // Try MongoDB first
    const db = await connectDB();
    if (db) {
      try {
        const query: Record<string, any> = {};
        if (orderNumber) {
          query.orderNumber = { $regex: new RegExp(`^${orderNumber}$`, "i") };
        } else if (userId && !all) {
          query.$or = [{ userId }, { "customer.email": email || "" }];
        } else if (email && !all) {
          query["customer.email"] = { $regex: new RegExp(`^${email}$`, "i") };
        }

        const mongoOrders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
        if (mongoOrders && mongoOrders.length > 0) {
          orders = mongoOrders.map((o: any) => ({
            id: o._id?.toString() || o.id,
            orderNumber: o.orderNumber,
            userId: o.userId,
            customer: o.customer,
            items: o.items,
            subtotal: o.subtotal,
            shipping: o.shipping,
            tax: o.tax,
            total: o.total,
            paymentMethod: o.paymentMethod || "razorpay",
            paymentStatus: o.paymentStatus || "paid",
            razorpayPaymentId: o.razorpayPaymentId,
            razorpayOrderId: o.razorpayOrderId,
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
            awsEventBridgeDispatched: o.awsEventBridgeDispatched ?? true,
            cacheRevalidated: o.cacheRevalidated ?? true,
          }));
        }
      } catch (err) {
        console.warn("MongoDB orders fetch notice:", err);
      }
    }

    // Fallback/Merge with memory store
    const storeOrders = store.getOrders();
    const existingOrderNumbers = new Set(orders.map((o) => o.orderNumber.toUpperCase()));

    storeOrders.forEach((so) => {
      if (!existingOrderNumbers.has(so.orderNumber.toUpperCase())) {
        let match = true;
        if (orderNumber && so.orderNumber.toLowerCase() !== orderNumber.toLowerCase()) {
          match = false;
        } else if (email && !all && so.customer.email.toLowerCase() !== email.toLowerCase()) {
          match = false;
        } else if (userId && !all && so.userId !== userId && (!email || so.customer.email.toLowerCase() !== email.toLowerCase())) {
          match = false;
        }

        if (match || all) {
          orders.push(so);
          existingOrderNumbers.add(so.orderNumber.toUpperCase());
        }
      }
    });

    // Sort newest first
    orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderNumber, email } = body;

    let targetOrder: Order | undefined;

    // Search in store
    targetOrder = store.getOrders().find((o) => o.orderNumber === orderNumber);

    // Search in MongoDB if not found
    if (!targetOrder) {
      const db = await connectDB();
      if (db) {
        const found = await OrderModel.findOne({ orderNumber }).lean();
        if (found) {
          targetOrder = found as unknown as Order;
        }
      }
    }

    if (!targetOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (action === "get-email" || action === "resend-email") {
      const emailData = generateRazorpayOrderEmail(targetOrder);

      return NextResponse.json({
        success: true,
        message: `Custom Razorpay payment confirmation email generated for ${targetOrder.customer.email}`,
        email: emailData,
      });
    }

    return NextResponse.json({ success: true, order: targetOrder });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Order action failed" },
      { status: 500 }
    );
  }
}
