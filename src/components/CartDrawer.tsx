"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Truck, RotateCcw, ShieldCheck, ArrowUpRight, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    total,
    recentAddedFlash,
    setRecentAddedFlash,
  } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };
    if (isCartOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          {/* Header matching Screenshot 6 */}
          <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                Your bag
              </h2>
              {totalItemsCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-black transition-colors"
              aria-label="Close bag"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Item Body matching Screenshot 6 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Flash Alert Banner matching Screenshot 6 */}
            {recentAddedFlash && (
              <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-100 flex items-center justify-between text-blue-700 text-xs font-medium animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>A little more you. Added to your bag.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecentAddedFlash(false)}
                  className="text-blue-400 hover:text-blue-700 p-0.5 rounded transition-colors"
                  aria-label="Dismiss message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-zinc-400 text-xs">Your bag is currently empty.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg"
                >
                  Explore Form 01
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variant}-${item.component || "std"}`}
                  className="flex gap-4 pb-6 border-b border-zinc-100"
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-18 h-18 rounded-xl bg-[#F0EFEA] p-1 shrink-0 overflow-hidden border border-zinc-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-[#111111] text-xs sm:text-sm truncate">
                          {item.name}
                        </h3>
                        <span className="font-semibold text-[#111111] text-xs shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      {item.component && (
                        <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100">
                          {item.component}
                        </span>
                      )}
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-600 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0"></span>
                        <span className="truncate">{item.variantName} · {item.fit}</span>
                      </div>
                    </div>

                    {/* Quantity counter [- 1 +] and Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variant, -1, item.component)
                          }
                          className="px-2 py-0.5 text-zinc-500 hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 text-xs font-medium text-zinc-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variant, 1, item.component)
                          }
                          className="px-2 py-0.5 text-zinc-500 hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.variant, item.component)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-800 underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Shipping Info matching Screenshot 6 */}
            {items.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-[#111111]">
                    At your door in 3–5 business days.
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Standard US shipping · {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Included Accessories matching Screenshot 6 */}
            {items.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  GOOD THINGS, INCLUDED
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Travel case, USB-C charging cable and 3.5 mm cable. Everything you need to tune in.
                </p>
              </div>
            )}
          </div>

          {/* Checkout Footer matching Screenshot 6 */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-zinc-100 bg-[#FAFAFA] space-y-3 sm:space-y-4">
              <div className="space-y-1 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#111111] font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard shipping</span>
                  <span className="text-[#111111] font-medium">
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax - Oregon</span>
                  <span className="text-[#111111] font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-[#111111]">
                  <span>Estimated total</span>
                  <span className="text-xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button: Proceed to checkout */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium text-xs sm:text-sm transition-all shadow-xs"
              >
                <span>Proceed to checkout · ${total.toFixed(2)}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
              </Link>

              <p className="text-[11px] text-zinc-400 text-center">
                Your total at checkout is ${total.toFixed(2)}, including delivery.
              </p>

              <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-1">
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> 30-day returns
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 2-year warranty
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
