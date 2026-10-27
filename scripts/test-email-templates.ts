import fs from "fs";
import {
  generateRazorpayOrderEmail,
  generateDispatchedEmail,
  generateGateOtpEmail,
  generateDeliveredEmail,
  generateRefundEmail,
  sendOrderConfirmationEmail,
  sendDispatchedEmail,
  sendGateOtpEmail,
  sendDeliveredEmail,
  sendRefundEmail,
} from "../src/lib/email-service";
import { Order } from "../src/types";

// Load .env.local
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const templateType = process.argv[2] || "confirmation";
const recipient = process.argv[3] || "satyamhimesh@gmail.com";

const mockOrder: Order = {
  id: "ord-demo-preview",
  orderNumber: "ANC-763954",
  customer: {
    fullName: "Himesh",
    email: recipient,
    contact: "+91 98765 43210",
    country: "India",
    address: "1420 NW Johnson Street",
    city: "Portland",
    state: "Oregon",
    zipCode: "97209",
  },
  items: [
    {
      productId: "form-01",
      name: "Form 01",
      variant: "graphite",
      variantName: "Graphite",
      price: 348.0,
      quantity: 1,
      image: "/images/hero-graphite.jpg",
      fit: "Precision acoustic fit",
    },
  ],
  subtotal: 348.0,
  shipping: 13.0,
  tax: 0.0,
  total: 361.0,
  paymentMethod: "razorpay",
  paymentStatus: "paid",
  razorpayPaymentId: "pay_TsB4mkIJoKLbdE",
  razorpayOrderId: "order_TsB4eaRJDCh0t5",
  deliveryStatus: "in_transit",
  currentHub: "Portland Primary Logistics Center",
  trackingNumber: "TRK-763954",
  transitMode: "van",
  vehicleNo: "OR-EXP-8891",
  createdAt: new Date().toISOString(),
  awsEventBridgeDispatched: true,
  cacheRevalidated: true,
};

async function main() {
  console.log("==================================================");
  console.log(`📧 Testing Template: "${templateType.toUpperCase()}"`);
  console.log(`Recipient: ${recipient}`);
  console.log("==================================================");

  let result;
  switch (templateType.toLowerCase()) {
    case "confirmation":
      console.log("Generating: Order Confirmation & Tax Invoice");
      result = await sendOrderConfirmationEmail(mockOrder, recipient);
      break;

    case "dispatched":
      console.log("Generating: Order Dispatched & Tracking Telemetry");
      result = await sendDispatchedEmail(mockOrder, recipient);
      break;

    case "otp":
      console.log("Generating: Doorstep 5-Min Alive Handover OTP");
      result = await sendGateOtpEmail(mockOrder, "849201", recipient);
      break;

    case "delivered":
      console.log("Generating: Delivery Confirmed & 2-Year Warranty Certificate");
      result = await sendDeliveredEmail(mockOrder, recipient);
      break;

    case "refund":
      console.log("Generating: Razorpay Refund Initiated Advice");
      result = await sendRefundEmail(mockOrder, "rfnd_demo_984210", 361.0, recipient);
      break;

    default:
      console.error(`Unknown template "${templateType}".`);
      console.log("Available options: confirmation, dispatched, otp, delivered, refund");
      process.exit(1);
  }

  if (result.success) {
    console.log("✅ EMAIL DISPATCHED SUCCESSFULLY VIA AWS SES!");
    console.log(`MessageId: ${result.messageId}`);
    console.log(`Check inbox at: ${recipient}`);
  } else {
    console.error("❌ Dispatch Error:", result.error);
  }
}

main();
