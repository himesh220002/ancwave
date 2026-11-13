import { DEFAULT_USD_TO_INR_RATE } from "@/types";

export type CurrencyCode = "USD" | "INR";

export const USD_TO_INR = DEFAULT_USD_TO_INR_RATE;

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "USD" || value === "INR";
}

export function countryToCurrency(country?: string | null): CurrencyCode {
  const code = (country || "").toUpperCase();
  if (code === "IN") return "INR";
  return "USD";
}

export function localeToCurrency(locale?: string | null): CurrencyCode {
  const value = (locale || "").toLowerCase();
  return value.includes("-in") || value.includes("hi") ? "INR" : "USD";
}

export function timezoneToCurrency(timezone?: string | null): CurrencyCode {
  return (timezone || "").toLowerCase().includes("kolkata") ? "INR" : "USD";
}

export function toInr(usd: number, inr?: number | null): number {
  if (typeof inr === "number" && Number.isFinite(inr) && inr > 0) return inr;
  return Math.round(usd * USD_TO_INR);
}

export function formatCurrency(
  amountUsd: number,
  currency: CurrencyCode,
  amountInr?: number | null
): string {
  if (currency === "INR") {
    const value = toInr(amountUsd, amountInr);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd);
}
