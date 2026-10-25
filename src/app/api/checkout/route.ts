import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel, ProductModel } from "@/lib/models";
import { Order } from "@/types";
import { dispatchOrderPlacedEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";
import { deductOrderStock } from "@/lib/inventory-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, paymentMethod = "stripe" } = body;

    if (!customer || !customer.fullName || !customer.email) {
      return NextResponse.json(
        { success: false, error: "Customer details are required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart cannot be empty" },
        { status: 400 }
      );
    }

    // Check available stock
    const currentProduct = store.getProduct();
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentProduct.stock < totalQuantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${currentProduct.stock} unit(s) remaining in stock. Please adjust your bag.`,
          currentStock: currentProduct.stock,
        },
        { status: 400 }
      );
    }

    // Deduct stock in real-time across both MongoDB Atlas and memory store
    const stockResults = await deductOrderStock(items);
    const updatedProduct = store.getProduct();
    const previousStock = currentProduct.stock;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 349) * (Number(item.quantity) || 1),
      0
    );
    const shippingFixtures = store.getShippingFixtures();
    const shipping =
      typeof body.shipping === "number"
        ? body.shipping
        : (shippingFixtures?.generalDeliveryPriceUsd ?? 0);
    const tax = typeof body.tax === "number" ? body.tax : 0.0;
    const total = subtotal + shipping + tax;

    const orderNumber = "ANC-" + Math.floor(100000 + Math.random() * 900000);

    const order: Order = {
      id: "ord-" + Math.random().toString(36).substring(2, 9),
      orderNumber,
      customer,
      items,
      subtotal,
      shipping,
      tax,
      total,
      paymentMethod,
      paymentStatus: "paid",
      createdAt: new Date().toISOString(),
      awsEventBridgeDispatched: true,
      cacheRevalidated: true,
    };

    // Save to store
    store.addOrder(order);

    // Persist to MongoDB if available
    const db = await connectDB();
    if (db) {
      try {
        await OrderModel.create(order);
      } catch (err) {
        console.warn("MongoDB order sync notice:", err);
      }
    }

    // 1. Dispatch AWS EventBridge Event: order.placed -> triggers Lambda worker
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
        detailType: awsLog.detailType,
        lambdaExecutionDuration: `${awsLog.lambdaExecution.durationMs}ms`,
      },
      message: `Order ${orderNumber} confirmed! Stock updated to ${updatedProduct.stock}. Cache wiped and fresh page served immediately to subsequent visitors.`,
    });
  } catch (error) {
    console.error("Error in /api/checkout:", error);
    return NextResponse.json(
      { success: false, error: "Payment processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  let orders: Order[] = [];

  // 1. Fetch from MongoDB Atlas
  try {
    const db = await connectDB();
    if (db) {
      const mongoOrders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
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
    }
  } catch (err) {
    console.warn("MongoDB orders fetch in /api/checkout notice:", err);
  }

  // 2. Fallback/merge with memory store orders
  const storeOrders = store.getOrders();
  const existingOrderNumbers = new Set(orders.map((o) => o.orderNumber?.toUpperCase()));

  for (const so of storeOrders) {
    if (so.orderNumber && !existingOrderNumbers.has(so.orderNumber.toUpperCase())) {
      orders.push(so);
      existingOrderNumbers.add(so.orderNumber.toUpperCase());
    }
  }

  return NextResponse.json({ success: true, count: orders.length, orders });
}
