"use client";

import React, { useState } from "react";
import { X, Lock, UserPlus, ArrowRight, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    signup,
    authModalTab,
    setAuthModalTab,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authModalTab === "signup") {
      if (!name.trim()) {
        toast({ type: "error", title: "Name Required", description: "Please enter your full name." });
        setIsSubmitting(false);
        return;
      }
      const result = await signup(email, password, name);
      setIsSubmitting(false);

      if (result.success) {
        toast({
          type: "success",
          title: "Account Created",
          description: `Welcome to ancwave, ${name}! Your account is ready.`,
        });
        setIsAuthModalOpen(false);
      } else {
        toast({
          type: "error",
          title: "Registration Failed",
          description: result.error || "Please check your inputs.",
        });
      }
    } else {
      const result = await login(email, password);
      setIsSubmitting(false);

      if (result.success) {
        toast({
          type: "success",
          title: "Welcome Back",
          description: `Successfully signed in as ${email}`,
        });
        setIsAuthModalOpen(false);
      } else {
        toast({
          type: "error",
          title: "Login Failed",
          description: result.error || "Please check your email and password.",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white">
              {authModalTab === "signin" ? (
                <Lock className="w-5 h-5 text-blue-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 font-sans tracking-tight">
                {authModalTab === "signin" ? "Sign In to ancwave" : "Create ancwave Account"}
              </h3>
              <p className="text-xs text-zinc-500">
                {authModalTab === "signin"
                  ? "Access your saved audio profiles & order tracking"
                  : "Join ancwave for member pricing & fast express checkout"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthModalTab("signin")}
            className={`py-2 rounded-lg transition-all ${
              authModalTab === "signin"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab("signup")}
            className={`py-2 rounded-lg transition-all ${
              authModalTab === "signup"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Customer Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalTab === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 transition-all bg-zinc-50/50"
                placeholder="Alex Morgan"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 transition-all bg-zinc-50/50"
              placeholder="alex@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 transition-all bg-zinc-50/50"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 mt-2"
          >
            <span>
              {isSubmitting
                ? "Processing..."
                : authModalTab === "signup"
                ? "Create Account"
                : "Sign In"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>256-bit Encrypted Checkout & Account Protection</span>
        </div>
      </div>
    </div>
  );
}
