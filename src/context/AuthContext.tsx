"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isOwner: boolean;
  isLoading: boolean;
  isDayTokenVerified: boolean;
  dayTokenExpiresAt: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    adminPasscode?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyDayPasscode: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  lockDashboard: () => Promise<void>;
  checkDayToken: () => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: "signin" | "signup";
  setAuthModalTab: (tab: "signin" | "signup") => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const [isDayTokenVerified, setIsDayTokenVerified] = useState(false);
  const [dayTokenExpiresAt, setDayTokenExpiresAt] = useState<number | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkDayToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/verify-passcode");
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.payload) {
          setIsDayTokenVerified(true);
          return true;
        }
      }
      setIsDayTokenVerified(false);
      return false;
    } catch {
      setIsDayTokenVerified(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
    checkDayToken();
  }, [checkAuth, checkDayToken]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        checkDayToken();
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    adminPasscode?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, adminPasscode }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "Signup failed" };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
      setUser(null);
      setIsDayTokenVerified(false);
      setDayTokenExpiresAt(null);
    } catch {
      setUser(null);
      setIsDayTokenVerified(false);
    }
  };

  const verifyDayPasscode = async (
    passcode: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDayTokenVerified(true);
        if (data.expiresAt) {
          setDayTokenExpiresAt(data.expiresAt);
        }
        if (data.user) {
          setUser(data.user);
        }
        return { success: true };
      }
      return { success: false, error: data.error || "Invalid daily operations passcode" };
    } catch {
      return { success: false, error: "Network error during passcode validation" };
    }
  };

  const lockDashboard = async () => {
    try {
      await fetch("/api/admin/verify-passcode", { method: "DELETE" });
    } catch {
      // ignore
    } finally {
      setIsDayTokenVerified(false);
      setDayTokenExpiresAt(null);
    }
  };

  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isOwner,
        isLoading,
        isDayTokenVerified,
        dayTokenExpiresAt,
        login,
        signup,
        logout,
        verifyDayPasscode,
        lockDashboard,
        checkDayToken,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
