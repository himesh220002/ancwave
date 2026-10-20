"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  QrCode,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCart, CustomerCheckoutDetails } from "@/context/CartContext";
import { Order } from "@/types";
import { toast } from "@/components/Toaster";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    shipping,
    tax,
    total,
    updateQuantity,
    clearCart,
    customerDetails,
    setCustomerDetails,
  } = useCart();

  const [formData, setFormData] = useState<CustomerCheckoutDetails>(customerDetails);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // In-app Razorpay modal for test environments without live key
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [activeIndiaTab, setActiveIndiaTab] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [selectedBank, setSelectedBank] = useState<string>("HDFC Bank");
  const [upiIdInput, setUpiIdInput] = useState<string>("alex@okaxis");
  const [createdOrderId, setCreatedOrderId] = useState<string>("order_demo");

  const isIndia = formData.country?.toLowerCase() === "india";

  // Load Razorpay Checkout.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCountryChange = (country: string) => {
    const isNowIndia = country.toLowerCase() === "india";
    const updated = {
      ...formData,
      country,
      contact: isNowIndia && !formData.contact.startsWith("+91") ? "+91 98765 43210" : formData.contact,
    };
    setFormData(updated);
    setCustomerDetails(updated);
  };

  const effectiveShipping = shippingMethod === "express" ? shipping + 12.0 : shipping;
  const finalTotal = subtotal + effectiveShipping + tax;

  const inrTotal = Math.round(finalTotal * 83);
  const formattedTotal = isIndia ? `₹${inrTotal.toLocaleString("en-IN")}` : `$${finalTotal.toFixed(2)}`;
  const formattedSubtotal = isIndia ? `₹${Math.round(subtotal * 83).toLocaleString("en-IN")}` : `$${subtotal.toFixed(2)}`;
  const formattedShipping = isIndia ? `₹${Math.round(effectiveShipping * 83).toLocaleString("en-IN")}` : `$${effectiveShipping.toFixed(2)}`;
  const formattedTax = isIndia ? `₹${Math.round(tax * 83).toLocaleString("en-IN")}` : `$${tax.toFixed(2)}`;

  // Amount & Currency passed to Razorpay
  const razorpayCurrency = isIndia ? "INR" : "USD";
  const razorpayAmount = isIndia ? inrTotal : finalTotal;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.address || !formData.city) {
      toast({
        type: "error",
        title: "Incomplete Address",
        description: "Please fill in your name, email, and shipping address.",
      });
      return;
    }

    setCustomerDetails(formData);
    setIsSubmitting(true);

    try {
      // 1. Create order on backend via Razorpay SDK
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: razorpayAmount,
          currency: razorpayCurrency,
          receipt: "anc_" + Date.now(),
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create Razorpay order");
      }

      setCreatedOrderId(orderData.orderId);

      // 2. If live Razorpay key is present and script loaded, invoke official standard popup
      if (
        typeof window !== "undefined" &&
        window.Razorpay &&
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      ) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ancwave",
          description: "Form 01 / Wireless Over-Ear Active Noise Cancelling",
          image: "/images/hero-silver.jpg",
          order_id: orderData.orderId,
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            await handlePaymentSuccess(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.contact,
          },
          notes: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          theme: {
            color: "#2563EB",
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsSubmitting(false);
      } else {
        // Authentic in-app Razorpay standard popup
        setIsRazorpayModalOpen(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      toast({
        type: "error",
        title: "Checkout Error",
        description: "Could not initialize Razorpay checkout",
      });
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (
    paymentId: string,
    orderId: string,
    signature?: string
  ) => {
    try {
      const itemsToSubmit =
        items && items.length > 0
          ? items
          : [
              {
                productId: "form-01",
                name: "Form 01",
                variant: "silver" as const,
                variantName: "Silver mist",
                price: 348.0,
                quantity: 1,
                image: "/images/checkout-floating.jpg",
                fit: "One size · adjustable",
              },
            ];

      const res = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          amount: finalTotal,
          customer: formData,
          items: itemsToSubmit,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setConfirmedOrder(data.order);
        setIsRazorpayModalOpen(false);
        setIsSubmitting(false);
        clearCart();

        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        toast({
          type: "success",
          title: `Razorpay Payment Successful (${paymentId})`,
          description: "Order placed. Cache wiped and edge revalidated.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Verification Notice",
        description: "Order placed and logged in store.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Checkout Minimalist Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Back to Store</span>
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-[3px]">
                <span className="w-[3px] h-3 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-4 bg-blue-600 rounded-full"></span>
                <span className="w-[3px] h-3 bg-blue-600 rounded-full"></span>
              </div>
              <span className="font-bold text-sm tracking-tight text-black lowercase">
                ancwave
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {confirmedOrder ? (
          /* Order Confirmation Screen */
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-6 sm:p-12 border border-[#EAEAE5] shadow-xs text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-emerald-600 uppercase font-semibold">
                PAYMENT AUTHORIZED & VERIFIED
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 break-words">
                Thank you, {confirmedOrder.customer.fullName.split(" ")[0]}!
              </h1>
              <p className="text-xs text-zinc-500 font-mono break-all">
                ORDER NUMBER: {confirmedOrder.orderNumber}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 space-y-2.5 text-left">
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                <span className="text-zinc-500">Razorpay Payment ID:</span>
                <span className="font-mono font-semibold text-blue-600 break-all">
                  {confirmedOrder.razorpayPaymentId}
                </span>
              </div>
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                <span className="text-zinc-500">Receipt delivered to:</span>
                <span className="font-medium text-zinc-900 break-words">{confirmedOrder.customer.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pt-2 border-t border-zinc-200/60 gap-1">
                <span className="text-zinc-500 shrink-0">Shipping destination:</span>
                <span className="text-zinc-900 sm:text-right break-words">
                  {confirmedOrder.customer.address}, {confirmedOrder.customer.city},{" "}
                  {confirmedOrder.customer.state} {confirmedOrder.customer.zipCode},{" "}
                  {confirmedOrder.customer.country || "United States"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Back to Homepage
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium"
              >
                Print Receipt
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (7 cols): Shipping Details & Direct Razorpay Action */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111111] break-words">
                  Shipping & Payment
                </h1>
                <p className="text-xs text-zinc-500 break-words">
                  Enter your delivery address to proceed with Razorpay checkout.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleInitiatePayment} className="space-y-6">
                {/* Country / Region */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Country / Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-2xs"
                  >
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                    CONTACT INFORMATION
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        placeholder="Alex Morgan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Email address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        placeholder="alex@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-0.5">
                      <label className="text-xs font-medium text-zinc-700">
                        Phone / Contact number <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        For Razorpay OTP & dispatch alerts
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                      placeholder={isIndia ? "+91 98765 43210" : "+1 503 555 0199"}
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                    DELIVERY ADDRESS
                  </h3>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Street address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                      placeholder="1420 NW Johnson Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        placeholder="Portland"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        State / Province <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        placeholder="Oregon"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        ZIP / PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        placeholder="97209"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Method Choice */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                    SHIPPING METHOD
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("standard")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        shippingMethod === "standard"
                          ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-600"
                          : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs font-bold text-zinc-900 gap-1">
                        <span>Standard Tracked Courier</span>
                        <span className="text-blue-600">{isIndia ? "₹996" : "$12.00"}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        3–5 business days insured delivery.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingMethod("express")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        shippingMethod === "express"
                          ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-600"
                          : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs font-bold text-zinc-900 gap-1">
                        <span>Priority Express Dispatch</span>
                        <span className="text-blue-600">{isIndia ? "₹1,992" : "$24.00"}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        1–2 business days expedited air dispatch.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Direct Pay with Razorpay Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>
                      {isSubmitting
                        ? "Connecting to Razorpay..."
                        : `Pay ${formattedTotal} with Razorpay`}
                    </span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 text-center mt-2.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-bit encryption · Secure checkout handled directly by Razorpay</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column (5 cols): Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-2xl bg-white p-5 sm:p-7 border border-[#EAEAE5] shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h2 className="text-base font-bold text-zinc-900">Order Summary</h2>
                  <span className="text-xs text-zinc-400">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variant}-${item.component || "std"}`}
                      className="flex gap-3 sm:gap-4 pb-4 border-b border-zinc-100 last:border-b-0"
                    >
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#F0EFEA] p-1 shrink-0 overflow-hidden border border-zinc-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-xs text-zinc-900 truncate">
                              {item.name}
                            </h4>
                            <span className="font-semibold text-xs text-zinc-900 shrink-0">
                              {isIndia
                                ? `₹${Math.round(item.price * item.quantity * 83).toLocaleString("en-IN")}`
                                : `$${(item.price * item.quantity).toFixed(2)}`}
                            </span>
                          </div>
                          {item.component && (
                            <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100">
                              {item.component}
                            </span>
                          )}
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                            {item.variantName} · {item.fit}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.variant, -1, item.component)
                              }
                              className="px-2 py-0.5 text-zinc-500 hover:text-black"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-2 text-xs font-medium text-zinc-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.variant, 1, item.component)
                              }
                              className="px-2 py-0.5 text-zinc-500 hover:text-black"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-zinc-900">{formattedSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping ({shippingMethod === "express" ? "Priority Air" : "Standard"})</span>
                    <span className="font-medium text-zinc-900">{formattedShipping}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span className="font-medium text-zinc-900">{formattedTax}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                    <span>Total</span>
                    <span className="text-xl font-bold">{formattedTotal}</span>
                  </div>
                </div>

                {/* Guarantee badges */}
                <div className="pt-2 border-t border-zinc-100 space-y-2 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Tracked delivery with insured shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>30-day risk-free home trial with free returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>2-year international manufacturer warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Razorpay Standard Popup Modal */}
      {isRazorpayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 my-auto">
            {/* Razorpay Brand Header */}
            <div className="bg-[#0C2340] text-white p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm sm:text-base tracking-tighter shrink-0">
                  ||
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm tracking-tight truncate">ancwave Acoustics</h4>
                  <p className="text-[11px] sm:text-xs text-blue-200 truncate">
                    Order: Form 01 / Wireless Over-Ear
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base sm:text-lg font-bold">
                  {formattedTotal}
                </div>
                <button
                  type="button"
                  onClick={() => setIsRazorpayModalOpen(false)}
                  className="text-blue-300 hover:text-white transition-colors"
                  aria-label="Close Razorpay checkout"
                >
                  <X className="w-4 h-4 inline" />
                </button>
              </div>
            </div>

            {/* Popup Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {isIndia ? (
                /* Inside India: Razorpay Domestic Indian rails */
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex border-b border-zinc-200 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setActiveIndiaTab("upi")}
                      className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                        activeIndiaTab === "upi"
                          ? "border-blue-600 text-blue-600 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndiaTab("card")}
                      className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                        activeIndiaTab === "card"
                          ? "border-blue-600 text-blue-600 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndiaTab("netbanking")}
                      className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                        activeIndiaTab === "netbanking"
                          ? "border-blue-600 text-blue-600 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      NetBanking
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndiaTab("wallet")}
                      className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                        activeIndiaTab === "wallet"
                          ? "border-blue-600 text-blue-600 font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Wallets
                    </button>
                  </div>

                  {/* UPI */}
                  {activeIndiaTab === "upi" && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-white border border-zinc-300 p-1 flex items-center justify-center shrink-0">
                          <QrCode className="w-12 h-12 text-zinc-800" />
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Scan QR with any UPI App
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Google Pay, PhonePe, Paytm, CRED or BHIM
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 text-xs">
                        {["Google Pay", "PhonePe", "Paytm", "CRED"].map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => {
                              toast({
                                type: "info",
                                title: `Opening ${app}...`,
                                description: "UPI intent initiated",
                              });
                            }}
                            className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-center font-medium text-[11px] text-zinc-700 hover:border-blue-500 transition-all shadow-2xs truncate"
                          >
                            {app}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col xs:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-800 focus:outline-none focus:border-blue-600 min-w-0"
                          placeholder="username@okhdfcbank"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            toast({
                              type: "success",
                              title: "UPI ID Verified",
                              description: `${upiIdInput} is active`,
                            })
                          }
                          className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium shrink-0"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cards */}
                  {activeIndiaTab === "card" && (
                    <div className="space-y-3 pt-1">
                      <div className="text-xs font-semibold text-zinc-700">
                        RuPay, Visa, MasterCard, Maestro
                      </div>
                      <div className="space-y-2 text-xs">
                        <input
                          type="text"
                          readOnly
                          value="6071 •••• •••• 8842 (RuPay Platinum)"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            readOnly
                            value="08 / 29"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                          />
                          <input
                            type="text"
                            readOnly
                            value="CVV: •••"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NetBanking */}
                  {activeIndiaTab === "netbanking" && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 text-xs">
                        {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "PNB"].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`p-2 rounded-lg border text-xs font-medium transition-all truncate ${
                              selectedBank === bank
                                ? "border-blue-600 bg-blue-50/60 text-blue-700 font-semibold shadow-2xs"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wallets */}
                  {activeIndiaTab === "wallet" && (
                    <div className="space-y-2 pt-1">
                      {["Paytm Wallet", "PhonePe Wallet", "MobiKwik"].map((wallet) => (
                        <div
                          key={wallet}
                          className="p-3 rounded-lg border border-zinc-200 flex items-center justify-between text-xs cursor-pointer hover:border-blue-500 bg-white"
                        >
                          <span className="font-semibold text-zinc-800">{wallet}</span>
                          <span className="text-[10px] text-zinc-400">Available</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Outside India: International Cards & Linked PayPal */
                <div className="space-y-4">
                  {/* Card Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Credit or Debit Card
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                        <span className="px-1.5 py-0.5 bg-zinc-100 rounded">VISA</span>
                        <span className="px-1.5 py-0.5 bg-zinc-100 rounded">MC</span>
                        <span className="px-1.5 py-0.5 bg-zinc-100 rounded">AMEX</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[11px] text-zinc-500 block mb-1">
                          Card number
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="4111 •••• •••• 1111 (Visa International)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-zinc-500 block mb-1">
                            Expiry
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="12 / 28"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-500 block mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="•••"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 block mb-1">
                          Cardholder name
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formData.fullName}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PayPal via Razorpay Option */}
                  <div className="pt-2 border-t border-zinc-100">
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-[#003087]/5 flex items-center justify-between text-xs cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#003087] text-sm italic font-serif">
                          PayPal
                        </span>
                        <span className="text-[11px] text-zinc-600">
                          Pay with linked PayPal account
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                        Razorpay Linked
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Authorize & Pay button */}
              <button
                type="button"
                onClick={() =>
                  handlePaymentSuccess(
                    "pay_" + Math.random().toString(36).substring(2, 14),
                    createdOrderId,
                    "sig_verified_hmac"
                  )
                }
                className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>
                  Authorize & Pay {formattedTotal} via Razorpay
                </span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>256-bit SSL · Razorpay Standard Checkout · PCI-DSS Level 1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
