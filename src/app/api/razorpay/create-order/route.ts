import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount = 361,
      currency = "USD",
      receipt = "rcpt_" + Date.now(),
      userId,
      customer,
    } = body;

    const currentProduct = store.getProduct();
    if (currentProduct.stock <= 0) {
      return NextResponse.json(
        { success: false, error: "Form 01 is currently sold out." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Convert amount to sub-units (e.g. 361 USD = 36100 cents)
    const amountInSubunits = Math.round(Number(amount) * 100);

    let orderId = "order_" + Math.random().toString(36).substring(2, 16);

    // If real Razorpay keys are provided, create order via Razorpay API
    if (keyId && keySecret) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await instance.orders.create({
          amount: amountInSubunits,
          currency,
          receipt,
          notes: {
            product: "ancwave Form 01",
            revalidateTrigger: "true",
            userId: userId || "guest",
            customerEmail: customer?.email || "unspecified",
          },
        });

        orderId = order.id;
      } catch (err) {
        console.warn("Razorpay API notice (using fallback order ID):", err);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInSubunits,
      currency,
      keyId: keyId || "rzp_test_ancwave_demo",
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize Razorpay order" },
      { status: 500 }
    );
  }
}
