import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { Order, OrderEvent, OrderCancellation } from "@/types";
import { generateRazorpayOrderEmail } from "@/lib/email-service";

function normalizeOrder(o: any): Order {
  const orderNumber = o.orderNumber || "ANC-000000";
  const defaultEvents: OrderEvent[] = [
    {
      id: "ev-auto-1",
      title: "Order Placed & Paid",
      description: `Order ${orderNumber} authorized via ${o.paymentMethod?.toUpperCase() || "RAZORPAY"}. Total: $${Number(o.total || 0).toFixed(2)}`,
      timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      type: "payment",
      actor: "Razorpay Gateway",
    },
    {
      id: "ev-auto-2",
      title: "Logistics Routing Initialized",
      description: `Package queued at ${o.currentHub || "Portland Primary Logistics Center"} for inspection.`,
      timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      type: "delivery",
      actor: "Logistics Center",
    },
  ];

  return {
    id: o._id?.toString() || o.id,
    orderNumber,
    userId: o.userId,
    customer: o.customer,
    items: o.items || [],
    subtotal: o.subtotal || 0,
    shipping: o.shipping || 0,
    tax: o.tax || 0,
    total: o.total || 0,
    paymentMethod: o.paymentMethod || "razorpay",
    paymentStatus: o.paymentStatus || "paid",
    razorpayPaymentId: o.razorpayPaymentId,
    razorpayOrderId: o.razorpayOrderId,
    razorpayRefundId: o.razorpayRefundId,
    refundAmount: o.refundAmount,
    refundInitiatedAt: o.refundInitiatedAt,
    deliveryStatus: o.deliveryStatus || "processing",
    currentHub: o.currentHub || "Portland Primary Logistics Center",
    trackingNumber: o.trackingNumber || `TRK-${orderNumber.replace(/[^0-9]/g, "") || "984210"}`,
    cancellation: o.cancellation || { requested: false, status: "none" },
    events: Array.isArray(o.events) && o.events.length > 0 ? o.events : defaultEvents,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    awsEventBridgeDispatched: o.awsEventBridgeDispatched ?? true,
    cacheRevalidated: o.cacheRevalidated ?? true,
  };
}

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
          orders = mongoOrders.map(normalizeOrder);
        }
      } catch (err) {
        console.warn("MongoDB orders fetch notice:", err);
      }
    }

    // Fallback/Merge with memory store
    const storeOrders = store.getOrders().map(normalizeOrder);
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
    const { action, orderNumber } = body;

    let targetOrder: Order | undefined;

    // Search in store
    const storeOrder = store.getOrder(orderNumber) || store.getOrders().find((o) => o.orderNumber === orderNumber);
    if (storeOrder) {
      targetOrder = normalizeOrder(storeOrder);
    }

    // Search in MongoDB if not found
    if (!targetOrder) {
      const db = await connectDB();
      if (db) {
        const found = await OrderModel.findOne({ orderNumber }).lean();
        if (found) {
          targetOrder = normalizeOrder(found);
        }
      }
    }

    if (!targetOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Action 1: Email generation / resend
    if (action === "get-email" || action === "resend-email") {
      const emailData = generateRazorpayOrderEmail(targetOrder);

      return NextResponse.json({
        success: true,
        message: `Custom Razorpay payment confirmation email generated for ${targetOrder.customer.email}`,
        email: emailData,
      });
    }

    // Action 2: Customer requests cancellation
    if (action === "request-cancellation") {
      const { reason = "Customer requested cancellation", notes } = body;
      const cancelEvent: OrderEvent = {
        id: "ev-can-" + Math.random().toString(36).substring(2, 9),
        title: "Cancellation Requested",
        description: `Customer submitted cancellation request: "${reason}". ${notes ? `Note: ${notes}` : ""}`,
        timestamp: new Date().toISOString(),
        type: "cancellation",
        actor: "Customer",
      };

      const cancellationData: OrderCancellation = {
        requested: true,
        requestedAt: new Date().toISOString(),
        reason,
        status: "requested",
        adminNotes: notes || "",
      };

      const updatedEvents = [...(targetOrder.events || []), cancelEvent];
      const updates: Partial<Order> = {
        cancellation: cancellationData,
        events: updatedEvents,
      };

      store.updateOrder(targetOrder.orderNumber, updates);
      const db = await connectDB();
      if (db) {
        try {
          await OrderModel.findOneAndUpdate({ orderNumber: targetOrder.orderNumber }, updates);
        } catch (dbErr) {
          console.warn("MongoDB cancellation update notice:", dbErr);
        }
      }

      const updated = store.getOrder(targetOrder.orderNumber) || { ...targetOrder, ...updates };
      return NextResponse.json({
        success: true,
        message: "Cancellation request received. Pending admin review.",
        order: updated,
      });
    }

    // Action 3: Admin reviews cancellation (approve or reject)
    if (action === "review-cancellation") {
      const { decision, adminNotes, reviewedBy = "Admin" } = body; // "approved" | "rejected"
      const isApproved = decision === "approved";

      const reviewEvent: OrderEvent = {
        id: "ev-rev-" + Math.random().toString(36).substring(2, 9),
        title: isApproved ? "Cancellation Approved by Admin" : "Cancellation Request Declined",
        description: isApproved
          ? `Admin verified and approved cancellation. Order marked as Cancelled. Ready for Razorpay refund release.`
          : `Admin reviewed and declined cancellation request. Note: ${adminNotes || "Order has already been dispatched."}`,
        timestamp: new Date().toISOString(),
        type: "cancellation",
        actor: reviewedBy,
      };

      const cancellationData: OrderCancellation = {
        ...(targetOrder.cancellation || { requested: true }),
        status: isApproved ? "approved" : "rejected",
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        adminNotes: adminNotes || (isApproved ? "Approved by Admin" : "Declined by Admin"),
      };

      const updatedEvents = [...(targetOrder.events || []), reviewEvent];
      const updates: Partial<Order> = {
        cancellation: cancellationData,
        deliveryStatus: isApproved ? "cancelled" : (targetOrder.deliveryStatus || "processing"),
        events: updatedEvents,
      };

      store.updateOrder(targetOrder.orderNumber, updates);
      const db = await connectDB();
      if (db) {
        try {
          await OrderModel.findOneAndUpdate({ orderNumber: targetOrder.orderNumber }, updates);
        } catch (dbErr) {
          console.warn("MongoDB review update notice:", dbErr);
        }
      }

      const updated = store.getOrder(targetOrder.orderNumber) || { ...targetOrder, ...updates };
      return NextResponse.json({
        success: true,
        message: isApproved
          ? "Cancellation approved. Trigger Razorpay Refund button is now active."
          : "Cancellation request declined.",
        order: updated,
      });
    }

    // Action 4: Update delivery status & logistics hub
    if (action === "update-delivery") {
      const { deliveryStatus, currentHub, trackingNumber, note, actor = "Admin Logistics" } = body;

      const deliveryEvent: OrderEvent = {
        id: "ev-dlv-" + Math.random().toString(36).substring(2, 9),
        title: `Delivery: ${String(deliveryStatus || "").toUpperCase().replace(/_/g, " ")}`,
        description: note || `Location: ${currentHub || targetOrder.currentHub || "Fulfillment Center"}. Tracking: ${trackingNumber || targetOrder.trackingNumber || "Active"}`,
        timestamp: new Date().toISOString(),
        type: "delivery",
        actor,
      };

      const updatedEvents = [...(targetOrder.events || []), deliveryEvent];
      const updates: Partial<Order> = {
        deliveryStatus: deliveryStatus || targetOrder.deliveryStatus,
        currentHub: currentHub !== undefined ? currentHub : targetOrder.currentHub,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : targetOrder.trackingNumber,
        events: updatedEvents,
      };

      store.updateOrder(targetOrder.orderNumber, updates);
      const db = await connectDB();
      if (db) {
        try {
          await OrderModel.findOneAndUpdate({ orderNumber: targetOrder.orderNumber }, updates);
        } catch (dbErr) {
          console.warn("MongoDB delivery update notice:", dbErr);
        }
      }

      const updated = store.getOrder(targetOrder.orderNumber) || { ...targetOrder, ...updates };
      return NextResponse.json({
        success: true,
        message: "Delivery status updated successfully.",
        order: updated,
      });
    }

    // Action 5: Add custom event / audit note
    if (action === "add-event") {
      const { title, description, type = "delivery", actor = "Admin" } = body;
      const newEvent: OrderEvent = {
        id: "ev-log-" + Math.random().toString(36).substring(2, 9),
        title: title || "Logistics Checkpoint Recorded",
        description: description || "Checkpoint recorded",
        timestamp: new Date().toISOString(),
        type,
        actor,
      };

      const updatedEvents = [...(targetOrder.events || []), newEvent];
      const updates: Partial<Order> = { events: updatedEvents };

      store.updateOrder(targetOrder.orderNumber, updates);
      const db = await connectDB();
      if (db) {
        try {
          await OrderModel.findOneAndUpdate({ orderNumber: targetOrder.orderNumber }, updates);
        } catch (dbErr) {
          console.warn("MongoDB add event notice:", dbErr);
        }
      }

      const updated = store.getOrder(targetOrder.orderNumber) || { ...targetOrder, ...updates };
      return NextResponse.json({
        success: true,
        message: "Event logged successfully.",
        order: updated,
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
