import { NextRequest, NextResponse } from "next/server";
import { countryToCurrency, isCurrencyCode, localeToCurrency } from "@/lib/currency";

export async function GET(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    "";

  const explicit = new URL(req.url).searchParams.get("currency");
  if (isCurrencyCode(explicit?.toUpperCase())) {
    return NextResponse.json({
      currency: explicit!.toUpperCase(),
      country,
      source: "query",
    });
  }

  const currency = country
    ? countryToCurrency(country)
    : localeToCurrency(req.headers.get("accept-language"));

  return NextResponse.json(
    { currency, country, source: country ? "edge-geo" : "accept-language" },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
