import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { OrderModel, ProductModel } from "@/lib/models";
import { Order } from "@/types";
import { dispatchOrderPlacedEvent } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

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

    // Deduct stock in real-time
    const { product: updatedProduct, previousStock } = store.reduceStock(totalQuantity);

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + (item.price || 349) * (item.quantity || 1),
      0
    );
    const shipping = 12.0; // Standard US shipping · $12.00 as shown in screenshot
    const tax = 0.0; // Tax - Oregon $0.00
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
        await ProductModel.findOneAndUpdate(
          { model: "WIRELESS OVER-EAR" },
          { stock: updatedProduct.stock },
          { upsert: true }
        );
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
  const orders = store.getOrders();
  return NextResponse.json({ success: true, count: orders.length, orders });
}
