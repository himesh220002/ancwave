"use client";

import React, { useState } from "react";
import { X, Lock, Shield, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toaster";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login } = useAuth();
  const [email, setEmail] = useState("admin@ancwave.com");
  const [password, setPassword] = useState("adminpassword123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        type: "success",
        title: "Authenticated Successfully",
        description: `Welcome back, ${email}`,
      });
      setIsAuthModalOpen(false);
    } else {
      toast({
        type: "error",
        title: "Login Failed",
        description: result.error || "Please check your credentials.",
      });
    }
  };

  const fillQuickAdmin = () => {
    setEmail("admin@ancwave.com");
    setPassword("adminpassword123");
  };

  const fillQuickCustomer = () => {
    setEmail("alex@example.com");
    setPassword("password123");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-zinc-950 font-sans">
              Sign In to ancwave
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Credentials Switcher */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase">
            Quick One-Click Demo Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillQuickAdmin}
              className="flex items-center gap-1.5 p-2 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors text-left"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Admin Role</span>
            </button>
            <button
              type="button"
              onClick={fillQuickCustomer}
              className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span>Customer Role</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-zinc-50/50"
              placeholder="admin@ancwave.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-zinc-50/50"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In with JWT"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-zinc-400 text-center">
          Encrypted via JSON Web Tokens with 7-day expiration & MongoDB Atlas support.
        </p>
      </div>
    </div>
  );
}
