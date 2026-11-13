"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CurrencyCode,
  formatCurrency,
  isCurrencyCode,
  localeToCurrency,
  timezoneToCurrency,
} from "@/lib/currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  format: (amountUsd: number, amountInr?: number | null) => string;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    let active = true;
    let resolved = false;

    const apply = (next: CurrencyCode) => {
      if (!active) return;
      setCurrencyState(next);
      resolved = true;
    };

    try {
      const urlCurrency = new URLSearchParams(window.location.search).get("currency");
      if (isCurrencyCode(urlCurrency?.toUpperCase())) {
        apply(urlCurrency!.toUpperCase() as CurrencyCode);
      }

      if (!resolved) {
        const saved = readCookie("ancwave_currency") || window.localStorage.getItem("ancwave_currency");
        if (isCurrencyCode(saved?.toUpperCase())) {
          apply(saved!.toUpperCase() as CurrencyCode);
        }
      }

      if (!resolved) {
        const localeCurrency = localeToCurrency(
          navigator.languages?.[0] || navigator.language
        );
        const timezoneCurrency = timezoneToCurrency(
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );
        if (localeCurrency === "INR" || timezoneCurrency === "INR") {
          apply("INR");
        }
      }
    } catch {
      // Keep the safe USD default.
    }

    // Ask the server for the edge/geo country when it is available. This is
    // deliberately a post-hydration request so the page shell is never blocked.
    if (!resolved) {
      fetch("/api/currency", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && !resolved && isCurrencyCode(data?.currency)) {
            apply(data.currency);
          }
        })
        .catch(() => {
          // Keep the safe USD default.
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    writeCookie("ancwave_currency", next);
    try {
      window.localStorage.setItem("ancwave_currency", next);
    } catch {
      // ignore
    }
  }, []);

  const format = useCallback(
    (amountUsd: number, amountInr?: number | null) =>
      formatCurrency(amountUsd, currency, amountInr),
    [currency]
  );

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "USD" ? "INR" : "USD");
  }, [currency, setCurrency]);

  const value = useMemo(
    () => ({ currency, setCurrency, format, toggleCurrency }),
    [currency, setCurrency, format, toggleCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

/** A price that reserves horizontal space so a detected currency never shifts the layout. */
export function CurrencyPrice({
  usd,
  inr,
  className = "",
  reserve = false,
}: {
  usd: number;
  inr?: number | null;
  className?: string;
  reserve?: boolean;
}) {
  const { format, currency } = useCurrency();
  return (
    <span
      suppressHydrationWarning
      data-currency={currency}
      className={`inline-block whitespace-nowrap tabular-nums ${reserve ? "min-w-[6.5rem] text-right" : ""} ${className}`}
    >
      {format(usd, inr)}
    </span>
  );
}
