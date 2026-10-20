import { ProductData, Order, AWSEventLog, Review } from "@/types";

export const initialProductData: ProductData = {
  id: "form-01",
  name: "Form 01",
  model: "WIRELESS OVER-EAR",
  category: "Audio / Over-Ear",
  tagline: "Less noise. More you.",
  description:
    "Meet Form 01. Beautifully balanced sound, adaptive silence, and a lighter way to get lost in what you love.",
  price: 349,
  originalPrice: 399,
  activeDiscount: 0,
  stock: 4, // Initial stock is 4, triggering "🔥 Few left!" alert
  lowStockThreshold: 5,
  isFlashSale: true,
  warrantyYears: 2,
  returnDays: 30,
  deliveryEstimate: "Ready to ship · US delivery in 3–5 business days",
  variants: [
    {
      id: "silver",
      name: "Silver mist",
      hex: "#C4C8D0",
      borderHex: "#949DAA",
      image: "/images/hero-silver.jpg",
      tag: "01",
    },
    {
      id: "graphite",
      name: "Graphite",
      hex: "#22252A",
      borderHex: "#111215",
      image: "/images/hero-graphite.jpg",
      tag: "02",
    },
    {
      id: "sandstone",
      name: "Sandstone",
      hex: "#D6C4A6",
      borderHex: "#B8A27E",
      image: "/images/hero-sandstone.jpg",
      tag: "03",
    },
  ],
  specs: {
    dimensionsMetric: "190 × 175 × 80 mm",
    dimensionsImperial: "7.5 × 6.9 × 3.1 in",
    weightMetric: "256 g",
    weightImperial: "9.0 oz",
    batteryLife: "Up to 40 hours · ANC on",
    charging: "USB-C · 2 h full / 10 min for 5 h",
    driver: "40 mm dynamic · 20 Hz–20 kHz",
    noiseControl: "Adaptive ANC + transparency · 8 mics",
    connectivity: "Bluetooth 5.3 · multipoint · 3.5 mm",
    codecs: "AAC / SBC / LDAC",
    materials: "Aluminum · woven textile · memory foam",
    inTheBox:
      "Form 01, travel case, USB-C charging cable, 3.5 mm cable. Battery estimates vary with volume and use.",
  },
  metrics: {
    playtime: "40 h",
    driverSize: "40 mm",
    weight: "256 g",
    bluetooth: "Bluetooth 5.3",
  },
  lastRevalidatedAt: "2026-10-20T12:00:00.000Z",
};

export const sampleReviews: Review[] = [
  {
    id: "rev-1",
    author: "Maya R.",
    role: "Designer · Silver mist",
    initials: "MR",
    variant: "Silver mist",
    rating: 5,
    comment:
      "“The world gets quieter, but the music opens up. These are the first things I reach for when I need a little space.”",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Theo L.",
    role: "Photographer · Graphite",
    initials: "TL",
    variant: "Graphite",
    rating: 5,
    comment:
      "“Beautifully simple. The dial feels right, the fit is effortless, and I can settle into a full afternoon of editing.”",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Nina K.",
    role: "Architect · Sandstone",
    initials: "NK",
    variant: "Sandstone",
    rating: 5,
    comment:
      "“A small ritual that changes my commute. Warm sound, lovely materials, and no pressure to take them off.”",
    verified: true,
  },
];

// In-Memory store for fast fallback & caching demonstration
class AncWaveStore {
  private product: ProductData = { ...initialProductData };
  private orders: Order[] = [];
  private eventLogs: AWSEventLog[] = [];

  constructor() {
    // Seed an initial event log to showcase AWS EventBridge integration
    this.eventLogs.push({
      id: "ev-init-01",
      eventId: "eb-init-bootstrap",
      source: "aws.eventbridge.ancwave",
      detailType: "SystemBootstrap",
      timestamp: "2026-10-20T12:00:00.000Z",
      detail: {
        environment: "production-edge",
        edgeRegion: "us-east-1",
        cacheStrategy: "Next.js ISR + CloudFront Cache-Control: max-age=3600, s-maxage=86400",
        message: "ancwave catalog cache warmed at edge",
      },
      lambdaExecution: {
        status: "SUCCEEDED",
        durationMs: 42,
        logStream: "/aws/lambda/ancwave-cache-worker/2026/10/20/[$LATEST]49a",
      },
      revalidationStatus: {
        revalidatedPath: "/",
        tags: ["product-details", "stock-inventory"],
        status: "SUCCESS",
      },
    });
  }

  getProduct(): ProductData {
    return { ...this.product };
  }

  updateStock(newStock: number, activeDiscount?: number): ProductData {
    this.product.stock = Math.max(0, newStock);
    if (activeDiscount !== undefined) {
      this.product.activeDiscount = activeDiscount;
    }
    this.product.lastRevalidatedAt = new Date().toISOString();
    return { ...this.product };
  }

  reduceStock(quantity: number): { product: ProductData; previousStock: number } {
    const previousStock = this.product.stock;
    this.product.stock = Math.max(0, this.product.stock - quantity);
    this.product.lastRevalidatedAt = new Date().toISOString();
    return { product: { ...this.product }, previousStock };
  }

  addOrder(order: Order): Order {
    this.orders.unshift(order);
    return order;
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  logAWSEvent(log: AWSEventLog): AWSEventLog {
    this.eventLogs.unshift(log);
    if (this.eventLogs.length > 50) {
      this.eventLogs = this.eventLogs.slice(0, 50);
    }
    return log;
  }

  getAWSEventLogs(): AWSEventLog[] {
    return [...this.eventLogs];
  }

  resetStore(): void {
    this.product = { ...initialProductData };
  }
}

// Global singleton across hot reloads in dev
const globalStore = global as unknown as { __ancWaveStore?: AncWaveStore };
export const store = globalStore.__ancWaveStore || new AncWaveStore();
if (process.env.NODE_ENV !== "production") {
  globalStore.__ancWaveStore = store;
}
