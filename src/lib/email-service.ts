import { Order } from "@/types";

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
  const amountFormatted = isIndia
    ? `₹${Math.round(order.total * 83).toLocaleString("en-IN")}`
    : `$${order.total.toFixed(2)} USD`;

  const itemsListString = order.items
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

  const subject = `Payment Confirmed: ${amountFormatted} paid via Razorpay for Order #${order.orderNumber} · ancwave`;

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
      font-family: monospace;
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
          ${order.items
            .map(
              (item) => `
            <tr>
              <td>
                <strong style="color: #111827;">${item.name}</strong><br />
                <span style="color: #717671; font-size: 11px;">${
                  item.variantName || item.variant || "Standard Edition"
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
      <div style="max-width: 280px; margin-left: auto;">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span style="font-family: monospace;">$${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Complimentary Express Shipping:</span>
          <span style="font-family: monospace; color: #16A34A; font-weight: 600;">FREE</span>
        </div>
        <div class="summary-row">
          <span>Estimated Sales Tax / GST:</span>
          <span style="font-family: monospace;">$${(order.tax || 0).toFixed(2)}</span>
        </div>
        <div class="summary-total">
          <span>Amount Paid:</span>
          <span style="color: #2563EB;">${amountFormatted}</span>
        </div>
      </div>

      <!-- Shipping Information -->
      <div class="shipping-box">
        <strong style="color: #111827; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">
          DISPATCH & DELIVERY DESTINATION
        </strong><br />
        <strong>Recipient:</strong> ${order.customer.fullName}<br />
        <strong>Address:</strong> ${order.customer.address}, ${order.customer.city}, ${
    order.customer.state
  } ${order.customer.zipCode}, ${order.customer.country || "United States"}<br />
        <strong>Estimated Delivery:</strong> 3–5 Business Days via Express Insured Courier<br />
        <strong>Warranty:</strong> 2-Year Comprehensive Manufacturer Hardware Warranty included.
      </div>

      <div style="text-align: center; margin-top: 10px;">
        <a href="https://ancwave.cyphertech.online/orders?order=${order.orderNumber}" class="button-cta">
          View in My Orders & Download PDF Bill →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ancwave Acoustics Inc. · 1420 NW Johnson Street, Portland, Oregon<br />
      If you have questions regarding this payment or your equipment, reply to this email or write to
      <a href="mailto:hello@ancwave.com" style="color: #2563EB;">hello@ancwave.com</a>.<br />
      © 2026 ancwave Acoustics. All rights reserved.
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
    from: "ancwave Orders <receipts@ancwave.com>",
    amountFormatted,
    orderNumber: order.orderNumber,
    paymentId: order.razorpayPaymentId || "pay_verified_razorpay",
    orderId: order.razorpayOrderId || "order_live_razorpay",
    dateFormatted,
    html,
    text,
  };
}
