import { Order } from "@/types";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface CustomRazorpayEmailData {
  subject: string;
  to: string;
  from: string;
  amountFormatted: string;
  orderNumber: string;
  paymentId: string;
  orderId: string;
  dateFormatted: string;
  html: string;
  text: string;
}

/**
 * Generates the custom Razorpay payment confirmation email requested by user:
 * "amount X is being paid from [email/source] to purchase [product] from ancwave platform"
 */
export function generateRazorpayOrderEmail(order: Order): CustomRazorpayEmailData {
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email;
  const isIndia = order.customer.country === "India" || (order.customer.contact && order.customer.contact.startsWith("+91"));

  const total = Number(order.total) || 0;
  const tax = Number(order.tax) || 0;

  const rawItems = (order.items || []).map((it) => {
    let price = Number(it.price) || 0;
    const quantity = Number(it.quantity) || 1;
    // Reconcile nominal test payments where item was catalog price
    if (order.items.length === 1 && price > total && total > 0) {
      price = total / quantity;
    }
    return {
      ...it,
      price,
      quantity,
    };
  });

  const itemsSubtotal = rawItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  const subtotal = (itemsSubtotal > 0 && itemsSubtotal <= total)
    ? itemsSubtotal
    : (Number(order.subtotal) > 0 && Number(order.subtotal) <= total)
      ? Number(order.subtotal)
      : Math.max(0, total - tax);

  const shipping = Math.max(0, Math.round((total - subtotal - tax) * 100) / 100);

  const shortAmount = isIndia
    ? `₹${Math.round(total * 83).toLocaleString("en-IN")}`
    : `$${total.toFixed(2)} USD`;

  const amountFormatted = isIndia
    ? `₹${Math.round(total * 83).toLocaleString("en-IN")} ($${total.toFixed(2)} USD)`
    : `$${total.toFixed(2)} USD`;

  const itemsListString = rawItems
    .map((item) => `${item.name} (${item.variantName || item.variant || "Standard"}) × ${item.quantity}`)
    .join(", ");

  const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `Payment Confirmed: ${shortAmount} paid via Razorpay for Order #${order.orderNumber} · ancwave`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F9F8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1A1D1A;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      max-width: 620px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #EAEBE9;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      background-color: #181B18;
      padding: 32px 36px;
      color: #FFFFFF;
    }
    .header-logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      text-decoration: none;
      display: inline-block;
    }
    .header-tagline {
      font-size: 11px;
      font-family: monospace;
      color: #A0A5A0;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .content {
      padding: 36px;
    }
    .alert-banner {
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 28px;
    }
    .alert-title {
      font-size: 14px;
      font-weight: 700;
      color: #15803D;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .alert-body {
      font-size: 13px;
      color: #166534;
      line-height: 1.5;
    }
    .statement-box {
      background: #F9FAF9;
      border: 1px solid #E8EAE8;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .statement-text {
      font-size: 14px;
      line-height: 1.6;
      color: #2D332D;
    }
    .statement-highlight {
      font-weight: 700;
      color: #0F172A;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #E2E4E2;
      font-size: 11px;
      font-family: serif;
    }
    .meta-label {
      color: #717671;
      text-transform: uppercase;
    }
    .meta-val {
      font-weight: 600;
      color: #2563EB;
      word-break: break-all;
    }
    .table-title {
      font-size: 12px;
      font-family: monospace;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #717671;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #555A55;
      padding: 10px 0;
      border-bottom: 1px solid #EAEBE9;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 14px 0;
      border-bottom: 1px solid #F0F2F0;
      font-size: 13px;
      vertical-align: middle;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #555A55;
      margin-bottom: 8px;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      font-size: 17px;
      font-weight: 800;
      color: #111827;
      padding-top: 12px;
      border-top: 2px solid #EAEBE9;
      margin-top: 12px;
    }
    .shipping-box {
      background: #F9FAF9;
      border-radius: 12px;
      padding: 18px;
      margin-top: 28px;
      font-size: 12px;
      line-height: 1.6;
      color: #4B524B;
    }
    .footer {
      background-color: #F4F5F4;
      padding: 24px 36px;
      font-size: 11px;
      color: #717671;
      text-align: center;
      line-height: 1.5;
      border-top: 1px solid #EAEBE9;
    }
    .button-cta {
      display: inline-block;
      background-color: #2563EB;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">ancwave</div>
      <div class="header-tagline">OFFICIAL RAZORPAY PAYMENT RECEIPT & ORDER CONFIRMATION</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Razorpay Payment Notice Banner -->
      <div class="alert-banner">
        <div class="alert-title">✓ Razorpay Payment Verified & Captured</div>
        <div class="alert-body">
          Your payment transaction has completed securely. Your order is registered in our fulfillment queue.
        </div>
      </div>

      <!-- Core Statement requested by user -->
      <div class="statement-box">
        <div class="statement-text">
          Dear <span class="statement-highlight">${customerName}</span>,<br /><br />
          This email confirms that an amount of <span class="statement-highlight">${amountFormatted}</span> has been successfully paid from <span class="statement-highlight">${customerEmail}</span> via Razorpay Gateway to purchase <span class="statement-highlight">${itemsListString}</span> from the <span class="statement-highlight">ancwave</span> platform.
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-label">Razorpay Payment ID</div>
            <div class="meta-val">${order.razorpayPaymentId || "pay_verified_razorpay"}</div>
          </div>
          <div>
            <div class="meta-label">Razorpay Order ID</div>
            <div class="meta-val">${order.razorpayOrderId || "order_live_razorpay"}</div>
          </div>
          <div>
            <div class="meta-label">Platform Order Ref</div>
            <div class="meta-val">#${order.orderNumber}</div>
          </div>
          <div>
            <div class="meta-label">Transaction Timestamp</div>
            <div class="meta-val" style="color: #111827;">${dateFormatted}</div>
          </div>
        </div>
      </div>

      <!-- Itemized Table -->
      <div class="table-title">PURCHASED AUDIO INSTRUMENTS</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rawItems
      .map(
        (item) => `
            <tr>
              <td>
                <strong style="color: #111827;">${item.name}</strong><br />
                <span style="color: #717671; font-size: 11px;">${item.variantName || item.variant || "Standard Edition"
          } · ${item.fit || "Precision Fit"}</span>
              </td>
              <td style="text-align: center; font-family: monospace;">${item.quantity}</td>
              <td style="text-align: right; font-family: monospace;">$${item.price.toFixed(2)}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700;">$${(
            item.price * item.quantity
          ).toFixed(2)}</td>
            </tr>
          `
      )
      .join("")}
        </tbody>
      </table>

      <!-- Price Breakdown -->
      <div style="max-width: 300px; margin-left: auto;">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span style="font-family: monospace;">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Insured Shipping:</span>
          <span style="font-family: monospace; color: ${shipping === 0 ? "#16A34A" : "#111827"}; font-weight: 600;">
            ${shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div class="summary-row">
          <span>Estimated Sales Tax / GST (0%):</span>
          <span style="font-family: monospace;">$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-total">
          <span>Total Paid:</span>
          <span style="color: #2563EB;">${amountFormatted}</span>
        </div>
      </div>

      <!-- Shipping Information -->
      <div class="shipping-box">
        <strong style="color: #111827; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">
          DISPATCH & DELIVERY DESTINATION
        </strong><br />
        <strong>Recipient:</strong> ${order.customer.fullName}<br />
        <strong>Address:</strong> ${order.customer.address}, ${order.customer.city}, ${order.customer.state
    } ${order.customer.zipCode}, ${order.customer.country || "United States"}<br />
        <strong>Estimated Delivery:</strong> 3–5 Business Days via Express Insured Courier<br />
        <strong>Warranty:</strong> 2-Year Comprehensive Manufacturer Hardware Warranty included.
      </div>

      <div style="text-align: center; margin-top: 10px;">
        <a href="https://ancwave.cyphertech.online/orders?order=${order.orderNumber}" target="_blank" rel="noopener noreferrer" class="button-cta">
          View in My Orders & Download PDF Bill →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ancwave Inc. · 1420 NW Johnson Street, Portland, Oregon<br />
      If you have questions regarding this payment or your equipment, reply to this email or write to
      <a href="mailto:hello@ancwave.com" style="color: #2563EB;">hello@ancwave.com</a>.<br />
      © 2026 ancwave. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const text = `
ancwave - Razorpay Payment Confirmation & Order Receipt
======================================================
Order Number: #${order.orderNumber}
Payment Status: VERIFIED & CAPTURED via Razorpay Gateway

Dear ${customerName},

This is an official receipt confirming that an amount of ${amountFormatted} has been paid from ${customerEmail} via Razorpay Gateway to purchase ${itemsListString} from the ancwave platform.

TRANSACTION DETAILS:
- Razorpay Payment ID: ${order.razorpayPaymentId || "pay_verified_razorpay"}
- Razorpay Order ID: ${order.razorpayOrderId || "order_live_razorpay"}
- Amount Paid: ${amountFormatted}
- Date: ${dateFormatted}

SHIPPING DESTINATION:
${order.customer.fullName}
${order.customer.address}
${order.customer.city}, ${order.customer.state} ${order.customer.zipCode}
${order.customer.country || "United States"}

Estimated Delivery: 3-5 Business Days.
Every Form series device includes our 2-Year Manufacturer Warranty and 30-Day Home Trial.

Manage your order and download your official PDF tax invoice at:
https://ancwave.cyphertech.online/orders?order=${order.orderNumber}

Thank you for choosing ancwave.
Support: hello@ancwave.com | +1 (503) 555-0148
  `.trim();

  return {
    subject,
    to: customerEmail,
    from: "ancwave Orders <orders@cyphertech.online>",
    amountFormatted,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "pay_verified_razorpay",
    orderId: order.razorpayOrderId || "order_live_razorpay",
    dateFormatted,
    html,
    text,
  };
}

/**
 * EMAIL 2: Order Dispatched & In-Transit Live Telemetry Notification
 */
export function generateDispatchedEmail(order: Order): CustomRazorpayEmailData {
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email;
  const trackingNumber = order.trackingNumber || `TRK-${order.orderNumber.replace(/[^0-9]/g, "") || "984210"}`;
  const fleetMode = (order.transitMode || "van").toUpperCase();
  const vehicle = order.vehicleNo || "OR-EXP-8891";
  const currentHub = order.currentHub || "Portland Primary Logistics Center";
  const subject = `Your Order #${order.orderNumber} Has Been Dispatched · Live Tracking Active`;
  const trackUrl = `https://ancwave.cyphertech.online/orders?order=${order.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9F8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1D1A; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAEBE9; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background-color: #181B18; padding: 32px 36px; color: #FFFFFF; }
    .header-logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .header-tagline { font-size: 11px; font-family: monospace; color: #A0A5A0; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px; }
    .alert-banner { background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #1D4ED8; margin-bottom: 4px; }
    .alert-body { font-size: 13px; color: #1E40AF; line-height: 1.5; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-top: 14px; border-top: 1px solid #E2E4E2; font-size: 11px; font-family: monospace; }
    .meta-label { color: #717671; text-transform: uppercase; }
    .meta-val { font-weight: 600; color: #2563EB; }
    .button-cta { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; font-size: 12px; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-top: 20px; }
    .footer { background-color: #F4F5F4; padding: 24px 36px; font-size: 11px; color: #717671; text-align: center; line-height: 1.5; border-top: 1px solid #EAEBE9; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">ancwave</div>
      <div class="header-tagline">LOGISTICS DISPATCH & EDGE TELEMETRY NOTICE</div>
    </div>
    <div class="content">
      <div class="alert-banner">
        <div class="alert-title">📦 Order Dispatched & In-Transit</div>
        <div class="alert-body">
          Your precision acoustic hardware has passed quality manifest inspection and has left <strong>${currentHub}</strong>.
        </div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #2D332D;">
        Dear <strong>${customerName}</strong>,<br /><br />
        Great news! Your package for Order <strong>#${order.orderNumber}</strong> has been handed over to the courier fleet and is currently in transit.
      </p>
      <div class="meta-grid">
        <div>
          <div class="meta-label">Tracking Number</div>
          <div class="meta-val">${trackingNumber}</div>
        </div>
        <div>
          <div class="meta-label">Transit Fleet Mode</div>
          <div class="meta-val">${fleetMode} [${vehicle}]</div>
        </div>
        <div>
          <div class="meta-label">Current Logistics Hub</div>
          <div class="meta-val" style="color: #111827;">${currentHub}</div>
        </div>
        <div>
          <div class="meta-label">Estimated Delivery</div>
          <div class="meta-val" style="color: #16A34A;">3–5 Business Days</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" class="button-cta">
          Track Live Consignment Timeline →
        </a>
      </div>
    </div>
    <div class="footer">
      ancwave Acoustics Inc. · 1420 NW Johnson Street, Portland, Oregon<br />
      © 2026 ancwave Acoustics. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
ancwave - Order Dispatched & In-Transit (#${order.orderNumber})
=============================================================
Dear ${customerName},

Your order #${order.orderNumber} has been dispatched from ${currentHub} and is on its way to you.

- Tracking Number: ${trackingNumber}
- Fleet Mode: ${fleetMode} (${vehicle})
- Estimated Delivery: 3-5 Business Days
- Live Tracking: ${trackUrl}

Thank you for choosing ancwave.
Support: hello@cyphertech.online
  `.trim();

  return {
    subject,
    to: customerEmail,
    from: "ancwave Orders <orders@cyphertech.online>",
    amountFormatted: `$${(order.total || 0).toFixed(2)} USD`,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "",
    orderId: order.razorpayOrderId || "",
    dateFormatted: new Date().toLocaleDateString("en-US"),
    html,
    text,
  };
}

/**
 * EMAIL 3: Doorstep Handover & 5-Minute Alive Security OTP Email
 * (Triggered when courier arrives at gate; pairs with upcoming AWS SMS)
 */
export function generateGateOtpEmail(order: Order, otp: string): CustomRazorpayEmailData {
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email;
  const subject = `🔐 Handover OTP: ${otp} for Order #${order.orderNumber} (Courier At Gate)`;
  const trackUrl = `https://ancwave.cyphertech.online/orders?order=${order.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9F8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1D1A; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAEBE9; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background-color: #181B18; padding: 32px 36px; color: #FFFFFF; }
    .header-logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .header-tagline { font-size: 11px; font-family: monospace; color: #A0A5A0; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px; }
    .alert-banner { background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #B45309; margin-bottom: 4px; }
    .alert-body { font-size: 13px; color: #92400E; line-height: 1.5; }
    .otp-box { background: #181B18; border-radius: 14px; padding: 26px 20px; text-align: center; margin: 24px 0; color: #FFFFFF; }
    .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; color: #94A3B8; font-family: monospace; margin-bottom: 8px; font-weight: 600; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; font-family: monospace; color: #38BDF8; margin: 6px 0; }
    .otp-validity { font-size: 11px; color: #E2E8F0; margin-top: 8px; font-weight: 500; }
    .notice-card { background: #F9FAF9; border: 1px solid #E8EAE8; border-radius: 12px; padding: 16px; font-size: 12px; line-height: 1.6; color: #4B524B; }
    .footer { background-color: #F4F5F4; padding: 24px 36px; font-size: 11px; color: #717671; text-align: center; line-height: 1.5; border-top: 1px solid #EAEBE9; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">ancwave</div>
      <div class="header-tagline">DOORSTEP HANDOVER SECURITY VERIFICATION</div>
    </div>
    <div class="content">
      <div class="alert-banner">
        <div class="alert-title">📍 Courier Arrived at Gate / Entrance</div>
        <div class="alert-body">
          Your delivery courier has arrived. To ensure secure chain-of-custody, please provide the 6-digit handover PIN below to the driver.
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #2D332D;">
        Hello <strong>${customerName}</strong>,<br />
        Your package for Order <strong>#${order.orderNumber}</strong> is ready for doorstep handover.
      </p>

      <div class="otp-box">
        <div class="otp-label">YOUR 6-DIGIT HANDOVER OTP</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">⏱️ Valid for 5 Minutes · One-Time Use</div>
      </div>

      <div class="notice-card">
        <strong>⚠️ Security Handover Protocol:</strong><br />
        1. Inspect the ancwave tamper-evident security tape on the parcel exterior.<br />
        2. Share this 6-digit PIN with the courier only after physical package inspection.<br />
        3. Once verified, the courier handheld terminal will finalize your delivery and activate your 2-Year Hardware Warranty.
      </div>
    </div>
    <div class="footer">
      ancwave Acoustics Inc. · Official Delivery Security Gateway<br />
      Need assistance? Contact support at <a href="mailto:hello@cyphertech.online" style="color: #2563EB;">hello@cyphertech.online</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
ancwave - Doorstep Handover Security PIN (#${order.orderNumber})
=============================================================
Hello ${customerName},

Your delivery courier is at your gate/entrance.

YOUR 6-DIGIT HANDOVER OTP: ${otp}
(Valid for 5 minutes)

Please inspect your package and provide this 6-digit PIN to the delivery driver to complete handover.

Order Ref: #${order.orderNumber}
Live Tracking: ${trackUrl}
  `.trim();

  return {
    subject,
    to: customerEmail,
    from: "ancwave Security <orders@cyphertech.online>",
    amountFormatted: `$${(order.total || 0).toFixed(2)} USD`,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "",
    orderId: order.razorpayOrderId || "",
    dateFormatted: new Date().toLocaleDateString("en-US"),
    html,
    text,
  };
}

/**
 * EMAIL 4: Delivery Confirmation & 2-Year Hardware Warranty Activation
 */
export function generateDeliveredEmail(order: Order): CustomRazorpayEmailData {
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email;
  const subject = `Delivered: Your ancwave Hardware has Arrived · 2-Year Warranty Activated (#${order.orderNumber})`;
  const orderUrl = `https://ancwave.cyphertech.online/orders?order=${order.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9F8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1D1A; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAEBE9; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background-color: #181B18; padding: 32px 36px; color: #FFFFFF; }
    .header-logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .header-tagline { font-size: 11px; font-family: monospace; color: #A0A5A0; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px; }
    .alert-banner { background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #15803D; margin-bottom: 4px; }
    .alert-body { font-size: 13px; color: #166534; line-height: 1.5; }
    .warranty-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .button-cta { display: inline-block; background-color: #181B18; color: #FFFFFF !important; text-decoration: none; font-size: 12px; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-top: 16px; }
    .footer { background-color: #F4F5F4; padding: 24px 36px; font-size: 11px; color: #717671; text-align: center; line-height: 1.5; border-top: 1px solid #EAEBE9; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">ancwave</div>
      <div class="header-tagline">PROOF OF DELIVERY & WARRANTY CERTIFICATE</div>
    </div>
    <div class="content">
      <div class="alert-banner">
        <div class="alert-title">🎉 Package Handover Completed</div>
        <div class="alert-body">
          Doorstep delivery for Order <strong>#${order.orderNumber}</strong> has been verified and confirmed.
        </div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #2D332D;">
        Dear <strong>${customerName}</strong>,<br /><br />
        Welcome to the ancwave acoustic family! Your order has been successfully delivered and received.
      </p>
      <div class="warranty-box">
        <strong style="color: #0F172A; font-size: 13px;">🛡️ 2-Year Comprehensive Hardware Warranty Active</strong><br />
        <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 8px 0 0;">
          All transducers, planar drivers, and Bluetooth 5.3 components are covered against manufacturing defects through <strong>${new Date(Date.now() + 2 * 365 * 86400000).toLocaleDateString()}</strong>.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${orderUrl}" target="_blank" rel="noopener noreferrer" class="button-cta">
          Download Official Invoice & Review Equipment →
        </a>
      </div>
    </div>
    <div class="footer">
      ancwave Acoustics Inc. · Official Customer Care<br />
      © 2026 ancwave Acoustics. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
ancwave - Order Delivered & Warranty Activated (#${order.orderNumber})
===================================================================
Dear ${customerName},

Your order #${order.orderNumber} has been delivered successfully.
Your 2-Year Manufacturer Hardware Warranty is now active.

View your order and download your official invoice at:
${orderUrl}

Thank you for choosing ancwave.
Support: hello@cyphertech.online
  `.trim();

  return {
    subject,
    to: customerEmail,
    from: "ancwave Orders <orders@cyphertech.online>",
    amountFormatted: `$${(order.total || 0).toFixed(2)} USD`,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "",
    orderId: order.razorpayOrderId || "",
    dateFormatted: new Date().toLocaleDateString("en-US"),
    html,
    text,
  };
}

/**
 * EMAIL 5: Cancellation & Razorpay Refund Initiated Advice
 */
export function generateRefundEmail(order: Order, refundId: string, refundAmount?: number): CustomRazorpayEmailData {
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email;
  const isIndia = order.customer.country === "India" || (order.customer.contact && order.customer.contact.startsWith("+91"));
  const amt = refundAmount ?? order.total;
  const refundFormatted = isIndia
    ? `₹${Math.round(amt * 83).toLocaleString("en-IN")} ($${amt.toFixed(2)} USD)`
    : `$${amt.toFixed(2)} USD`;

  const subject = `Refund Initiated: ${refundFormatted} for Order #${order.orderNumber} · ancwave`;
  const orderUrl = `https://ancwave.cyphertech.online/orders?order=${order.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9F8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1D1A; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAEBE9; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background-color: #181B18; padding: 32px 36px; color: #FFFFFF; }
    .header-logo { font-size: 24px; font-weight: 800; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .header-tagline { font-size: 11px; font-family: monospace; color: #A0A5A0; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px; }
    .alert-banner { background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #BE123C; margin-bottom: 4px; }
    .alert-body { font-size: 13px; color: #9F1239; line-height: 1.5; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-top: 14px; border-top: 1px solid #E2E4E2; font-size: 11px; font-family: monospace; }
    .meta-label { color: #717671; text-transform: uppercase; }
    .meta-val { font-weight: 600; color: #2563EB; word-break: break-all; }
    .footer { background-color: #F4F5F4; padding: 24px 36px; font-size: 11px; color: #717671; text-align: center; line-height: 1.5; border-top: 1px solid #EAEBE9; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">ancwave</div>
      <div class="header-tagline">OFFICIAL RAZORPAY REFUND ADVICE</div>
    </div>
    <div class="content">
      <div class="alert-banner">
        <div class="alert-title">↩️ Razorpay Gateway Refund Initiated</div>
        <div class="alert-body">
          Your cancellation has been processed. A refund of <strong>${refundFormatted}</strong> has been transmitted via Razorpay to your original payment account.
        </div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #2D332D;">
        Dear <strong>${customerName}</strong>,<br /><br />
        This email confirms that your refund has been successfully initiated. Depending on your bank or card issuer, funds will reflect in your account within <strong>2–7 business days</strong>.
      </p>
      <div class="meta-grid">
        <div>
          <div class="meta-label">Razorpay Refund ID</div>
          <div class="meta-val">${refundId}</div>
        </div>
        <div>
          <div class="meta-label">Refund Amount</div>
          <div class="meta-val" style="color: #BE123C;">${refundFormatted}</div>
        </div>
        <div>
          <div class="meta-label">Order Number</div>
          <div class="meta-val">#${order.orderNumber}</div>
        </div>
        <div>
          <div class="meta-label">Estimated Credit</div>
          <div class="meta-val" style="color: #111827;">2–7 Business Days</div>
        </div>
      </div>
    </div>
    <div class="footer">
      ancwave Acoustics Inc. · Official Razorpay Payment Gateway Partner<br />
      © 2026 ancwave Acoustics. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
ancwave - Refund Initiated (#${order.orderNumber})
=================================================
Dear ${customerName},

A refund of ${refundFormatted} for order #${order.orderNumber} has been initiated via Razorpay Gateway.

- Razorpay Refund ID: ${refundId}
- Refund Amount: ${refundFormatted}
- Turnaround Time: 2–7 Business Days back to original payment account.

View order audit history: ${orderUrl}

Support: hello@cyphertech.online
  `.trim();

  return {
    subject,
    to: customerEmail,
    from: "ancwave Orders <orders@cyphertech.online>",
    amountFormatted: refundFormatted,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "",
    orderId: order.razorpayOrderId || "",
    dateFormatted: new Date().toLocaleDateString("en-US"),
    html,
    text,
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

let cachedSesClient: SESClient | null = null;

function getSESClient(): SESClient | null {
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!cachedSesClient) {
    cachedSesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return cachedSesClient;
}

/**
 * Sends live order confirmation email to customer inbox via AWS SES.
 * Automatically falls back to simulated/logging mode if AWS credentials are not set.
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  recipientOverride?: string
): Promise<SendEmailResult> {
  const emailData = generateRazorpayOrderEmail(order);
  const recipient = recipientOverride || emailData.to;

  const fromEmail =
    process.env.AWS_SES_FROM_EMAIL ||
    "ancwave Orders <orders@cyphertech.online>";

  const client = getSESClient();

  if (!client) {
    console.log(
      `[SES Email Service - Simulated] Would send order email to ${recipient} for #${order.orderNumber} (AWS credentials not set)`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Subject: {
          Data: emailData.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: emailData.html,
            Charset: "UTF-8",
          },
          Text: {
            Data: emailData.text,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    console.log(
      `[SES Email Service] Live email sent to ${recipient} via AWS SES. MessageId: ${response.MessageId}`
    );
    return {
      success: true,
      messageId: response.MessageId,
      simulated: false,
    };
  } catch (err: any) {
    console.error(`[SES Email Service Error] Failed to send email to ${recipient}:`, err);
    return {
      success: false,
      error: err?.message || "Failed to send email via AWS SES",
    };
  }
}

/**
 * Generic internal SES helper to send any formatted CustomRazorpayEmailData
 */
async function sendGenericSesEmail(
  emailData: CustomRazorpayEmailData,
  recipientOverride?: string
): Promise<SendEmailResult> {
  const recipient = recipientOverride || emailData.to;
  const fromEmail =
    process.env.AWS_SES_FROM_EMAIL ||
    "ancwave Orders <orders@cyphertech.online>";
  const client = getSESClient();

  if (!client) {
    console.log(
      `[SES Email Service - Simulated] Would send "${emailData.subject}" to ${recipient} (AWS credentials not set)`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Subject: {
          Data: emailData.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: emailData.html,
            Charset: "UTF-8",
          },
          Text: {
            Data: emailData.text,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    console.log(
      `[SES Email Service] Dispatched "${emailData.subject}" to ${recipient}. MessageId: ${response.MessageId}`
    );
    return {
      success: true,
      messageId: response.MessageId,
      simulated: false,
    };
  } catch (err: any) {
    console.error(`[SES Email Service Error] Failed to dispatch to ${recipient}:`, err);
    return {
      success: false,
      error: err?.message || "Failed to send email via AWS SES",
    };
  }
}

export async function sendDispatchedEmail(order: Order, recipientOverride?: string): Promise<SendEmailResult> {
  const data = generateDispatchedEmail(order);
  return sendGenericSesEmail(data, recipientOverride);
}

export async function sendGateOtpEmail(order: Order, otp: string, recipientOverride?: string): Promise<SendEmailResult> {
  const data = generateGateOtpEmail(order, otp);
  return sendGenericSesEmail(data, recipientOverride);
}

export async function sendDeliveredEmail(order: Order, recipientOverride?: string): Promise<SendEmailResult> {
  const data = generateDeliveredEmail(order);
  return sendGenericSesEmail(data, recipientOverride);
}

export async function sendRefundEmail(
  order: Order,
  refundId: string,
  refundAmount?: number,
  recipientOverride?: string
): Promise<SendEmailResult> {
  const data = generateRefundEmail(order, refundId, refundAmount);
  return sendGenericSesEmail(data, recipientOverride);
}
