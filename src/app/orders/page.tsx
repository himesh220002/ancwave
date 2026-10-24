"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Download,
  FileText,
  Mail,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Printer,
  X,
  Send,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";
import { downloadOrderInvoicePdf } from "@/lib/invoice-generator";
import { generateRazorpayOrderEmail, CustomRazorpayEmailData } from "@/lib/email-service";

function MyOrdersContent() {
  const searchParams = useSearchParams();
  const orderQuery = searchParams.get("order") || "";
  const emailQuery = searchParams.get("email") || "";
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(orderQuery);
  const [emailLookup, setEmailLookup] = useState(emailQuery);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState<Order | null>(null);
  const [emailPreviewData, setEmailPreviewData] = useState<CustomRazorpayEmailData | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // Fetch orders
  const fetchOrders = async (emailParam?: string) => {
    setIsLoading(true);
    try {
      const activeEmail = emailParam || emailLookup || user?.email || "";
      const url = activeEmail
        ? `/api/orders?email=${encodeURIComponent(activeEmail)}`
        : "/api/orders?all=true";

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);

        // Auto-select order if query param provided
        if (orderQuery) {
          const match = data.orders.find(
            (o: Order) => o.orderNumber.toLowerCase() === orderQuery.toLowerCase()
          );
          if (match) {
            setSearchQuery(match.orderNumber);
          }
        }
      }
    } catch {
      toast({
        type: "error",
        title: "Orders Sync Notice",
        description: "Could not retrieve order history at this moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(user?.email || emailQuery);
  }, [user?.email, emailQuery]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(q)) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // Handle direct PDF Download
  const handleDownloadPdf = (order: Order) => {
    try {
      downloadOrderInvoicePdf(order);
      toast({
        type: "success",
        title: "Tax Invoice Downloaded",
        description: `Downloaded ancwave-invoice-${order.orderNumber}.pdf`,
      });
    } catch {
      toast({
        type: "error",
        title: "PDF Generation Failed",
        description: "Unable to compile PDF invoice. You can use Print View instead.",
      });
    }
  };

  // Open custom email preview
  const handleOpenEmailReceipt = (order: Order) => {
    const emailData = generateRazorpayOrderEmail(order);
    setEmailPreviewData(emailData);
    setSelectedOrderForEmail(order);
  };

  // Resend custom email receipt
  const handleResendEmail = async (order: Order) => {
    setIsResendingEmail(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend-email",
          orderNumber: order.orderNumber,
          email: order.customer.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Razorpay Receipt Dispatched",
          description: `Custom confirmation email sent to ${order.customer.email}`,
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Dispatch Notice",
        description: "Email service connection pending. View generated email below.",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar subtitle="/ MY ORDERS" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-10 sm:space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-mono tracking-[0.18em] text-zinc-500 uppercase">
              01 / YOUR PURCHASES & FULFILLMENT
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111111]">
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl font-normal leading-relaxed mt-2">
                Review your purchased audio instruments, download official tax invoices in PDF, and inspect verified Razorpay payment receipts.
              </p>
            </div>

            {/* Quick Actions / Stats */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white border border-[#EAEAE5] shadow-2xs text-xs">
                <span className="text-zinc-400 block font-mono text-[10px] uppercase">Total Orders</span>
                <span className="font-bold text-zinc-900 text-sm">{orders.length} placed</span>
              </div>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="p-2.5 rounded-xl bg-white border border-[#EAEAE5] hover:bg-zinc-50 text-zinc-600 hover:text-black transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Email Lookup Filter Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAEAE5] shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* Search query input */}
            <div className="md:col-span-7 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number (e.g. ANC-914820), product, or Razorpay ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Email lookup input for guest checkouts */}
            <div className="md:col-span-5 flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={emailLookup}
                  onChange={(e) => setEmailLookup(e.target.value)}
                  placeholder="Lookup by customer email..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchOrders(emailLookup)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Find
              </button>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Logged in as <strong>{user.email}</strong>. Showing your synced purchases.</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-white border border-[#EAEAE5] animate-pulse p-8 space-y-4"
              >
                <div className="h-6 bg-zinc-100 rounded-lg w-1/3"></div>
                <div className="h-24 bg-zinc-100 rounded-2xl w-full"></div>
                <div className="h-10 bg-zinc-100 rounded-xl w-1/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="rounded-3xl bg-white border border-[#EAEAE5] p-12 sm:p-16 text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900">No Orders Found</h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                {searchQuery || emailLookup
                  ? "We couldn't find any orders matching your search or email filter. Please double-check your order number or email address."
                  : "You haven't placed any orders yet. Explore our precision audio instruments and experience sound without compromise."}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Explore Audio Catalog
              </Link>
              {(searchQuery || emailLookup) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setEmailLookup("");
                    fetchOrders("");
                  }}
                  className="px-5 py-3 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white border border-[#EAEAE5] shadow-xs overflow-hidden transition-all hover:border-zinc-300"
                >
                  {/* Card Header Bar */}
                  <div className="bg-[#FAF9F5] border-b border-[#EAEAE5] p-5 sm:px-8 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          ORDER PLACED
                        </span>
                        <span className="font-semibold text-zinc-900">{formattedDate}</span>
                      </div>
                      <span className="text-zinc-300">/</span>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          ORDER NUMBER
                        </span>
                        <span className="font-mono font-bold text-zinc-900">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span className="text-zinc-300">/</span>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          TOTAL PAID
                        </span>
                        <span className="font-bold text-blue-600">
                          ${order.total.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    {/* Status & Gateway Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Razorpay verified badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Paid via Razorpay</span>
                      </span>

                      {/* Fulfillment badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Order Confirmed</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Purchased Items */}
                  <div className="p-5 sm:p-8 space-y-6">
                    <div className="divide-y divide-zinc-100">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-2xl bg-[#F0EFEA] border border-[#EAEAE5] overflow-hidden shrink-0">
                              <Image
                                src={item.image || "/images/hero-silver.jpg"}
                                alt={item.name}
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-zinc-900 truncate">
                                {item.name}
                              </h3>
                              <p className="text-xs text-zinc-500">
                                Variant: <strong className="text-zinc-700">{item.variantName || item.variant || "Standard"}</strong>
                                {item.fit && ` · ${item.fit}`}
                              </p>
                              <p className="text-[11px] font-mono text-zinc-400">
                                SKU: {item.componentSku || `ANC-${item.productId?.toUpperCase() || "FORM01"}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right sm:self-center shrink-0">
                            <div className="text-sm font-bold text-zinc-900 font-mono">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-zinc-400 font-mono">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Meta Details & Delivery Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs">
                      {/* Shipping info */}
                      <div className="md:col-span-7 space-y-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                          DELIVERY DESTINATION
                        </span>
                        <p className="font-semibold text-zinc-800">
                          {order.customer.fullName} ({order.customer.email})
                        </p>
                        <p className="text-zinc-600">
                          {order.customer.address}, {order.customer.city}, {order.customer.state}{" "}
                          {order.customer.zipCode}, {order.customer.country || "United States"}
                        </p>
                        <p className="text-zinc-500 pt-1 flex items-center gap-1.5 font-mono text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Estimated Arrival: 3–5 Business Days via Express Insured Courier</span>
                        </p>
                      </div>

                      {/* Razorpay Meta info */}
                      <div className="md:col-span-5 space-y-1 md:border-l md:border-zinc-200 md:pl-5">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                          RAZORPAY PAYMENT REFERENCE
                        </span>
                        <div className="font-mono text-[11px]">
                          <span className="text-zinc-400">Payment ID: </span>
                          <span className="text-blue-600 font-semibold break-all">
                            {order.razorpayPaymentId || "pay_verified_razorpay"}
                          </span>
                        </div>
                        <div className="font-mono text-[11px]">
                          <span className="text-zinc-400">Order ID: </span>
                          <span className="text-zinc-700 break-all">{order.razorpayOrderId || "order_live"}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>2-Year Warranty & 30-Day Returns Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Download PDF Bill Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(order)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Bill (PDF)</span>
                        </button>

                        {/* View Invoice Modal Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-zinc-500" />
                          <span>View Invoice</span>
                        </button>

                        {/* View Custom Email Receipt Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEmailReceipt(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>Razorpay Email Receipt</span>
                        </button>
                      </div>

                      {/* Track Delivery Timeline Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForTracking(order)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black transition-colors cursor-pointer py-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Package Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Invoice Modal Preview */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-zinc-900">
                  Tax Invoice: #{selectedOrderForInvoice.orderNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedOrderForInvoice)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Printable Bill Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-800 text-xs">
              {/* Company banner */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 lowercase">ancwave</h2>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    ancwave Acoustics Inc. · Official Customer Invoice
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">1420 NW Johnson St, Portland OR 97209</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold font-mono text-[10px] border border-emerald-200">
                    PAID VIA RAZORPAY
                  </span>
                  <p className="font-mono font-bold text-xs mt-1">INV-{selectedOrderForInvoice.orderNumber}</p>
                  <p className="text-[11px] text-zinc-400">
                    {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Billed To / Gateway Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">
                    CUSTOMER & SHIPPING DESTINATION
                  </span>
                  <p className="font-bold text-zinc-900">{selectedOrderForInvoice.customer.fullName}</p>
                  <p className="text-zinc-600">{selectedOrderForInvoice.customer.email}</p>
                  <p className="text-zinc-600">{selectedOrderForInvoice.customer.address}</p>
                  <p className="text-zinc-600">
                    {selectedOrderForInvoice.customer.city}, {selectedOrderForInvoice.customer.state}{" "}
                    {selectedOrderForInvoice.customer.zipCode}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">
                    PAYMENT GATEWAY DETAILS
                  </span>
                  <p className="font-medium text-zinc-800">Gateway: Razorpay Checkout</p>
                  <p className="font-mono text-zinc-600">
                    Payment ID: {selectedOrderForInvoice.razorpayPaymentId || "pay_verified"}
                  </p>
                  <p className="font-mono text-zinc-600">
                    Order ID: {selectedOrderForInvoice.razorpayOrderId || "order_live"}
                  </p>
                  <p className="text-emerald-700 font-medium mt-1">✓ Status: Captured & Authorized</p>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedOrderForInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3">
                          <strong className="text-zinc-900">{item.name}</strong>
                          <span className="block text-[11px] text-zinc-500">
                            {item.variantName || item.variant || "Standard"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">${item.price.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="max-w-xs ml-auto space-y-1.5 pt-2">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal:</span>
                  <span className="font-mono text-zinc-900">${selectedOrderForInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Insured Shipping:</span>
                  <span className="font-mono text-emerald-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Tax (0%):</span>
                  <span className="font-mono text-zinc-900">${(selectedOrderForInvoice.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2">
                  <span>Total Paid:</span>
                  <span className="text-blue-600">${selectedOrderForInvoice.total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 text-[11px] text-zinc-500 leading-relaxed border border-zinc-200">
                This official tax bill confirms completed online payment via Razorpay. All hardware products are backed by the ancwave 2-Year Limited Hardware Warranty and 30-Day Money-Back Trial.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Razorpay Email Receipt Modal */}
      {selectedOrderForEmail && emailPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-2xl w-full max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm">
                    Custom Email Receipt (Sent by Razorpay)
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                    To: {emailPreviewData.to}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isResendingEmail}
                  onClick={() => handleResendEmail(selectedOrderForEmail)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isResendingEmail ? "Sending..." : "Resend Email"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderForEmail(null);
                    setEmailPreviewData(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Subject Strip */}
            <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs flex items-center gap-2">
              <span className="font-mono text-zinc-400 uppercase text-[10px]">Subject:</span>
              <span className="font-semibold text-zinc-800">{emailPreviewData.subject}</span>
            </div>

            {/* Email HTML Frame Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 flex justify-center">
              <div
                className="bg-white rounded-xl shadow-xs overflow-hidden max-w-xl w-full text-xs"
                dangerouslySetInnerHTML={{ __html: emailPreviewData.html }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tracking Timeline Modal */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setSelectedOrderForTracking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider text-blue-600 uppercase font-semibold">
                LIVE SHIPMENT TIMELINE
              </span>
              <h3 className="text-xl font-bold text-zinc-900">
                Order #{selectedOrderForTracking.orderNumber}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Carrier: Express Insured Dispatch · Tracking #ANC-TRK-984210
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Payment Authorized via Razorpay</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Transaction ID {selectedOrderForTracking.razorpayPaymentId || "pay_verified"}. Amount captured successfully.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Quality Inspection & Packaging</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Acoustic drivers tested and serialized at our Portland assembly facility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-400">Carrier Handover & Transit</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Estimated departure within 24 business hours with tracking notifications.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForTracking(null)}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition cursor-pointer"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
            Loading Order Ledger...
          </p>
        </div>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}
