import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/Toaster";

import { AuthModal } from "@/components/AuthModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ancwave.com"),
  title: "ancwave / FORM 01 — Wireless Over-Ear Active Noise Cancelling",
  description:
    "Meet Form 01. Beautifully balanced sound, adaptive silence, and honest Scandinavian materials. Powered by Next.js, MongoDB, and AWS.",
  keywords: [
    "ancwave",
    "Form 01",
    "noise cancelling headphones",
    "ANC",
    "high fidelity audio",
    "scandinavian design",
  ],
  openGraph: {
    title: "ancwave / FORM 01 — Less noise. More you.",
    description:
      "Precision dynamic drivers, 40 hours of playtime, and slow-recovery memory foam.",
    images: ["/images/hero-silver.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#FBFBFA] text-[#18181B] antialiased selection:bg-blue-600 selection:text-white font-sans">
        <AuthProvider>
          <CartProvider>
            {children}
            <AuthModal />
            <Toaster />
          </CartProvider>
        </AuthProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
