"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  RefreshCw,
  Flame,
  ArrowLeft,
  Package,
  ShoppingBag,
  Zap,
  Save,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Radio,
  Tag,
} from "lucide-react";
import { ProductData, Order, AWSEventLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockInput, setStockInput] = useState<number>(4);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [isFlashSale, setIsFlashSale] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      const prodRes = await fetch("/api/product");
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProduct(data.product);
        setStockInput(data.product.stock);
        setDiscountInput(data.product.activeDiscount || 0);
        setIsFlashSale(data.product.isFlashSale ?? true);
      }

      const ordRes = await fetch("/api/checkout");
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: Number(stockInput),
          activeDiscount: Number(discountInput),
          isFlashSale,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        toast({
          type: "success",
          title: "Inventory Synced & Revalidated",
          description: `Stock set to ${data.product.stock}. Edge cache wiped.`,
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update product inventory",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePurgeAndRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/", tag: "product-details" }),
      });
      const data = await res.json();
      if (data.revalidated) {
        toast({
          type: "success",
          title: "Next.js ISR Cache Wiped",
          description: `Event ID: ${data.awsEventId}. Next visitor gets instant fresh page.`,
        });
        fetchAdminData();
      }
    } catch {
      toast({
        type: "error",
        title: "Revalidate Failed",
        description: "Failed to purge cache",
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] text-zinc-950 font-sans">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                ancwave Production Operations & Cache Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePurgeAndRevalidate}
              disabled={isRevalidating}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span>{isRevalidating ? "Purging Edge..." : "Wipe Edge Cache & Revalidate"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>LIVE STOCK</span>
              <Package className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-950">
              {product ? product.stock : 4} <span className="text-sm font-normal text-zinc-500">units</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {product && product.stock <= product.lowStockThreshold ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Few Left alert triggered (&le;5)
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">Healthy inventory levels</span>
              )}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>ACTIVE PRICE</span>
              <Tag className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-950">
              ${product ? product.price : 349}
            </div>
            <p className="text-[11px] text-zinc-500">
              MSRP $399.00 · CloudFront cached
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>TOTAL ORDERS</span>
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-950">
              {orders.length}
            </div>
            <p className="text-[11px] text-zinc-500">
              Emitted to AWS EventBridge
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>CACHE STATUS</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-4 h-4" /> Next.js ISR Synced
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Last: {product?.lastRevalidatedAt ? new Date(product.lastRevalidatedAt).toLocaleTimeString() : "Recent"}
            </p>
          </div>
        </div>

        {/* Inventory Control & Revalidation Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Real-time Stock Modifier */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-xl font-bold text-zinc-950 font-sans">
                Adjust Real-Time Inventory & Flash Alert
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Setting stock to 5 or lower immediately renders the “🔥 Few left!” flash badge for subsequent visitors.
              </p>
            </div>

            <form onSubmit={handleUpdateInventory} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Headphone Stock Level (Units)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={stockInput}
                    onChange={(e) => setStockInput(Number(e.target.value))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50"
                  />
                  <button
                    type="button"
                    onClick={() => setStockInput(3)}
                    className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Quick Set: 3 (Flash Alert)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockInput(20)}
                    className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    Quick Set: 20
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Active Discount ($ Off)
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50"
                />
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <input
                  type="checkbox"
                  id="flashSaleToggle"
                  checked={isFlashSale}
                  onChange={(e) => setIsFlashSale(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="flashSaleToggle" className="text-xs font-medium text-zinc-700 cursor-pointer">
                  Enable "Few Left" Flash Alert Trigger when stock &le; 5 units
                </label>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdating ? "Saving & Revalidating..." : "Save Stock & Purge Stale Cache"}</span>
              </button>
            </form>
          </div>

          {/* Right: How Revalidation Works Explanation Box */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-xl font-bold text-zinc-950 font-sans flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                The Next.js Cache & Revalidate Mechanism
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                How ancwave solves stale inventory in high-volume flash sales.
              </p>
            </div>

            <div className="space-y-4 text-xs text-zinc-600 leading-relaxed">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                <span className="font-bold text-blue-900 block">1. Edge Static Generation (ISR)</span>
                <p>
                  Visitors receive cached HTML from CloudFront edge locations in under 15ms. No database queries occur on standard page loads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                <span className="font-bold text-amber-900 block">2. On-Demand Purge upon Purchase</span>
                <p>
                  When a customer buys Form 01, the checkout handler decrements stock and executes `revalidatePath('/')`.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                <span className="font-bold text-emerald-900 block">3. Immediate Fresh Hydration</span>
                <p>
                  The stale cached page is instantaneously replaced. The next customer who loads the website sees the updated stock count and the animated "🔥 Few left!" flash alert!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Orders Table */}
        <div className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-950 font-sans">
              Recent Customer Transactions
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              {orders.length} Completed Orders
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              No orders placed yet. Head back to the store and place a test order!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 font-mono uppercase text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Variant</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">AWS Event</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-sans">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/60">
                      <td className="p-3 font-mono font-bold text-zinc-950">
                        {ord.orderNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-zinc-900">{ord.customer.fullName}</div>
                        <div className="text-zinc-500 text-[11px]">{ord.customer.email}</div>
                      </td>
                      <td className="p-3">
                        {ord.items.map((i, idx) => (
                          <span key={idx} className="inline-block bg-zinc-100 px-2 py-0.5 rounded text-[11px] mr-1">
                            {i.variantName} × {i.quantity}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 font-bold text-zinc-950">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          EventBridge Dispatched
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(ord.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
