"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { useCart, CustomerCheckoutDetails } from "@/context/CartContext";
import { toast } from "@/components/Toaster";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    shipping,
    tax,
    total,
    updateQuantity,
    customerDetails,
    setCustomerDetails,
  } = useCart();

  const [formData, setFormData] = useState<CustomerCheckoutDetails>(customerDetails);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  const handlePresetSelect = (preset: "us" | "india") => {
    if (preset === "us") {
      const usData: CustomerCheckoutDetails = {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        contact: "+1 503 555 0199",
        country: "United States",
        address: "1420 NW Johnson Street",
        city: "Portland",
        state: "Oregon",
        zipCode: "97209",
      };
      setFormData(usData);
      setCustomerDetails(usData);
      toast({
        type: "info",
        title: "Preset: Outside India (US)",
        description: "Autofilled US buyer details for international card payment.",
      });
    } else {
      const inData: CustomerCheckoutDetails = {
        fullName: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        contact: "+91 98765 43210",
        country: "India",
        address: "42 Indiranagar, 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        zipCode: "560038",
      };
      setFormData(inData);
      setCustomerDetails(inData);
      toast({
        type: "info",
        title: "Preset: Inside India",
        description: "Autofilled India buyer details for UPI/NetBanking payment.",
      });
    }
  };

  const handleCountryChange = (country: string) => {
    const isIndia = country.toLowerCase() === "india";
    const updated = {
      ...formData,
      country,
      contact: isIndia && !formData.contact.startsWith("+91") ? "+91 98765 43210" : formData.contact,
    };
    setFormData(updated);
    setCustomerDetails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.address || !formData.city) {
      toast({
        type: "error",
        title: "Incomplete Details",
        description: "Please fill in all required shipping address fields.",
      });
      return;
    }

    setCustomerDetails(formData);
    toast({
      type: "success",
      title: "Shipping Address Saved",
      description: "Proceeding to secure Razorpay payment...",
    });

    router.push("/payment");
  };

  const effectiveShipping = shippingMethod === "express" ? shipping + 12.0 : shipping;
  const finalTotal = subtotal + effectiveShipping + tax;

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Checkout Minimalist Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAE5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
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
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                1
              </span>
              Shipping Details
            </span>
            <span className="text-zinc-300">➔</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-600 text-[10px] flex items-center justify-center">
                2
              </span>
              Payment
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">256-bit Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column (8 cols): Shipping Form */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                  STEP 1 OF 2
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                Shipping & Delivery
              </h1>
              <p className="text-xs text-zinc-500">
                Where should we send your Form 01 headphones?
              </p>
            </div>

            {/* Quick Test Presets */}
            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Autofill Presets:
                </span>
                <span className="text-[10px] text-zinc-400">1-click test fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("us")}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                    formData.country === "United States"
                      ? "bg-blue-50/50 border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-600"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1">
                    <span>🇺🇸</span> Outside India (US)
                  </div>
                  <div className="text-[10px] text-zinc-500">Alex Morgan · Portland, OR</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect("india")}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                    formData.country === "India"
                      ? "bg-blue-50/50 border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-600"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1">
                    <span>🇮🇳</span> Inside India
                  </div>
                  <div className="text-[10px] text-zinc-500">Aarav Sharma · Bengaluru, KA</div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Country / Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-2xs"
                >
                  <option value="United States">United States (Outside India)</option>
                  <option value="India">India (Inside India - UPI, NetBanking, Cards)</option>
                  <option value="United Kingdom">United Kingdom (Outside India)</option>
                  <option value="Canada">Canada (Outside India)</option>
                  <option value="Germany">Germany (Outside India)</option>
                  <option value="Australia">Australia (Outside India)</option>
                </select>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  CONTACT INFORMATION
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700">
                      Phone / Contact number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Required for Razorpay OTP & dispatch alerts
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
                    placeholder="+1 503 555 0199"
                  />
                </div>
              </div>

              {/* Physical Address */}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>Standard Courier</span>
                      <span>$12.00</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      3–5 business days with tracked delivery.
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
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-900">
                      <span>Priority Air Express</span>
                      <span>$24.00</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      1–2 business days expedited dispatch.
                    </p>
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Continue to Payment (${finalTotal.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-zinc-400 text-center mt-2">
                  Next: Choose payment method via Razorpay Standard Checkout
                </p>
              </div>
            </form>
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

              {/* Items List */}
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

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.variant, -1)
                            }
                            className="px-2 py-0.5 text-zinc-500 hover:text-black"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-medium text-zinc-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.variant, 1)
                            }
                            className="px-2 py-0.5 text-zinc-500 hover:text-black"
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
                  <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span>
                  <span className="font-medium text-zinc-900">${effectiveShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-zinc-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                  <span>Total</span>
                  <span className="text-xl font-bold">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Guarantee badges */}
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
      </main>
    </div>
  );
}
