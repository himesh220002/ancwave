import mongoose from "mongoose";
import fs from "fs";

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      uri = trimmed.substring("MONGODB_URI=".length).replace(/^["']|["']$/g, "");
      break;
    }
  }
}
if (!uri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const hyperxProduct = {
  id: "hyperx-cloudx-stinger-2-core",
  slug: "hyperx-cloudx-stinger-2-core",
  productId: "HYPERX-CLOUDX-STINGER2-CORE",
  name: "HyperX CloudX Stinger 2 Core",
  model: "OFFICIAL XBOX WIRED GAMING HEADSET",
  category: "Audio / Over-Ear",
  categorySlug: "headphones",
  tagline: "Lightweight comfort. Heavyweight gaming audio.",
  description:
    "The HyperX CloudX Stinger 2 Core is an officially licensed Xbox wired gaming headset featuring 40mm directional drivers, a swivel-to-mute microphone, and a lightweight 275g frame.",
  price: 39.99,
  basePrice: 39.99,
  originalPrice: 49.99,
  priceInr: 3499,
  activeDiscount: 0,
  baseDiscount: 0,
  type: "Over-Ear Gaming Headset",
  sku: "6H9B8AA-MASTER",
  stock: 25,
  lowStockThreshold: 5,
  isFlashSale: false,
  warrantyYears: 2,
  returnDays: 30,
  deliveryEstimate: "Ready to ship · US & Global delivery in 2–4 business days",
  rating: 4.8,
  averageRating: 4.8,
  reviewCount: 42,
  globalSpecs: {
    "Brand": "HyperX (HP Inc.)",
    "Model Name": "HyperX CloudX Stinger 2 Core",
    "Part Numbers": "6H9B8AA (Black) / 6H9B7AA (White)",
    "Official Licensing": "Official Xbox Licensed Headset",
    "Platform Compatibility": "Xbox Series X|S, Xbox One, PC, Mobile via 3.5mm",
    "Audio Form Factor": "Over-Ear, Circumaural, Closed-Back",
    "Driver Size & Type": "40mm Dynamic Drivers with Neodymium Magnets",
    "Frequency Response": "10 Hz – 25 kHz",
    "Impedance": "32.5 Ω",
    "Sensitivity": "95 dBSPL/mW at 1 kHz",
    "Total Harmonic Distortion": "≤ 2%",
    "Microphone Type": "Bi-directional Noise-Cancelling Swivel-to-Mute",
    "Mic Element": "Electret Condenser Microphone (-40.5 dBV)",
    "Connectivity": "Wired 3.5mm Audio Jack (4-pole CTIA), 1.3m cable",
    "Weight": "275 g (0.60 lbs)",
    "Frame Material": "Durable Plastic with Adjustable Sliders",
    "Ear Cushion Material": "Soft Foam & Breathable Fabric",
    "Warranty": "2-Year Manufacturer Warranty",
    "Country of Origin": "China",
  },
  specs: {
    dimensionsMetric: "179 × 95 × 195 mm",
    dimensionsImperial: "7.04 × 3.74 × 7.68 in",
    weightMetric: "275 g",
    weightImperial: "0.60 lbs (9.7 oz)",
    batteryLife: "Passive Wired Analog · No Battery Required",
    charging: "No charging required (3.5mm analog connection)",
    driver: "40mm Dynamic Drivers with Neodymium Magnets · 10 Hz–25 kHz",
    noiseControl: "Closed-back passive acoustic seal + Bi-directional mic noise cancellation",
    connectivity: "Wired 3.5mm Audio Jack (4-pole CTIA) · 1.3m non-detachable cable",
    codecs: "Analog Stereo · Windows Sonic & Dolby Atmos Spatial Audio compatible",
    materials: "Durable polymer chassis · Soft foam & breathable fabric ear cushions",
    inTheBox: "HyperX CloudX Stinger 2 Core Headset, Quick Start Guide, 2-Year Warranty Documentation",
  },
  metrics: {
    playtime: "Continuous Wired",
    driverSize: "40 mm",
    weight: "275 g",
    bluetooth: "3.5mm CTIA",
  },
  childVariants: [
    {
      sku: "6H9B8AA",
      color: "Black",
      specOverride: "Official Xbox Wired Edition (Black)",
      variantSpecs: {
        "Color Finish": "Matte Black",
        "Part Number": "6H9B8AA",
      },
      price: 39.99,
      priceInr: 3499,
      discount: 0,
      stock: 15,
      images: [
        "/images/hero-graphite.jpg",
        "/images/feature-dial.jpg",
        "/images/feature-foam.jpg",
      ],
      restockProcess: null,
    },
    {
      sku: "6H9B7AA",
      color: "White",
      specOverride: "Official Xbox Wired Edition (White)",
      variantSpecs: {
        "Color Finish": "Arctic White",
        "Part Number": "6H9B7AA",
      },
      price: 39.99,
      priceInr: 3499,
      discount: 0,
      stock: 10,
      images: [
        "/images/hero-silver.jpg",
        "/images/feature-aluminum.jpg",
        "/images/feature-foam.jpg",
      ],
      restockProcess: null,
    },
  ],
  colorVariants: [
    {
      id: "black",
      name: "Black",
      hex: "#111111",
      borderHex: "#333333",
      image: "/images/hero-graphite.jpg",
      images: [
        "/images/hero-graphite.jpg",
        "/images/feature-dial.jpg",
        "/images/feature-foam.jpg",
      ],
      tag: "01",
      price: 39.99,
      priceInr: 3499,
      stock: 15,
    },
    {
      id: "white",
      name: "White",
      hex: "#ECECEC",
      borderHex: "#999999",
      image: "/images/hero-silver.jpg",
      images: [
        "/images/hero-silver.jpg",
        "/images/feature-aluminum.jpg",
        "/images/feature-foam.jpg",
      ],
      tag: "02",
      price: 39.99,
      priceInr: 3499,
      stock: 10,
    },
  ],
  variants: [
    {
      id: "black",
      name: "Black",
      hex: "#111111",
      borderHex: "#333333",
      image: "/images/hero-graphite.jpg",
      images: [
        "/images/hero-graphite.jpg",
        "/images/feature-dial.jpg",
        "/images/feature-foam.jpg",
      ],
      tag: "01",
      price: 39.99,
      priceInr: 3499,
      stock: 15,
    },
    {
      id: "white",
      name: "White",
      hex: "#ECECEC",
      borderHex: "#999999",
      image: "/images/hero-silver.jpg",
      images: [
        "/images/hero-silver.jpg",
        "/images/feature-aluminum.jpg",
        "/images/feature-foam.jpg",
      ],
      tag: "02",
      price: 39.99,
      priceInr: 3499,
      stock: 10,
    },
  ],
  variantGroups: [
    {
      id: "arch-wired-xbox",
      name: "Official Xbox Wired Edition",
      specOverride: "40mm Dynamic Driver with Swivel-to-Mute Mic",
      price: 39.99,
      discount: 0,
      colors: [
        {
          id: "black",
          sku: "6H9B8AA",
          color: "Black",
          hex: "#111111",
          stock: 15,
          price: 39.99,
          images: [
            "/images/hero-graphite.jpg",
            "/images/feature-dial.jpg",
            "/images/feature-foam.jpg",
          ],
        },
        {
          id: "white",
          sku: "6H9B7AA",
          color: "White",
          hex: "#ECECEC",
          stock: 10,
          price: 39.99,
          images: [
            "/images/hero-silver.jpg",
            "/images/feature-aluminum.jpg",
            "/images/feature-foam.jpg",
          ],
        },
      ],
    },
  ],
  primaryValueCallouts: [
    {
      tag: "OFFICIAL XBOX LICENSED",
      title: "Official Xbox Licensed",
      subtitle: "Xbox Series X|S & Xbox One Plug & Play",
      description:
        "Designed specifically for Xbox Series X|S and Xbox One consoles with plug-and-play 3.5mm controller connectivity.",
    },
    {
      tag: "IMMERSIVE GAME AUDIO",
      title: "Directional 40mm Drivers",
      subtitle: "Enhanced Bass Acoustics & Pinpoint Spatial Clarity",
      description:
        "Closed-cup design paired with directional 40mm drivers tuned for enhanced bass response and immersive game audio.",
    },
    {
      tag: "LIGHTWEIGHT COMFORT",
      title: "275g Lightweight Frame",
      subtitle: "Soft Foam & Breathable Fabric Ear Cushions",
      description:
        "Weighs only 275g with soft foam and breathable fabric ear cushions plus adjustable sliders for marathon gaming sessions.",
    },
    {
      tag: "SWIVEL-TO-MUTE MIC",
      title: "Swivel-to-Mute Mic",
      subtitle: "Bi-directional Noise-Cancelling Boom",
      description:
        "Flexible, bi-directional noise-cancelling boom microphone mutes instantly when flipped upward out of the way.",
    },
    {
      tag: "ONBOARD AUDIO CONTROLS",
      title: "Onboard Audio Controls",
      subtitle: "Direct Ear-cup Volume Adjustment",
      description:
        "Built-in volume controls located directly on the headset earcup eliminate navigating console system menus.",
    },
  ],
  tabbedSpecs: {
    core: [
      { label: "Brand & Manufacturer", value: "HyperX (HP Inc.)" },
      { label: "Model Name", value: "HyperX CloudX Stinger 2 Core" },
      { label: "Part Numbers (MPN / SKU)", value: "6H9B8AA (Black) / 6H9B7AA (White)" },
      { label: "Official Licensing", value: "Official Xbox Licensed Headset", badge: "Licensed" },
      { label: "Form Factor", value: "Over-Ear, Circumaural, Closed-Back" },
      { label: "Driver Size & Type", value: "40mm Dynamic Drivers with Neodymium Magnets" },
      { label: "Frequency Response", value: "10 Hz – 25,000 Hz" },
      { label: "Impedance", value: "32.5 Ω" },
      { label: "Sensitivity", value: "95 dBSPL/mW at 1 kHz" },
      { label: "Total Harmonic Distortion", value: "≤ 2%" },
      { label: "Weight", value: "275 g (0.60 lbs)" },
      { label: "Warranty", value: "2-Year Manufacturer Warranty" },
      { label: "Country of Origin", value: "China" },
    ],
    battery: [
      { label: "Power & Battery", value: "Passive Analog Wired (Zero charging required)", badge: "Always Ready" },
      { label: "Playtime Duration", value: "Unlimited continuous playback via 3.5mm jack" },
      { label: "Headset Cable", value: "1.3m (4.26 ft) non-detachable 3.5mm 4-pole CTIA cable" },
      { label: "Onboard Controls", value: "Direct earcup volume wheel/slider" },
      { label: "Microphone Mute", value: "Physical swivel-to-mute boom switch", badge: "Swivel Mute" },
    ],
    connectivity: [
      { label: "Connectivity Type", value: "Wired Analog (Zero Latency)", badge: "Instant" },
      { label: "Connector", value: "3.5mm Audio Jack (4-pole CTIA)" },
      { label: "Cable Length & Type", value: "1.3m (4.26 ft) non-detachable headset cable" },
      { label: "Platform Compatibility", value: "Xbox Series X|S, Xbox One, PC, PS5, Switch & Mobile" },
      { label: "Audio Profile", value: "Enhanced bass gaming profile with spatial sound compatibility" },
    ],
  },
  qna: [
    {
      id: "q1",
      question: "Will this headset work on PC and PlayStation as well as Xbox?",
      answer:
        "Yes! While it is officially licensed for Xbox Series X|S and Xbox One, its standard 3.5mm 4-pole CTIA connector makes it plug-and-play compatible with PC, Mac, PlayStation 4/5, Nintendo Switch, and mobile devices.",
      author: "HyperX Audio Specialist",
      date: "Nov 2026",
    },
    {
      id: "q2",
      question: "How does the swivel-to-mute microphone work?",
      answer:
        "Simply flip the microphone upward along the ear cup. A physical internal switch automatically mutes the microphone with a tactile click, so you never have to fumble with cables or buttons.",
      author: "HyperX Audio Specialist",
      date: "Nov 2026",
    },
  ],
  mediaGallery: [
    {
      id: "m-hero",
      url: "/images/hero-graphite.jpg",
      alt: "HyperX CloudX Stinger 2 Core Black View",
      type: "hero",
      label: "Studio View (Black)",
    },
    {
      id: "m-white",
      url: "/images/hero-silver.jpg",
      alt: "HyperX CloudX Stinger 2 Core White View",
      type: "hero",
      label: "Studio View (White)",
    },
    {
      id: "m-dial",
      url: "/images/feature-dial.jpg",
      alt: "Onboard Volume Wheel Controls",
      type: "macro",
      label: "Volume Wheel Macro",
    },
    {
      id: "m-cushion",
      url: "/images/feature-foam.jpg",
      alt: "Breathable Fabric Ear Cushions",
      type: "macro",
      label: "Breathable Fabric",
    },
  ],
  lastRevalidatedAt: new Date().toISOString(),
};

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  const conn = await mongoose.connect(uri);
  const testDb = conn.connection.useDb("test");
  const ancDb = conn.connection.useDb("ancwaveDB");

  // 1. Sync orders from test to ancwaveDB if ancwaveDB has 0 orders
  const ancOrderCount = await ancDb.collection("orders").countDocuments();
  if (ancOrderCount === 0) {
    const testOrders = await testDb.collection("orders").find({}).toArray();
    if (testOrders.length > 0) {
      console.log(`Syncing ${testOrders.length} orders from test to ancwaveDB...`);
      await ancDb.collection("orders").insertMany(testOrders);
      console.log("Orders synced successfully.");
    }
  } else {
    console.log(`ancwaveDB already has ${ancOrderCount} orders.`);
  }

  // 2. Sync products from test into ancwaveDB (exclude form-01 to avoid overwriting)
  const testProducts = await testDb.collection("products").find({ slug: { $ne: "form-01" } }).toArray();
  for (const prod of testProducts) {
    const existing = await ancDb.collection("products").findOne({ slug: prod.slug });
    if (!existing) {
      console.log(`Copying product '${prod.slug}' from test into ancwaveDB...`);
      await ancDb.collection("products").insertOne(prod);
    } else {
      console.log(`Product '${prod.slug}' already exists in ancwaveDB.`);
    }
  }

  // 3. Upsert HyperX CloudX Stinger 2 Core into ancwaveDB
  console.log("Upserting HyperX CloudX Stinger 2 Core into ancwaveDB...");
  const res = await ancDb.collection("products").findOneAndUpdate(
    { $or: [{ slug: "hyperx-cloudx-stinger-2-core" }, { productId: "HYPERX-CLOUDX-STINGER2-CORE" }, { slug: "hyperx-cloud-stinger-2-core" }] },
    { $set: hyperxProduct },
    { upsert: true, returnDocument: "after" }
  );
  console.log("HyperX Product Upserted:", res?.slug || hyperxProduct.slug);

  // 4. Verification
  const totalAncProducts = await ancDb.collection("products").find({}, { projection: { slug: 1, name: 1, stock: 1 } }).toArray();
  console.log("\nCurrent products in ancwaveDB:");
  for (const p of totalAncProducts) {
    console.log(`- ${p.slug}: ${p.name} (Stock: ${p.stock})`);
  }

  const finalOrderCount = await ancDb.collection("orders").countDocuments();
  console.log(`\nTotal orders in ancwaveDB: ${finalOrderCount}`);

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
