"use client";

import React, { useState } from "react";
import { X, Lock, Shield, User, ArrowRight, Crown, Sparkles, UserPlus } from "lucide-react";
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
  const [email, setEmail] = useState("owner@ancwave.com");
  const [password, setPassword] = useState("ownerpassword123");
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
          title: "Account Created (role: user)",
          description: `Welcome, ${name}! Your account has been registered with role='user'. You can promote it to 'owner' directly in MongoDB Atlas.`,
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
    }
  };

  const fillQuickOwner = () => {
    setAuthModalTab("signin");
    setEmail("owner@ancwave.com");
    setPassword("ownerpassword123");
  };

  const fillQuickAdmin = () => {
    setAuthModalTab("signin");
    setEmail("admin@ancwave.com");
    setPassword("adminpassword123");
  };

  const fillQuickCustomer = () => {
    setAuthModalTab("signin");
    setEmail("alex@example.com");
    setPassword("password123");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              {authModalTab === "signin" ? (
                <Lock className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 font-sans tracking-tight">
                {authModalTab === "signin" ? "Sign In to ancwave" : "Create ancwave Account"}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {authModalTab === "signin"
                  ? "Access your audio profile & operations console"
                  : "Sign up as user · MongoDB Atlas root role compatible"}
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
            Sign Up (role: user)
          </button>
        </div>

        {/* Quick Demo Credentials Switcher (Only in sign in mode) */}
        {authModalTab === "signin" && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Quick 1-Click Demo Accounts:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={fillQuickOwner}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-[11px] font-semibold hover:bg-amber-100 transition-colors text-center"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Owner</span>
              </button>
              <button
                type="button"
                onClick={fillQuickAdmin}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-[11px] font-semibold hover:bg-blue-100 transition-colors text-center"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={fillQuickCustomer}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-[11px] font-semibold hover:bg-zinc-100 transition-colors text-center"
              >
                <User className="w-3.5 h-3.5 text-zinc-600" />
                <span>Customer</span>
              </button>
            </div>
          </div>
        )}

        {/* MongoDB Atlas Instruction Note for Signup */}
        {authModalTab === "signup" && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Owner Setup Workflow</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              When you sign up here, your account is saved with{" "}
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">
                role: &quot;user&quot;
              </code>
              . You can open MongoDB Atlas, find your document, and change{" "}
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">
                role
              </code>{" "}
              to{" "}
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">
                &quot;owner&quot;
              </code>{" "}
              to unlock full root authority.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-zinc-50/50"
                placeholder="Marcus Vance"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-zinc-50/50"
              placeholder={authModalTab === "signup" ? "your-email@company.com" : "owner@ancwave.com"}
            />
          </div>

          <div className="space-y-1">
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 mt-2"
          >
            <span>
              {isSubmitting
                ? "Processing..."
                : authModalTab === "signup"
                ? "Create Account (role: user)"
                : "Sign In"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-zinc-400 text-center">
          Secured via JWT with MongoDB Atlas persistence & 24h operational day-token gates.
        </p>
      </div>
    </div>
  );
}
