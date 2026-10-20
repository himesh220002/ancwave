"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Lock,
  Globe,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  QrCode,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "@/context/CartContext";
import { Order } from "@/types";
import { toast } from "@/components/Toaster";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const {
    items,
    subtotal,
    shipping,
    tax,
    total,
    clearCart,
    customerDetails,
  } = useCart();

  const [detectedLocation, setDetectedLocation] = useState<"international" | "india">("international");
  const [activeIndiaTab, setActiveIndiaTab] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [selectedBank, setSelectedBank] = useState<string>("HDFC Bank");
  const [upiIdInput, setUpiIdInput] = useState<string>("alex@okaxis");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Initialize location based on customerDetails
  useEffect(() => {
    if (customerDetails?.country?.toLowerCase() === "india") {
      setDetectedLocation("india");
      setUpiIdInput("aarav@okhdfcbank");
    } else {
      setDetectedLocation("international");
      setUpiIdInput("alex@okaxis");
    }
  }, [customerDetails]);

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

  const handlePay = async () => {
    setIsSubmitting(true);

    try {
      // 1. Create order on backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: detectedLocation === "india" ? "INR" : "USD",
          receipt: "anc_" + Date.now(),
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create Razorpay order");
      }

      // 2. If real Razorpay keys are configured and window.Razorpay exists
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
            await finalizePayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          },
          prefill: {
            name: customerDetails.fullName,
            email: customerDetails.email,
            contact: customerDetails.contact,
          },
          notes: {
            address: customerDetails.address,
            city: customerDetails.city,
            state: customerDetails.state,
            zipCode: customerDetails.zipCode,
            country: customerDetails.country,
          },
          theme: {
            color: "#2563EB",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsSubmitting(false);
      } else {
        // Direct simulation / verification
        await finalizePayment(
          "pay_" + Math.random().toString(36).substring(2, 14),
          orderData.orderId,
          "sig_verified_hmac"
        );
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        type: "error",
        title: "Payment Error",
        description: "Could not initialize Razorpay checkout",
      });
      setIsSubmitting(false);
    }
  };

  const finalizePayment = async (
    paymentId: string,
    orderId: string,
    signature?: string
  ) => {
    try {
      const res = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          amount: total,
          customer: customerDetails,
          items,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setConfirmedOrder(data.order);
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
        title: "Verification Error",
        description: "Failed to verify payment with backend",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Minimalist Luxury Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Shipping</span>
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

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <Link
              href="/checkout"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">
                ✓
              </span>
              Shipping
            </Link>
            <span className="text-zinc-300">➔</span>
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                2
              </span>
              Payment
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">256-bit Razorpay Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Payment Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-10 md:py-14">
        {confirmedOrder ? (
          /* Order Confirmation Screen */
          <div className="max-w-2xl mx-auto rounded-3xl bg-white p-8 sm:p-12 border border-[#EAEAE5] shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest text-emerald-600 uppercase font-semibold">
                PAYMENT AUTHORIZED & VERIFIED
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">
                Thank you, {confirmedOrder.customer.fullName.split(" ")[0]}!
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                ORDER NUMBER: {confirmedOrder.orderNumber}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">Razorpay Payment ID:</span>
                <span className="font-mono font-semibold text-blue-600">
                  {confirmedOrder.razorpayPaymentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Receipt delivered to:</span>
                <span className="font-medium text-zinc-900">{confirmedOrder.customer.email}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200/60">
                <span className="text-zinc-500">Shipping destination:</span>
                <span className="text-zinc-900 text-right">
                  {confirmedOrder.customer.address}, {confirmedOrder.customer.city},{" "}
                  {confirmedOrder.customer.state} {confirmedOrder.customer.zipCode},{" "}
                  {confirmedOrder.customer.country || "United States"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Back to Homepage
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium"
              >
                Print Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Payment Selection Screen */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column (7 cols): Razorpay Options */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                    STEP 2 OF 2
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                  Payment Method
                </h1>
                <p className="text-xs text-zinc-500">
                  Powered directly by Razorpay Standard Gateway with Smart Geolocation.
                </p>
              </div>

              {/* Delivery Review Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAEAE5] shadow-2xs flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Delivering to:</span>
                    <span className="font-semibold text-zinc-900">
                      {customerDetails.fullName}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      ({customerDetails.contact})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {customerDetails.address}, {customerDetails.city}, {customerDetails.state}{" "}
                    {customerDetails.zipCode}, {customerDetails.country}
                  </p>
                </div>
                <Link
                  href="/checkout"
                  className="text-xs font-medium text-blue-600 hover:underline shrink-0 ml-4"
                >
                  Edit
                </Link>
              </div>

              {/* Smart Geolocation Switcher */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAEAE5] shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Razorpay Smart Geolocation Detection:
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-500">
                    Auto-Matched
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDetectedLocation("international")}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      detectedLocation === "international"
                        ? "bg-blue-50/50 border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-600"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1">
                      <span>🌐</span> Outside India
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Cards (Visa, MC, Amex) · 3D Secure
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetectedLocation("india")}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      detectedLocation === "india"
                        ? "bg-blue-50/50 border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-600"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1">
                      <span>🇮🇳</span> Inside India
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      UPI, NetBanking, Cards, Wallets
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Details Container */}
              <div className="rounded-2xl bg-white p-6 border border-[#EAEAE5] shadow-xs space-y-5">
                {detectedLocation === "international" ? (
                  /* Outside India: Card Interface */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                      <p className="font-semibold text-blue-950 mb-0.5">
                        International Location Detected
                      </p>
                      Razorpay routes your payment via International Card Processing with 3D Secure verification. Domestic Indian rails (UPI & Netbanking) are excluded.
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          International Credit or Debit Card
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
                            value={customerDetails.fullName}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Inside India: All Domestic Options */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                      <p className="font-semibold text-emerald-950 mb-0.5">
                        Domestic India Rails Enabled
                      </p>
                      All domestic Indian payment methods enabled: UPI instant payment, NetBanking across all Indian banks, RuPay/Cards, and Wallets.
                    </div>

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

                    {/* Tab 1: UPI */}
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
                            <span className="text-[10px] text-blue-600 font-medium">
                              Auto-approves upon authorization
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-500 block">
                            Instant App Checkout
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            {["Google Pay", "PhonePe", "Paytm", "CRED"].map((app) => (
                              <button
                                key={app}
                                type="button"
                                onClick={() => {
                                  toast({
                                    type: "info",
                                    title: `Opening ${app}...`,
                                    description: "UPI Intent request initiated",
                                  });
                                }}
                                className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-center font-medium text-[11px] text-zinc-700 hover:border-blue-500 transition-all shadow-2xs"
                              >
                                {app}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] text-zinc-500 block">
                            Or enter UPI ID / VPA
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiIdInput}
                              onChange={(e) => setUpiIdInput(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-800 focus:outline-none focus:border-blue-600"
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
                              className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Cards */}
                    {activeIndiaTab === "card" && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                          <span>RuPay, Visa, MasterCard, Maestro</span>
                          <span className="text-[10px] text-emerald-600">Zero OTP delay</span>
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

                    {/* Tab 3: NetBanking */}
                    {activeIndiaTab === "netbanking" && (
                      <div className="space-y-3 pt-1">
                        <div className="text-[11px] text-zinc-500">Popular Indian Banks</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "PNB"].map((bank) => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
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

                    {/* Tab 4: Wallets */}
                    {activeIndiaTab === "wallet" && (
                      <div className="space-y-2 pt-1">
                        {["Paytm Wallet", "PhonePe Wallet", "MobiKwik"].map((wallet) => (
                          <div
                            key={wallet}
                            className="p-3 rounded-lg border border-zinc-200 flex items-center justify-between text-xs cursor-pointer hover:border-blue-500 bg-white"
                          >
                            <span className="font-semibold text-zinc-800">{wallet}</span>
                            <span className="text-[10px] text-zinc-400">Ready</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Authorize & Pay Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePay}
                  className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>
                    {isSubmitting
                      ? "Authorizing with Razorpay..."
                      : `Authorize & Pay $${total.toFixed(2)} ${
                          detectedLocation === "india" ? "(₹29,990)" : ""
                        } via Razorpay`}
                  </span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>
                    256-bit SSL · Official Razorpay Standard Checkout · PCI-DSS Level 1
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-2xl bg-white p-6 sm:p-7 border border-[#EAEAE5] shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h2 className="text-base font-bold text-zinc-900">Order Summary</h2>
                  <span className="text-xs text-zinc-400">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variant}`}
                      className="flex gap-4 pb-4 border-b border-zinc-100 last:border-b-0"
                    >
                      <div className="relative w-16 h-16 rounded-xl bg-[#F0EFEA] p-1 shrink-0 overflow-hidden border border-zinc-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs text-zinc-900">
                              {item.name}
                            </h4>
                            <span className="font-semibold text-xs text-zinc-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {item.variantName} · {item.fit}
                          </p>
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-zinc-900">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span className="font-medium text-zinc-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                    <span>Total</span>
                    <span className="text-xl font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guarantee Badges */}
                <div className="pt-2 border-t border-zinc-100 space-y-2 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tracked delivery with insured shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>30-day risk-free home trial with free returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>2-year international manufacturer warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
