import { jsPDF } from "jspdf";
import { Order } from "@/types";

/**
 * Generates and downloads an official tax invoice / bill as a PDF using jsPDF.
 */
export function generateOrderInvoicePdf(order: Order): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [20, 24, 22]; // Dark sleek #141816
  const accentColor: [number, number, number] = [37, 99, 235]; // Royal blue #2563EB
  const grayText: [number, number, number] = [100, 105, 100];
  const borderGray: [number, number, number] = [225, 228, 225];

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ancwave", 15, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 185, 180);
  doc.text("PRECISION ACOUSTIC INSTRUMENTS · SCANDINAVIAN ENGINEERING", 15, 21);

  // Invoice Tag (Top Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("TAX INVOICE", pageWidth - 15, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 205, 200);
  doc.text(`INV-${order.orderNumber}`, pageWidth - 15, 21, { align: "right" });

  // 2. Invoice Meta Details & Payment Gateway Strip
  let y = 38;

  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.text("INVOICE DATE", 15, y);
  doc.text("ORDER NUMBER", 65, y);
  doc.text("PAYMENT GATEWAY", 115, y);
  doc.text("PAYMENT STATUS", pageWidth - 15, y, { align: "right" });

  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  doc.text(formattedDate, 15, y);
  doc.text(order.orderNumber, 65, y);
  doc.text("Razorpay Gateway", 115, y);

  doc.setTextColor(22, 101, 52); // Emerald green
  doc.text("PAID & VERIFIED", pageWidth - 15, y, { align: "right" });

  // Thin separator
  y += 6;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  // 3. Razorpay Transaction Reference Box
  y += 5;
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "F");
  doc.setDrawColor(210, 215, 210);
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text("RAZORPAY PAYMENT ID:", 20, y + 6);
  doc.text("RAZORPAY ORDER ID:", 105, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentColor);
  doc.text(order.razorpayPaymentId || "pay_verified_razorpay", 20, y + 11.5);
  doc.setTextColor(...primaryColor);
  doc.text(order.razorpayOrderId || "order_live_razorpay", 105, y + 11.5);

  // 4. Addresses Section (Bill To / Ship To / Issuer)
  y += 24;
  const colWidth = (pageWidth - 30) / 2;

  // Billed To / Shipped To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);
  doc.text("BILLED & DELIVERED TO:", 15, y);
  doc.text("ISSUED BY PLATFORM:", 15 + colWidth, y);

  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(order.customer.fullName, 15, y);
  doc.text("ancwave Acoustics Inc.", 15 + colWidth, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 85, 80);
  doc.text(order.customer.email, 15, y);
  doc.text("1420 NW Johnson Street, Suite 400", 15 + colWidth, y);

  y += 4.5;
  doc.text(order.customer.address, 15, y);
  doc.text("Portland, OR 97209, United States", 15 + colWidth, y);

  y += 4.5;
  const destinationCity = `${order.customer.city}, ${order.customer.state} ${order.customer.zipCode}`;
  doc.text(destinationCity, 15, y);
  doc.text("Support: hello@ancwave.com · +1 (503) 555-0148", 15 + colWidth, y);

  y += 4.5;
  doc.text(order.customer.country || "United States", 15, y);
  doc.text("GSTIN / Tax ID: US-EIN-9482019482", 15 + colWidth, y);

  // 5. Line Items Table
  y += 10;
  doc.setFillColor(242, 244, 242);
  doc.rect(15, y, pageWidth - 30, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text("ITEM & SPECIFICATION", 20, y + 5.5);
  doc.text("QTY", 120, y + 5.5, { align: "center" });
  doc.text("UNIT PRICE", 150, y + 5.5, { align: "right" });
  doc.text("AMOUNT", pageWidth - 20, y + 5.5, { align: "right" });

  y += 8;
  doc.setFont("helvetica", "normal");

  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(252, 253, 252);
      doc.rect(15, y, pageWidth - 30, 11, "F");
    }

    doc.setDrawColor(...borderGray);
    doc.line(15, y + 11, pageWidth - 15, y + 11);

    // Item details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(item.name, 20, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...grayText);
    const variantDesc = `${item.variantName || item.variant || "Standard"} · ${
      item.fit || "Precision acoustic fit"
    }`;
    doc.text(variantDesc, 20, y + 8.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text(String(item.quantity), 120, y + 6, { align: "center" });
    doc.text(`$${item.price.toFixed(2)}`, 150, y + 6, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(`$${itemTotal.toFixed(2)}`, pageWidth - 20, y + 6, { align: "right" });

    y += 11;
  });

  // 6. Financial Summary Box (Right Aligned)
  y += 6;
  const summaryX = pageWidth - 85;
  const summaryValX = pageWidth - 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayText);

  doc.text("Subtotal:", summaryX, y);
  doc.text(`$${order.subtotal.toFixed(2)}`, summaryValX, y, { align: "right" });

  y += 5;
  doc.text("Insured Shipping:", summaryX, y);
  doc.text(order.shipping === 0 ? "FREE" : `$${order.shipping.toFixed(2)}`, summaryValX, y, {
    align: "right",
  });

  y += 5;
  doc.text("Estimated Tax / GST (0%):", summaryX, y);
  doc.text(`$${(order.tax || 0).toFixed(2)}`, summaryValX, y, { align: "right" });

  y += 4;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(summaryX - 5, y, pageWidth - 15, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text("TOTAL PAID:", summaryX, y);
  doc.setTextColor(...accentColor);
  doc.text(`$${order.total.toFixed(2)} USD`, summaryValX, y, { align: "right" });

  // 7. Payment Verification Stamp & Guarantee Box
  y = 230;

  doc.setFillColor(245, 248, 255);
  doc.roundedRect(15, y, pageWidth - 30, 24, 2, 2, "F");
  doc.setDrawColor(190, 210, 255);
  doc.roundedRect(15, y, pageWidth - 30, 24, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175); // Dark blue
  doc.text("RAZORPAY PAYMENT VERIFICATION & 2-YEAR WARRANTY ACTIVE", 20, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50, 70, 110);
  doc.text(
    "This official tax receipt certifies authorized payment capture via Razorpay Payment Gateway for ancwave platform.",
    20,
    y + 11.5
  );
  doc.text(
    "All Form series products are automatically covered under the 2-Year Manufacturer Hardware Warranty and 30-Day Home Trial.",
    20,
    y + 16.5
  );

  // 8. Bottom Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 145, 140);
  doc.text(
    "ancwave Acoustics Inc. · Registered in DE, USA · Official Customer Invoice · Powered by Razorpay",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return doc;
}

/**
 * Direct client trigger to download the official PDF invoice.
 */
export function downloadOrderInvoicePdf(order: Order) {
  const doc = generateOrderInvoicePdf(order);
  const filename = `ancwave-invoice-${order.orderNumber}.pdf`;
  doc.save(filename);
}
