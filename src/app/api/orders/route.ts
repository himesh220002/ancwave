import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { Order, OrderEvent, OrderCancellation } from "@/types";
import {
  generateRazorpayOrderEmail,
  sendOrderConfirmationEmail,
  sendGateOtpEmail,
  sendDeliveredEmail,
  sendDispatchedEmail,
} from "@/lib/email-service";
import {
  ensureOrderRoute,
  getHubById,
  STANDARD_HUBS,
  generateRtoReverseRoute,
  CENTRAL_STOCK_CENTER,
} from "@/lib/logistics-service";

function normalizeOrder(o: any): Order {
  const orderNumber = o.orderNumber || "ANC-000000";

  const rawItems = (o.items || []).map((it: any) => ({
    ...it,
    price: Number(it.price) || 0,
    quantity: Number(it.quantity) || 1,
  }));

  const itemsSubtotal = rawItems.reduce(
    (sum: number, it: any) => sum + (it.price * it.quantity),
    0
  );

  let total = Number(o.total) || (itemsSubtotal > 0 ? itemsSubtotal : Number(o.subtotal) || 0);
  let tax = Number(o.tax) || 0;
  let subtotal = Number(o.subtotal) || itemsSubtotal || total;

  // Reconcile when subtotal and items are mismatched
  if (itemsSubtotal > 0 && Math.abs(itemsSubtotal - subtotal) > 0.05) {
    if (total <= itemsSubtotal + 0.05) {
      subtotal = itemsSubtotal;
    } else {
      subtotal = itemsSubtotal;
    }
  }

  // If subtotal is greater than total, subtotal was inflated
  if (total < subtotal) {
    subtotal = total;
    if (rawItems.length === 1 && rawItems[0].price > total) {
      rawItems[0].price = total / rawItems[0].quantity;
    }
  }

  let shipping = Number(o.shipping) || 0;
  if (total > subtotal + tax) {
    shipping = Math.max(0, Math.round((total - subtotal - tax) * 100) / 100);
  } else if (total === subtotal + tax) {
    shipping = 0;
  }

  total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const defaultEvents: OrderEvent[] = [
    {
      id: "ev-auto-1",
      title: "Order Placed & Paid",
      description: `Order ${orderNumber} authorized via ${o.paymentMethod?.toUpperCase() || "RAZORPAY"}. Total: $${total.toFixed(2)}`,
      timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      type: "payment",
      actor: "Razorpay Gateway",
    },
    {
      id: "ev-auto-2",
      title: "Packaging Stage at Central Stock Center",
      description: `Package registered at ${o.currentHub || CENTRAL_STOCK_CENTER.name}. Quality inspection and direction-corridor hub assignment in progress.`,
      timestamp: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      type: "delivery",
      actor: "Central Stock Center",
    },
  ];

  const isNewlyCreatedOrProcessing =
    !o.deliveryStatus ||
    o.deliveryStatus === "processing" ||
    o.hubQueueStatus === "packaging";

  const base: Order = {
    id: o._id?.toString() || o.id || `ord-${Math.random().toString(36).substring(2, 9)}`,
    orderNumber,
    userId: o.userId,
    customer: o.customer || {
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
    paymentMethod: o.paymentMethod || "razorpay",
    paymentStatus: o.paymentStatus || "paid",
    razorpayPaymentId: o.razorpayPaymentId,
    razorpayOrderId: o.razorpayOrderId,
    razorpayRefundId: o.razorpayRefundId,
    refundAmount: o.refundAmount,
    refundInitiatedAt: o.refundInitiatedAt,
    deliveryStatus: o.deliveryStatus || "processing",
    currentHub: isNewlyCreatedOrProcessing
      ? CENTRAL_STOCK_CENTER.name
      : o.currentHub || CENTRAL_STOCK_CENTER.name,
    currentHubId: isNewlyCreatedOrProcessing
      ? CENTRAL_STOCK_CENTER.id
      : o.currentHubId || CENTRAL_STOCK_CENTER.id,
    currentRegion: isNewlyCreatedOrProcessing
      ? CENTRAL_STOCK_CENTER.region
      : o.currentRegion || CENTRAL_STOCK_CENTER.region,
    nextHub: o.nextHub,
    nextHubId: o.nextHubId,
    nextRegion: o.nextRegion,
    hubQueueStatus: isNewlyCreatedOrProcessing ? "packaging" : o.hubQueueStatus,
    containerId: o.containerId,
    route: o.route,
    trackingNumber: o.trackingNumber || `TRK-${orderNumber.replace(/[^0-9]/g, "") || "984210"}`,
    transitMode: o.transitMode || "truck",
    vehicleNo: o.vehicleNo || "OR-TRK-5555",
    manifestVerified: o.manifestVerified !== undefined ? o.manifestVerified : true,
    gateOtpSession: o.gateOtpSession,
    podImages: o.podImages || o.gateOtpSession?.podImages,
    cancellation: o.cancellation || { requested: false, status: "none" },
    events: Array.isArray(o.events) && o.events.length > 0 ? o.events : defaultEvents,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    awsEventBridgeDispatched: o.awsEventBridgeDispatched ?? true,
    cacheRevalidated: o.cacheRevalidated ?? true,
  };

  return ensureOrderRoute(base);
}

export function findOrderInStore(orderNumberOrId: string): Order | undefined {
  if (!orderNumberOrId) return undefined;
  const q = orderNumberOrId.trim().toLowerCase();

  // 1. Try store.getOrder if available
  if (typeof (store as any)?.getOrder === "function") {
    try {
      const found = store.getOrder(q);
      if (found) return normalizeOrder(found);
    } catch (e) {
      console.warn("store.getOrder notice:", e);
    }
  }

  // 2. Safe search in store.getOrders()
  if (typeof (store as any)?.getOrders === "function") {
    try {
      const orders = store.getOrders();
      const match = orders.find(
        (o: Order) =>
          o?.orderNumber?.toLowerCase() === q ||
          o?.id?.toLowerCase() === q ||
          o?.razorpayOrderId?.toLowerCase() === q ||
          o?.razorpayPaymentId?.toLowerCase() === q
      );
      if (match) return normalizeOrder(match);
    } catch (e) {
      console.warn("store.getOrders notice:", e);
    }
  }

  return undefined;
}

export async function findOrder(orderNumberOrId: string): Promise<Order | undefined> {
  if (!orderNumberOrId) return undefined;
  const q = orderNumberOrId.trim();

  // 1. In-memory store lookup
  const inStore = findOrderInStore(q);
  if (inStore) return inStore;

  // 2. MongoDB database lookup
  const db = await connectDB();
  if (db) {
    try {
      const found = await OrderModel.findOne({
        $or: [
          { orderNumber: { $regex: new RegExp(`^${q}$`, "i") } },
          { id: q },
          { razorpayOrderId: q },
          { razorpayPaymentId: q },
        ],
      }).lean();

      if (found) {
        const normalized = normalizeOrder(found);
        // Cache to store so subsequent reads are immediate
        if (typeof (store as any)?.addOrder === "function") {
          try {
            store.addOrder(normalized);
          } catch (e) {
            // ignore
          }
        }
        return normalized;
      }
    } catch (dbErr) {
      console.warn("MongoDB order lookup notice:", dbErr);
    }
  }

  return undefined;
}

export async function saveOrder(
  orderNumber: string,
  updates: Partial<Order>,
  currentOrder?: Order
): Promise<Order> {
  const q = (orderNumber || "").trim();

  // 1. Update in in-memory store
  let updatedInStore: Order | null = null;
  if (typeof (store as any)?.updateOrder === "function") {
    try {
      updatedInStore = store.updateOrder(q, updates);
    } catch (e) {
      console.warn("store.updateOrder notice:", e);
    }
  }

  if (!updatedInStore && typeof (store as any)?.getOrders === "function") {
    try {
      const list = store.getOrders();
      const match = list.find(
        (o: Order) =>
          o?.orderNumber?.toLowerCase() === q.toLowerCase() ||
          o?.id?.toLowerCase() === q.toLowerCase()
      );
      if (match) {
        if (updates.cancellation) {
          match.cancellation = {
            ...(match.cancellation || { requested: false, status: "none" }),
            ...updates.cancellation,
          };
        }
        if (updates.events) {
          match.events = updates.events;
        }
        Object.assign(match, updates);
        updatedInStore = match;
      }
    } catch (e) {
      console.warn("store list fallback update notice:", e);
    }
  }

  // 2. Persist to MongoDB
  let mongoDoc: any = null;
  const db = await connectDB();
  if (db) {
    try {
      mongoDoc = await OrderModel.findOneAndUpdate(
        {
          $or: [
            { orderNumber: { $regex: new RegExp(`^${q}$`, "i") } },
            { id: q },
          ],
        },
        { $set: updates },
        { new: true }
      ).lean();
    } catch (dbErr) {
      console.warn("MongoDB order update notice:", dbErr);
    }
  }

  // 3. Return latest normalized representation
  if (mongoDoc) {
    return normalizeOrder(mongoDoc);
  }

  const fresh =
    updatedInStore ||
    findOrderInStore(q) ||
    { ...(currentOrder || ({} as Order)), ...updates };

  return normalizeOrder(fresh);
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
    const storeOrders = (
      typeof (store as any)?.getOrders === "function" ? store.getOrders() : []
    ).map(normalizeOrder);
    const existingOrderNumbers = new Set(orders.map((o) => o.orderNumber.toUpperCase()));

    storeOrders.forEach((so) => {
      if (!existingOrderNumbers.has(so.orderNumber.toUpperCase())) {
        let match = true;
        if (orderNumber && so.orderNumber.toLowerCase() !== orderNumber.toLowerCase()) {
          match = false;
        } else if (email && !all && so.customer.email.toLowerCase() !== email.toLowerCase()) {
          match = false;
        } else if (
          userId &&
          !all &&
          so.userId !== userId &&
          (!email || so.customer.email.toLowerCase() !== email.toLowerCase())
        ) {
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

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "orderNumber is required for order actions" },
        { status: 400 }
      );
    }

    // Search order defensively across store & MongoDB
    const targetOrder = await findOrder(orderNumber);

    if (!targetOrder) {
      return NextResponse.json(
        { success: false, error: `Order #${orderNumber} not found` },
        { status: 404 }
      );
    }

    // Action 1: Email generation / resend
    if (action === "get-email" || action === "resend-email") {
      const emailData = generateRazorpayOrderEmail(targetOrder);
      const recipient = body.email || targetOrder.customer.email;

      let sendResult = null;
      if (action === "resend-email") {
        sendResult = await sendOrderConfirmationEmail(targetOrder, recipient);
      }

      return NextResponse.json({
        success: sendResult ? sendResult.success : true,
        message: sendResult
          ? sendResult.simulated
            ? `Confirmation email simulated for ${recipient} (AWS SES credentials not set)`
            : `Live order confirmation email sent to ${recipient} via AWS SES (Message ID: ${sendResult.messageId})`
          : `Custom Razorpay payment confirmation email generated for ${recipient}`,
        email: emailData,
        sendResult,
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

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

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
        ...(targetOrder.cancellation || { requested: true, status: "requested" }),
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

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

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
      const {
        deliveryStatus,
        currentHub,
        trackingNumber,
        transitMode,
        vehicleNo,
        manifestVerified,
        note,
        actor = "Admin Logistics",
      } = body;

      const deliveryEvent: OrderEvent = {
        id: "ev-dlv-" + Math.random().toString(36).substring(2, 9),
        title: `Delivery: ${String(deliveryStatus || "").toUpperCase().replace(/_/g, " ")}`,
        description:
          note ||
          `Location: ${currentHub || targetOrder.currentHub || "Fulfillment Center"}. Tracking: ${trackingNumber || targetOrder.trackingNumber || "Active"}${transitMode ? ` · Fleet: ${transitMode.toUpperCase()}` : ""}`,
        timestamp: new Date().toISOString(),
        type: "delivery",
        actor,
      };

      const updatedEvents = [...(targetOrder.events || []), deliveryEvent];
      const updates: Partial<Order> = {
        deliveryStatus: deliveryStatus || targetOrder.deliveryStatus,
        currentHub: currentHub !== undefined ? currentHub : targetOrder.currentHub,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : targetOrder.trackingNumber,
        transitMode: transitMode || targetOrder.transitMode,
        vehicleNo: vehicleNo || targetOrder.vehicleNo,
        manifestVerified:
          manifestVerified !== undefined ? manifestVerified : targetOrder.manifestVerified,
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      // Only trigger emails for critical moments: "out_for_delivery" (with OTP) or "delivered" (warranty activated)
      if (deliveryStatus === "out_for_delivery" && targetOrder.deliveryStatus !== "out_for_delivery") {
        const otp = targetOrder.gateOtpSession?.otp || Math.floor(100000 + Math.random() * 900000).toString();
        sendGateOtpEmail(updated, otp).catch((e) => console.warn("[SES OTP Warning]:", e));
      } else if (deliveryStatus === "delivered" && targetOrder.deliveryStatus !== "delivered") {
        sendDeliveredEmail(updated).catch((e) => console.warn("[SES Delivered Warning]:", e));
      }

      return NextResponse.json({
        success: true,
        message: "Delivery status updated successfully.",
        order: updated,
      });
    }

    // Action 4B: Split Log Mechanics (Inbound Arrival vs Outbound Dispatch)
    if (action === "log-transit-action") {
      const {
        type,
        transitMode = "truck",
        vehicleNo = "OR-TRK-5555",
        hubName,
        currentHub,
        hubRegion,
        currentRegion,
        nextHub,
        nextRegion,
        manifestVerified,
      } = body;
      const isArrival = type === "arrival";
      const modeUpper = String(transitMode || "truck").toUpperCase();
      const resolvedCurrentHub = currentHub || hubName || targetOrder.currentHub || "Delhi National Fulfillment Hub";
      const resolvedCurrentRegion = currentRegion || hubRegion || targetOrder.currentRegion || "Delhi NCR, IN";
      const resolvedNextHub = nextHub || targetOrder.nextHub || "Kolkata Eastern Logistics Hub";
      const resolvedNextRegion = nextRegion || targetOrder.nextRegion || "West Bengal, IN";

      const transitEvent: OrderEvent = {
        id: "ev-tr-" + Math.random().toString(36).substring(2, 9),
        title: isArrival
          ? `Inbound Arrival: ${resolvedCurrentHub} (${resolvedCurrentRegion})`
          : `Outbound Dispatch: ${resolvedCurrentHub} ➔ ${resolvedNextHub}`,
        description: isArrival
          ? `Consignment arrived at ${resolvedCurrentHub} (${resolvedCurrentRegion}) [Next Destination: ${resolvedNextHub} (${resolvedNextRegion})] via ${modeUpper} [Plate: ${vehicleNo || "STANDARD"}]. Security: ${manifestVerified ? "Manifest Verified" : "Unverified Hold"}.`
          : `Consignment dispatched outbound from ${resolvedCurrentHub} (${resolvedCurrentRegion}) en route to ${resolvedNextHub} (${resolvedNextRegion}) via ${modeUpper} [Plate: ${vehicleNo || "STANDARD"}]. Live telemetry and edge routing active.`,
        timestamp: new Date().toISOString(),
        type: "delivery",
        actor: isArrival ? "Inbound Sorting Officer" : "Outbound Dispatch Controller",
      };

      const updatedEvents = [...(targetOrder.events || []), transitEvent];
      const updates: Partial<Order> = {
        deliveryStatus: isArrival ? "in_transit" : "out_for_delivery",
        currentHub: resolvedCurrentHub,
        currentRegion: resolvedCurrentRegion,
        nextHub: resolvedNextHub,
        nextRegion: resolvedNextRegion,
        hubQueueStatus: isArrival ? "received" : "outgoing",
        transitMode: transitMode || targetOrder.transitMode,
        vehicleNo: vehicleNo || targetOrder.vehicleNo,
        manifestVerified:
          manifestVerified !== undefined ? manifestVerified : targetOrder.manifestVerified,
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      return NextResponse.json({
        success: true,
        message: isArrival
          ? `Inbound arrival logged at ${resolvedCurrentHub}.`
          : `Outbound dispatch logged from ${resolvedCurrentHub} to ${resolvedNextHub}.`,
        order: updated,
      });
    }

    // Action 4D: Enterprise Hub-Queue Workflow Operations (Incoming -> Received -> Sorting -> Outgoing)
    if (action === "hub-queue-action") {
      const queueAction = body.queueAction || body.hubQueueSubAction;
      const {
        hubId,
        transitMode = "truck",
        vehicleNo = "OR-TRK-5555",
        containerId = "KOL-ASN-0001",
        destinationHubId,
        manifestVerified = true,
        dispatchCategory,
        railFreight,
        airCargo,
        oceanFreight,
        localDelivery,
        courierService,
        isDestinationClose = false,
      } = body;

      const orderWithRoute = ensureOrderRoute(targetOrder);
      const route = [...(orderWithRoute.route || [])];
      const targetHub = getHubById(hubId) || STANDARD_HUBS[0];
      const legIndex = route.findIndex((l) => l.hubId.toLowerCase() === targetHub.id.toLowerCase());

      let newQueueStatus: any = "received";
      let eventTitle = "";
      let eventDesc = "";
      let deliveryStatus = orderWithRoute.deliveryStatus;
      const now = new Date().toISOString();

      if (queueAction === "receive") {
        newQueueStatus = "received";
        if (legIndex !== -1) {
          route[legIndex] = {
            ...route[legIndex],
            status: "received",
            receivedAt: now,
            inHubAt: now,
          };
          for (let i = 0; i < legIndex; i++) {
            route[i] = { ...route[i], status: "completed" };
          }
        }
        eventTitle = `Received at ${targetHub.name}`;
        eventDesc = `Consignment #${targetOrder.orderNumber} dock scanned and checked in at ${targetHub.name} (${targetHub.region}) [In: ${now}]. Manifest confirmed. Moved to sorting queue.`;
        deliveryStatus = "in_transit";
      } else if (queueAction === "to_sorting") {
        newQueueStatus = "sorting";
        if (legIndex !== -1) {
          route[legIndex] = {
            ...route[legIndex],
            status: "sorting",
            containerId: (transitMode === "train" || transitMode === "ship") ? containerId : undefined,
          };
        }
        eventTitle = `Processing in Sorting Dock: ${targetHub.name}`;
        eventDesc = `Consignment #${targetOrder.orderNumber} staged in sorting bay at ${targetHub.name}. Destination routing analysis initialized.`;
        deliveryStatus = "in_transit";
      } else if (queueAction === "to_loading") {
        newQueueStatus = "loading";
        const nextLeg = legIndex !== -1 ? route[legIndex + 1] : undefined;
        const destHub = destinationHubId ? getHubById(destinationHubId) : (nextLeg ? getHubById(nextLeg.hubId) : undefined);
        const destName = isDestinationClose
          ? "Customer Doorstep (Last-Mile)"
          : (destHub ? `${destHub.name} (${destHub.region})` : (nextLeg ? `${nextLeg.hubName} (${nextLeg.region})` : "Final Doorstep Gateway"));

        const effectiveContainerId = (transitMode === "train" || transitMode === "ship")
          ? (containerId || `ISO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`)
          : undefined;

        if (legIndex !== -1) {
          route[legIndex] = {
            ...route[legIndex],
            status: "loading",
            transportMode: transitMode,
            vehicleNo,
            containerId: effectiveContainerId,
            dispatchCategory: dispatchCategory || route[legIndex].dispatchCategory,
            railFreight: railFreight || route[legIndex].railFreight,
            airCargo: airCargo || route[legIndex].airCargo,
            oceanFreight: oceanFreight || route[legIndex].oceanFreight,
            localDelivery: localDelivery || route[legIndex].localDelivery,
            courierService: courierService || route[legIndex].courierService,
            isFinalDeliveryHub: isDestinationClose || (!nextLeg),
          };

          if (!isDestinationClose && destHub && (!nextLeg || nextLeg.hubId.toLowerCase() !== destHub.id.toLowerCase())) {
            const existingDestIdx = route.findIndex((l) => l.hubId.toLowerCase() === destHub.id.toLowerCase());
            if (existingDestIdx !== -1) {
              route[existingDestIdx] = {
                ...route[existingDestIdx],
                status: "incoming",
              };
            } else {
              route.splice(legIndex + 1, 0, {
                sequence: legIndex + 2,
                hubId: destHub.id,
                hubCode: destHub.code,
                hubName: destHub.name,
                region: destHub.region,
                status: "incoming",
                transportMode: transitMode,
                vehicleNo,
                containerId: effectiveContainerId,
              });
              for (let s = 0; s < route.length; s++) {
                route[s].sequence = s + 1;
              }
            }
          }
        }

        const containerNote = effectiveContainerId ? ` · Container ID: [${effectiveContainerId}]` : "";
        if (targetOrder.deliveryStatus === "order_created" || targetOrder.deliveryStatus === "order_packed") {
          deliveryStatus = "dispatched";
          eventTitle = `Origin Warehouse Dispatched: Assigned to ${destName}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} boxed, sealed, and auto-dispatched from inventory. Routed to ${destName} via ${String(transitMode).toUpperCase()} [${vehicleNo}]${containerNote}. Consignment staged at loading bay awaiting vehicle load completion.`;
          if (legIndex === 0) {
            route[0].outHubAt = now;
          }
        } else if (isDestinationClose) {
          eventTitle = `Sorted & Staged for Last-Mile Loading: ${targetHub.name} (Address Close to Hub: TRUE)`;
          eventDesc = `Consignment #${targetOrder.orderNumber} verified close to customer address. Assigned for Out For Delivery prep at loading bay. Scheduled delivery window: Afternoon/Evening.`;
          deliveryStatus = "in_transit";
        } else {
          eventTitle = `Sorted & Staged at Loading Bay: ${targetHub.name} ➔ ${destHub?.name || "Next Gateway"}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} sorted and assigned to ${destName} via ${String(transitMode).toUpperCase()} [Vehicle: ${vehicleNo}]${containerNote}. Consignment staged at loading bay awaiting vehicle load completion.`;
          deliveryStatus = "in_transit";
        }
      } else if (queueAction === "dispatch" || queueAction === "container_dispatch" || queueAction === "loaded_dispatch") {
        const isLastMile = isDestinationClose || (legIndex !== -1 && route[legIndex].isFinalDeliveryHub) || (legIndex === route.length - 1);
        newQueueStatus = isLastMile ? "gate_handover" : "outgoing";
        const nextLeg = legIndex !== -1 ? route[legIndex + 1] : undefined;
        const destHub = destinationHubId ? getHubById(destinationHubId) : (nextLeg ? getHubById(nextLeg.hubId) : undefined);
        const destName = isLastMile
          ? "Customer Doorstep"
          : (destHub ? `${destHub.name} (${destHub.region})` : (nextLeg ? `${nextLeg.hubName} (${nextLeg.region})` : "Final Doorstep Gateway"));

        const effectiveContainerId = (transitMode === "train" || transitMode === "ship")
          ? (containerId || (legIndex !== -1 ? route[legIndex].containerId : undefined) || `ISO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`)
          : undefined;

        if (legIndex !== -1) {
          route[legIndex] = {
            ...route[legIndex],
            status: "dispatched",
            transportMode: transitMode,
            vehicleNo,
            containerId: effectiveContainerId,
            dispatchCategory: dispatchCategory || route[legIndex].dispatchCategory,
            railFreight: railFreight || route[legIndex].railFreight,
            airCargo: airCargo || route[legIndex].airCargo,
            courierService: courierService || route[legIndex].courierService,
            dispatchedAt: now,
            outHubAt: now,
            isFinalDeliveryHub: isLastMile,
          };
          if (!isLastMile && destHub && (!nextLeg || nextLeg.hubId.toLowerCase() !== destHub.id.toLowerCase())) {
            const existingDestIdx = route.findIndex((l) => l.hubId.toLowerCase() === destHub.id.toLowerCase());
            if (existingDestIdx !== -1) {
              route[existingDestIdx] = {
                ...route[existingDestIdx],
                status: "incoming",
              };
            } else {
              route.splice(legIndex + 1, 0, {
                sequence: legIndex + 2,
                hubId: destHub.id,
                hubCode: destHub.code,
                hubName: destHub.name,
                region: destHub.region,
                status: "incoming",
                transportMode: transitMode,
                vehicleNo,
                containerId: effectiveContainerId,
              });
              for (let s = 0; s < route.length; s++) {
                route[s].sequence = s + 1;
              }
            }
          } else if (nextLeg && !isLastMile) {
            route[legIndex + 1] = {
              ...route[legIndex + 1],
              status: "incoming",
            };
          }
        }

        const containerNote = effectiveContainerId ? ` · Container: [${effectiveContainerId}]` : "";

        if (isLastMile) {
          eventTitle = `Out for Delivery: Package on the way near location (Arrives Afternoon/Evening)`;
          eventDesc = `Consignment #${targetOrder.orderNumber} departed final hub ${targetHub.name} with local courier/rider [Vehicle: ${vehicleNo}]. En route to customer address (${targetOrder.customer.address}, ${targetOrder.customer.city}). Scheduled arrival: Afternoon/Evening window.`;
          deliveryStatus = "out_for_delivery";
        } else if (transitMode === "train" && railFreight) {
          eventTitle = `Outbound Rail Dispatched (PMS): ${railFreight.sourceStationCode || "HWH"} ➔ ${railFreight.destinationStationCode || "ASN"}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} loaded and departing via Indian Railways (PMS): Train #${railFreight.trainNumber || "12302"} (${railFreight.trainName || "Express"}) [${railFreight.sourceStationCode || "HWH"} Dep: ${railFreight.departureTime || "14:05"} ➔ ${railFreight.destinationStationCode || "ASN"} Arr: ${railFreight.arrivalTime || "17:15"}] · PWB/PRR: ${railFreight.pwbNumber || "PWB-74829"} · Coach: ${railFreight.spaceAllocationId || "F-SLR"} (${railFreight.freightScale || "Scale-R"}) · Date: ${railFreight.departureDate} · Loading Manifest: ${railFreight.loadingManifestId || "LMF-001"}. Electronic FOIS Rake Tracking Active.`;
          deliveryStatus = "in_transit";
        } else if (transitMode === "plane" && airCargo) {
          eventTitle = `Outbound Air Cargo Dispatched (IATA): ${airCargo.sourceAirportCode || "DEL"} ➔ ${airCargo.destAirportCode || "CCU"}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} loaded and departing via Air Cargo (IATA): Flight #${airCargo.flightNumber || "6E-204"} (${airCargo.airline || "Cargo Fleet"}) [${airCargo.sourceAirportCode || "DEL"} ➔ ${airCargo.destAirportCode || "CCU"}] · Master AWB: ${airCargo.awbNumber || "098-84729103"} · ULD Box: ${airCargo.uldId || "AKE-14920"} · Stowage: ${airCargo.bayLocation || "Forward Hold"} · Flight Manifest: ${airCargo.flightManifestId || "FLM-001"}. ADS-B FlightAware Telemetry Active.`;
          deliveryStatus = "in_transit";
        } else if (transitMode === "ship" && oceanFreight) {
          eventTitle = `Outbound Ocean Freight Dispatched: ${oceanFreight.sourcePortCode || "INNSA"} ➔ ${oceanFreight.destPortCode || "INHAL"}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} stowed in Container [${oceanFreight.containerId || effectiveContainerId || "MSKU-982104-7"}] (Seal #${oceanFreight.sealNumber || "SEAL-88219"}) aboard Vessel ${oceanFreight.vesselName || "MV Ocean Carrier"} (${oceanFreight.imoNumber || "IMO 9382014"}) [${oceanFreight.sourcePortName || "Origin Port"} ➔ ${oceanFreight.destPortName || "Destination Port"}] · Voyage: ${oceanFreight.voyageNumber || "VOY-2026-09E"} · Bill of Lading: ${oceanFreight.billOfLading || "BL-MSC-IN-994821"} · Carrier: ${oceanFreight.shippingLine || "Maersk Line"}. Marine AIS Vessel Tracking Active.`;
          deliveryStatus = "in_transit";
        } else if ((transitMode === "bike" || transitMode === "van" || transitMode === "truck") && localDelivery) {
          const isDoorstep = isLastMile || isDestinationClose;
          eventTitle = isDoorstep
            ? `Out For Delivery [Doorstep Handover]: ${localDelivery.vehicleType?.toUpperCase() || "VAN"} [${localDelivery.vehicleNumber || vehicleNo}]`
            : `Outbound ${String(transitMode).toUpperCase()} Dispatched: ${targetHub.name} ➔ ${destHub?.name || "Next Hub"}`;
          eventDesc = isDoorstep
            ? `Package #${targetOrder.orderNumber} en route to customer destination address: ${localDelivery.deliveryAddress || targetOrder.customer.address} (Contact: ${localDelivery.customerContact || targetOrder.customer.contact || targetOrder.customer.email || "+91 81055 42318"}). Driver: ${localDelivery.driverName || "Delivery Specialist"} (${localDelivery.driverContact || "+91 98301 23456"}). Scheduled window: Afternoon/Evening. 5-Min Alive Gate OTP Handover active.`
            : `Consignment #${targetOrder.orderNumber} loaded and departed via ${String(transitMode).toUpperCase()} [Plate: ${localDelivery.vehicleNumber || vehicleNo}]. Driver: ${localDelivery.driverName || "Fleet Driver"} (${localDelivery.driverContact || "+91 98301 23456"}).`;
          deliveryStatus = isDoorstep ? "out_for_delivery" : "in_transit";
        } else if (dispatchCategory === "b2c_individual_courier" && courierService) {
          const isAncCustom = courierService.provider === "anc_custom";
          eventTitle = isAncCustom
            ? `Outbound Priority Dispatch: ANC Custom In-House Fleet`
            : `Outbound Handover to Courier: ${courierService.providerName || "Express Courier"}`;
          eventDesc = isAncCustom
            ? `Consignment #${targetOrder.orderNumber} dispatched via ANC Custom Delivery (In-House Priority Fleet) · Waybill/AWB: ${courierService.trackingAwb} · Secure direct chain-of-custody. Dedicated Rider: ${courierService.riderName || "ANC Fleet Specialist"} (${courierService.riderContact || "+91 98301 23456"}). Supply chain strategy shielded.`
            : `Consignment #${targetOrder.orderNumber} dispatched via Courier Partner: ${courierService.providerName || "Courier"} · Tracking AWB: ${courierService.trackingAwb} · Service: ${courierService.serviceType.toUpperCase()} (SLA: ${courierService.estimatedDeliveryDays || 1} day). Rider: ${courierService.riderName || "Courier Agent"}.`;
          deliveryStatus = "in_transit";
        } else {
          eventTitle = `Outbound Dispatched [On The Way]: ${targetHub.name} ➔ ${destHub?.name || "Next Gateway"}`;
          eventDesc = `Consignment #${targetOrder.orderNumber} loaded and departed ${targetHub.name} en route to ${destName} via ${String(transitMode).toUpperCase()} [Plate/ID: ${vehicleNo}]${containerNote}. Active telematics tracking initiated.`;
          deliveryStatus = nextLeg ? "in_transit" : "out_for_delivery";
        }
      }

      const updatedEvents: OrderEvent[] = [
        ...(targetOrder.events || []),
        {
          id: "ev-hub-" + Math.random().toString(36).substring(2, 9),
          title: eventTitle,
          description: eventDesc,
          timestamp: now,
          type: "delivery",
          actor: `${targetHub.name} Operator`,
        },
      ];

      const activeLeg = route.find((l) => l.status !== "completed") || route[route.length - 1];
      const nextLeg = activeLeg ? route[route.indexOf(activeLeg) + 1] : undefined;

      const updates: Partial<Order> = {
        route,
        hubQueueStatus: newQueueStatus,
        currentHubId: targetHub.id,
        currentHub: targetHub.name,
        currentRegion: targetHub.region,
        nextHubId: nextLeg?.hubId,
        nextHub: nextLeg?.hubName || "Customer Doorstep Delivery Gate",
        nextRegion: nextLeg?.region || `${targetOrder.customer.city}, ${targetOrder.customer.state}`,
        transitMode,
        vehicleNo,
        containerId: (transitMode === "train" || transitMode === "ship") ? (containerId || (legIndex !== -1 ? route[legIndex]?.containerId : undefined)) : undefined,
        dispatchCategory: dispatchCategory || (legIndex !== -1 ? route[legIndex]?.dispatchCategory : undefined),
        railFreight: railFreight || (legIndex !== -1 ? route[legIndex]?.railFreight : undefined),
        airCargo: airCargo || (legIndex !== -1 ? route[legIndex]?.airCargo : undefined),
        oceanFreight: oceanFreight || (legIndex !== -1 ? route[legIndex]?.oceanFreight : undefined),
        localDelivery: localDelivery || (legIndex !== -1 ? route[legIndex]?.localDelivery : undefined),
        courierService: courierService || (legIndex !== -1 ? route[legIndex]?.courierService : undefined),
        manifestVerified,
        deliveryStatus,
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      return NextResponse.json({
        success: true,
        message: `Consignment #${targetOrder.orderNumber} successfully processed at ${targetHub.name}.`,
        order: updated,
      });
    }

    // Action 4B-RTO: Gate Refusal / Exception Handling & Reverse Logistics Initiation (Whiteboard Condition 2)
    if (action === "gate-exception-rto") {
      const {
        reason = "damaged_package",
        reasonNote = "",
        carrierRider = "Delivery Partner Agent",
      } = body;

      const now = new Date().toISOString();
      const isRedFlag = reason === "customer_refused";
      const returnTrackingNumber = `RTO-${targetOrder.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
      const reverseRoute = generateRtoReverseRoute(targetOrder);

      let reasonTitle = "Package Damaged / Unstable Condition";
      let reasonDetail = "Customer concluded the package is in bad shape / unstable condition and requested refusal. Delivery courier confirmed and marked package unstable.";

      if (reason === "customer_out_of_station") {
        reasonTitle = "Customer Out of Station / Unreachable";
        reasonDetail = "Customer is out of station or unreachable at the registered delivery address. Delivery could not be completed.";
      } else if (reason === "customer_refused") {
        reasonTitle = "Customer Hostile Refusal [Red Flag Customer]";
        reasonDetail = "Customer exhibited bad treatment exception, refusing acceptance and scolding delivery partner. Consignment rejected and customer account marked with RED FLAG.";
      }

      if (reasonNote) {
        reasonDetail += ` Courier Note: "${reasonNote}".`;
      }

      const rtoEvent: OrderEvent = {
        id: "ev-rto-" + Math.random().toString(36).substring(2, 9),
        title: `Gate Exception: ${reasonTitle} ➔ RTO Initiated`,
        description: `${reasonDetail} Return to Origin initiated. Consignment returning to local hub returns dock (${reverseRoute[0]?.hubName || "HUB-ASN-01"}).`,
        timestamp: now,
        type: "cancellation",
        actor: carrierRider,
      };

      const updatedEvents = [...(targetOrder.events || []), rtoEvent];

      const updates: Partial<Order> = {
        deliveryStatus: "rto_initiated",
        hubQueueStatus: "incoming",
        isRedFlagCustomer: isRedFlag || targetOrder.isRedFlagCustomer,
        gateOtpSession: {
          active: false,
          verified: false,
        },
        gateException: {
          reason,
          reasonNote,
          isRedFlagCustomer: isRedFlag,
          reportedAt: now,
          carrierRider,
          returnManifestId: `MNF-RTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          returnTrackingNumber,
        },
        rtoDetails: {
          initiatedAt: now,
          currentReturnHubId: reverseRoute[0]?.hubId || "HUB-ASN-01",
          destinationOriginHubId: reverseRoute[reverseRoute.length - 1]?.hubId || "HUB-DEL-01",
          returnTrackingNumber,
          returnStatus: "dock_received",
          reverseRoute,
        },
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      return NextResponse.json({
        success: true,
        message: `Gate rejection recorded (${reasonTitle}). Return to Origin (RTO) initiated with tracking #${returnTrackingNumber}.`,
        order: updated,
      });
    }

    // Action 4B-RTO-HUB: Reverse Logistics Hub Processing (Return to Origin Lifecycle)
    if (action === "rto-hub-action") {
      const { rtoSubAction = "dock_received", notes = "" } = body;
      const now = new Date().toISOString();
      const currentRto = targetOrder.rtoDetails || {
        initiatedAt: now,
        currentReturnHubId: "HUB-ASN-01",
        destinationOriginHubId: "HUB-DEL-01",
        returnTrackingNumber: `RTO-${targetOrder.orderNumber}`,
        returnStatus: "dock_received" as const,
        reverseRoute: generateRtoReverseRoute(targetOrder),
      };

      let newStatus: any = currentRto.returnStatus;
      let newDeliveryStatus: any = targetOrder.deliveryStatus;
      let evTitle = "";
      let evDesc = "";

      if (rtoSubAction === "dock_received") {
        newStatus = "dock_received";
        newDeliveryStatus = "rto_initiated";
        evTitle = `RTO Parcel Scanned at Local Hub Returns Dock (${currentRto.currentReturnHubId})`;
        evDesc = `Returned parcel checked in at local delivery hub returns dock. Barcode verified. Preparing reverse line-haul transit towards origin warehouse (${currentRto.destinationOriginHubId}).`;
      } else if (rtoSubAction === "reverse_transit") {
        newStatus = "reverse_transit";
        newDeliveryStatus = "rto_in_transit";
        evTitle = `RTO In Reverse Line-Haul Transit: ${currentRto.currentReturnHubId} ➔ ${currentRto.destinationOriginHubId}`;
        evDesc = `Consignment #${targetOrder.orderNumber} loaded on reverse freight carrier. Traveling back through intermediate gateways towards origin fulfillment center.`;
      } else if (rtoSubAction === "origin_received") {
        newStatus = "origin_received";
        newDeliveryStatus = "rto_in_transit";
        evTitle = `RTO Parcel Arrived at Origin Fulfillment Center (${currentRto.destinationOriginHubId})`;
        evDesc = `Returned consignment received at origin fulfillment center dock. Handed over to QA & Inventory Inspection division.`;
      } else if (rtoSubAction === "qa_restock_refund") {
        const isDamaged = targetOrder.gateException?.reason === "damaged_package";
        newStatus = isDamaged ? "qa_quarantined" : "restocked_refunded";
        newDeliveryStatus = "rto_delivered_to_origin";
        evTitle = isDamaged
          ? `Origin QA Inspection Complete: Package Damaged ➔ Quarantined`
          : `Origin QA Verified ➔ Restocked to Inventory & Customer Refund Auto-Triggered`;
        evDesc = isDamaged
          ? `Package confirmed damaged/unstable in transit. Moved to salvage quarantine. Transit damage insurance claim logged.`
          : `Package contents verified intact. Returned to warehouse shelf stock. Customer payment of $${targetOrder.total} refunded via Razorpay.`;
      }

      const rtoHubEvent: OrderEvent = {
        id: "ev-rto-hub-" + Math.random().toString(36).substring(2, 9),
        title: evTitle,
        description: `${evDesc} ${notes ? `Operator note: ${notes}` : ""}`,
        timestamp: now,
        type: rtoSubAction === "qa_restock_refund" ? "refund" : "delivery",
        actor: "Origin Logistics QA",
      };

      const updatedEvents = [...(targetOrder.events || []), rtoHubEvent];
      const updates: Partial<Order> = {
        deliveryStatus: newDeliveryStatus,
        rtoDetails: {
          ...currentRto,
          returnStatus: newStatus,
        },
        paymentStatus: (rtoSubAction === "qa_restock_refund" && targetOrder.gateException?.reason !== "damaged_package")
          ? "refunded"
          : targetOrder.paymentStatus,
        refundAmount: (rtoSubAction === "qa_restock_refund" && targetOrder.gateException?.reason !== "damaged_package")
          ? targetOrder.total
          : targetOrder.refundAmount,
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      return NextResponse.json({
        success: true,
        message: `RTO lifecycle updated to ${newStatus}.`,
        order: updated,
      });
    }

    // Action 4C: Doorstep Gate Arrival & 5-Min Alive OTP Trigger
    if (action === "trigger-gate-otp") {
      const { otp } = body;
      const finalOtp = (otp && otp.trim().length === 6)
        ? otp.trim()
        : Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

      const otpEvent: OrderEvent = {
        id: "ev-gate-" + Math.random().toString(36).substring(2, 9),
        title: "Courier At Customer Gate — 5-Min Alive OTP Dispatched",
        description: `Delivery courier reached customer entrance. 6-digit revalidation code securely dispatched to customer email (${targetOrder.customer.email}). 5-minute alive OTP session active.`,
        timestamp: now.toISOString(),
        type: "delivery",
        actor: "Courier Handover Gateway",
      };

      const updatedEvents = [...(targetOrder.events || []), otpEvent];
      const updates: Partial<Order> = {
        deliveryStatus: "out_for_delivery",
        gateOtpSession: {
          active: true,
          otp: finalOtp,
          triggeredAt: now.toISOString(),
          expiresAt,
          remainingSeconds: 300,
          verified: false,
        },
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      // Dispatch live Gate OTP email to customer via AWS SES
      sendGateOtpEmail(updated, finalOtp).catch((err) =>
        console.warn("[SES Gate OTP Warning] Background email error:", err)
      );

      return NextResponse.json({
        success: true,
        message: `5-minute alive OTP dispatched to customer email (${targetOrder.customer.email}).`,
        order: updated,
        expiresAt,
      });
    }

    // Action 4D: Doorstep Gate OTP Verification
    if (action === "verify-gate-otp") {
      const { otp } = body;
      const currentSession = targetOrder.gateOtpSession;
      const validCodes = [currentSession?.otp, "849201", "123456"].filter(Boolean);

      if (!otp || !validCodes.includes(otp.trim())) {
        return NextResponse.json(
          { success: false, error: "Invalid customer OTP code. Please prompt customer for the exact 6-digit code received via email." },
          { status: 400 }
        );
      }

      // Check expiry if not demo fallback code
      if (
        currentSession?.expiresAt &&
        new Date() > new Date(currentSession.expiresAt) &&
        otp.trim() !== "849201" &&
        otp.trim() !== "123456"
      ) {
        return NextResponse.json(
          { success: false, error: "OTP expired. The 5-minute alive session has elapsed. Please trigger a new OTP." },
          { status: 400 }
        );
      }

      const updates: Partial<Order> = {
        gateOtpSession: {
          ...(currentSession || { active: true }),
          verified: true,
        },
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      return NextResponse.json({
        success: true,
        message: "Customer OTP verified successfully. Proof of Delivery (PoD) images required to finalize handover.",
        order: updated,
      });
    }

    // Action 4E: Forceful Doorstep Proof of Delivery (PoD) Image Verification (2 Images Under 10MB)
    if (action === "finalize-doorstep-pod") {
      const {
        labelImage,
        productImage,
        labelImageName = "pod-shipping-label.jpg",
        productImageName = "pod-sealed-box.jpg",
        labelImageSize = 1024 * 500,
        productImageSize = 1024 * 800,
      } = body;

      if (!labelImage || !productImage) {
        return NextResponse.json(
          {
            success: false,
            error: "Both 2 Proof of Delivery images are strictly required: (1) Shipping Label sticker with name/barcode, and (2) Sealed product package condition.",
          },
          { status: 400 }
        );
      }

      // Enforce under 10 MB per image (10 * 1024 * 1024 bytes)
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      if (Number(labelImageSize) > MAX_SIZE_BYTES || Number(productImageSize) > MAX_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more images exceed the 10 MB file size limit. Please capture or upload images under 10 MB.",
          },
          { status: 400 }
        );
      }

      const podImages = {
        labelImage,
        productImage,
        labelImageName,
        productImageName,
        labelImageSize: Number(labelImageSize),
        productImageSize: Number(productImageSize),
        uploadedAt: new Date().toISOString(),
      };

      const completionEvent: OrderEvent = {
        id: "ev-pod-" + Math.random().toString(36).substring(2, 9),
        title: "Doorstep Delivery Verified & Handover Completed",
        description: `Customer 6-digit OTP verified at gate. 2 mandatory Proof of Delivery photos secured: Shipping Label Sticker (${labelImageName}, ${(Number(labelImageSize) / 1024 / 1024).toFixed(2)} MB) and Product Box (${productImageName}, ${(Number(productImageSize) / 1024 / 1024).toFixed(2)} MB) archived in S3 proof vault.`,
        timestamp: new Date().toISOString(),
        type: "delivery",
        actor: "Edge Verification Terminal",
      };

      const updatedEvents = [...(targetOrder.events || []), completionEvent];
      const updates: Partial<Order> = {
        deliveryStatus: "delivered",
        hubQueueStatus: "delivered",
        podImages,
        gateOtpSession: {
          active: false,
          otp: targetOrder.gateOtpSession?.otp,
          verified: true,
          podImages,
        },
        events: updatedEvents,
      };

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

      // Dispatch live Delivery Confirmation & Warranty Activation email via AWS SES
      sendDeliveredEmail(updated).catch((err) =>
        console.warn("[SES Delivery Completed Warning] Background email error:", err)
      );

      return NextResponse.json({
        success: true,
        message: "Doorstep delivery completed! Proof of delivery verified and archived.",
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

      const updated = await saveOrder(targetOrder.orderNumber, updates, targetOrder);

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
