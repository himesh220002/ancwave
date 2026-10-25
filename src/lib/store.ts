import {
  ProductData,
  Order,
  AWSEventLog,
  Review,
  IVariant,
  IProduct,
  IReview,
  IVariantGroup,
  IVariantColor,
  ShippingSettings,
  childVariantsToVariantGroups,
  variantGroupsToChildVariants,
} from "@/types";

export const initialProductData: ProductData = {
  id: "form-01",
  slug: "form-01",
  productId: "ANC-FORM-01",
  categorySlug: "headphones",
  name: "Form 01",
  model: "WIRELESS OVER-EAR",
  category: "Audio / Over-Ear",
  tagline: "Less noise. More you.",
  description:
    "Meet Form 01. Beautifully balanced sound, adaptive silence, and a lighter way to get lost in what you love.",
  price: 349,
  basePrice: 349,
  originalPrice: 399,
  activeDiscount: 0,
  baseDiscount: 0,
  type: "Over-Ear Headphones",
  stock: 4, // Initial stock is 4, triggering "🔥 Few left!" alert
  lowStockThreshold: 5,
  isFlashSale: true,
  warrantyYears: 2,
  returnDays: 30,
  deliveryEstimate: "Ready to ship · US delivery in 3–5 business days",
  rating: 4.9,
  averageRating: 4.9,
  reviewCount: 128,
  sku: "FORM-01-ANC",
  isTws: false,
  globalSpecs: {
    "Acoustic Architecture": "40 mm Bio-Cellulose Transducer",
    "ANC Attenuation": "-42 dB Vector Adaptive ANC",
    "Clamping Force": "4.2 N Ergonomic Equilibrium",
    "Battery Runtime": "38 Hours (ANC On)",
    "Bluetooth": "5.4 LE Audio / LC3 & LDAC",
    "Weight": "242 grams",
    "Fast Charging": "10 min = 5 hours playback",
  },
  childVariants: [
    {
      sku: "ANC-FORM01-SILVER-BOOM",
      color: "Silver mist",
      specOverride: "Detachable Boom Microphone",
      price: 349,
      discount: 0,
      stock: 4,
      images: [
        "/images/hero-silver.jpg",
        "/images/feature-aluminum.jpg",
        "/images/feature-dial.jpg",
        "/images/lifestyle-workspace.jpg",
      ],
    },
    {
      sku: "ANC-FORM01-GRAPHITE-INT",
      color: "Graphite",
      specOverride: "Integrated Dual Beamforming Mic",
      price: 349,
      discount: 0,
      stock: 6,
      images: [
        "/images/hero-graphite.jpg",
        "/images/feature-foam.jpg",
        "/images/lifestyle-city.jpg",
        "/images/exploded-assembly.jpg",
      ],
    },
    {
      sku: "ANC-FORM01-SANDSTONE-STUDIO",
      color: "Sandstone",
      specOverride: "Dual Studio MEMS Mic Array",
      price: 369,
      discount: 0,
      stock: 2,
      images: [
        "/images/hero-sandstone.jpg",
        "/images/checkout-floating.jpg",
        "/images/lifestyle-cafe.jpg",
        "/images/feature-dial.jpg",
      ],
    },
  ],
  variants: [
    {
      id: "silver",
      name: "Silver mist",
      hex: "#C4C8D0",
      borderHex: "#949DAA",
      image: "/images/hero-silver.jpg",
      images: [
        "/images/hero-silver.jpg",
        "/images/feature-aluminum.jpg",
        "/images/feature-dial.jpg",
        "/images/lifestyle-workspace.jpg",
      ],
      tag: "01",
    },
    {
      id: "graphite",
      name: "Graphite",
      hex: "#22252A",
      borderHex: "#111215",
      image: "/images/hero-graphite.jpg",
      images: [
        "/images/hero-graphite.jpg",
        "/images/feature-foam.jpg",
        "/images/lifestyle-city.jpg",
        "/images/exploded-assembly.jpg",
      ],
      tag: "02",
    },
    {
      id: "sandstone",
      name: "Sandstone",
      hex: "#D6C4A6",
      borderHex: "#B8A27E",
      image: "/images/hero-sandstone.jpg",
      images: [
        "/images/hero-sandstone.jpg",
        "/images/checkout-floating.jpg",
        "/images/lifestyle-cafe.jpg",
        "/images/feature-dial.jpg",
      ],
      tag: "03",
    },
  ],
  mediaGallery: [
    {
      id: "m-hero",
      url: "/images/hero-silver.jpg",
      alt: "Form 01 Wireless Over-Ear in Silver Mist",
      type: "hero",
      label: "Studio View",
    },
    {
      id: "m-macro",
      url: "/images/feature-aluminum.jpg",
      alt: "Form 01 CNC-milled aluminum gimbal and ear cup finish",
      type: "macro",
      label: "Precision Macro",
    },
    {
      id: "m-life",
      url: "/images/lifestyle-workspace.jpg",
      alt: "Form 01 in minimalist architectural studio",
      type: "lifestyle",
      label: "In-Use Lifestyle",
    },
    {
      id: "m-exploded",
      url: "/images/exploded-assembly.jpg",
      alt: "Form 01 internal acoustic architecture",
      type: "360",
      label: "Acoustic X-Ray",
    },
  ],
  primaryValueCallouts: [
    {
      tag: "ADAPTIVE SILENCE",
      title: "-42 dB Adaptive ANC",
      subtitle: "8-Microphone Realtime Vector Processing",
      description:
        "Dual inward and outward MEMS microphones calculate ambient pressure 48,000 times per second, attenuating low-end rumblings without ear-drum fatigue.",
    },
    {
      tag: "ERGONOMIC CALIBRATION",
      title: "4.2 N Clamping Equilibrium",
      subtitle: "Engineered Memory Foam & Woven Canopy",
      description:
        "Balanced force distribution prevents temporal bone fatigue. Designed for marathon 8-hour mixing sessions and transatlantic flights without hot spots.",
    },
    {
      tag: "TRANSDUCER ACOUSTICS",
      title: "40 mm Bio-Cellulose Drivers",
      subtitle: "Sub-0.08% Total Harmonic Distortion",
      description:
        "Ultra-stiff natural fiber cones deliver lightning-fast transient response, open treble clarity, and visceral, resonant bass definition.",
    },
  ],
  explodedView: {
    image: "/images/exploded-assembly.jpg",
    badge: "PRECISION ARCHITECTURE",
    caption: "Exploded engineering diagram of the Form 01 acoustic suspension chamber.",
    callouts: [
      {
        number: "01",
        title: "Acoustic Tuning Cavity",
        description: "Bass port ducting tuned to 18 Hz resonance for organic sub-bass.",
      },
      {
        number: "02",
        title: "40 mm Bio-Cellulose Cone",
        description: "High-rigidity natural diaphragm with neodymium N52 magnetic motor.",
      },
      {
        number: "03",
        title: "Quad MEMS ANC Matrix",
        description: "Feedforward and feedback sensors for instant anti-phase synthesis.",
      },
      {
        number: "04",
        title: "Rotary Dampened Knurled Dial",
        description: "Tactile stepless volume encoder milled from aircraft-grade 6000-series alloy.",
      },
    ],
  },
  tabbedSpecs: {
    core: [
      { label: "Driver Size & Type", value: "40 mm Dynamic Bio-Cellulose cone with N52 Neodymium magnet" },
      { label: "Frequency Response", value: "10 Hz – 40,000 Hz (Hi-Res Certified)" },
      { label: "Total Harmonic Distortion", value: "< 0.08% @ 1 kHz, 100 dB SPL" },
      { label: "Clamping Force", value: "4.2 N (Optimized pressure dispersal)", badge: "Over-Ear Spec" },
      { label: "Passive Noise Isolation", value: "-24 dB physical attenuation with memory foam seal" },
      { label: "Water Resistance", value: "IPX4 splash & moisture resistant" },
      { label: "Weight", value: "256 g (9.0 oz)" },
    ],
    battery: [
      { label: "Playtime (ANC On)", value: "Up to 40 hours continuous playback", badge: "Class Leading" },
      { label: "Playtime (ANC Off)", value: "Up to 55 hours continuous playback" },
      { label: "Fast Charge Metric", value: "10 minutes USB-C = 5 hours listening time" },
      { label: "Full Charge Duration", value: "110 minutes from 0% to 100%" },
      { label: "Charging Interface", value: "USB-C with Power Delivery protocol support" },
      { label: "Battery Cell Type", value: "Integrated high-density Lithium-ion Polymer (820 mAh)" },
    ],
    connectivity: [
      { label: "Bluetooth Protocol", value: "Bluetooth 5.3 (LE Audio ready)", badge: "Low Latency" },
      { label: "Multipoint Pairing", value: "Simultaneous 2-device active handoff (laptop + smartphone)" },
      { label: "Audio Codecs Supported", value: "LDAC (24-bit/96kHz), AAC, SBC" },
      { label: "Wired Analog Input", value: "3.5 mm gold-plated auxiliary audio jack (cable included)" },
      { label: "Gaming Low-Latency Mode", value: "48 ms ultra-low delay synchronization" },
      { label: "Companion Console", value: "ancwave Web EQ & custom spatial audio configuration" },
    ],
  },
  hygienePolicy: {
    title: "Over-Ear Acoustic Comfort & Hygiene Assurance",
    badge: "HYGIENE & RETURN POLICY",
    description:
      "Form 01 ear pads feature breathable memory foam covered in woven textile. For your peace of mind and strict personal hygiene hygiene standards, every unit is delivered in a hermetically sealed factory barrier.",
    exemptionNotice:
      "Enjoy a 30-day home trial. Items returned in original factory condition with tamper-evident seal intact qualify for full 100% refund.",
  },
  qna: [
    {
      id: "q1",
      question: "Can I connect Form 01 to both my MacBook and iPhone simultaneously?",
      answer:
        "Yes! Bluetooth 5.3 Multipoint enables seamless zero-latency handoff. If you are watching a video on your laptop and a phone call comes in, Form 01 automatically pauses the laptop and answers the call.",
      author: "ancwave Engineering",
      date: "Oct 2026",
    },
    {
      id: "q2",
      question: "Can I replace the ear cushions if they wear down after years of use?",
      answer:
        "Yes, our ear cups attach via magnetic precision detents. Replacement pads in textile, vegan leather, or shearling can be swapped in 5 seconds.",
      author: "ancwave Customer Care",
      date: "Oct 2026",
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

export const earbudProductData: ProductData = {
  id: "form-air-tws",
  slug: "form-air-tws",
  productId: "ANC-AIR-TWS",
  categorySlug: "earbuds",
  name: "Form Air TWS",
  model: "TRUE WIRELESS STEREO",
  category: "Audio / True Wireless",
  tagline: "Weightless acoustics. Pure transparency.",
  description:
    "Ultra-compact true wireless earbuds with custom 11 mm graphene drivers, Qi wireless fast-charging case, and modular fractional replacement support.",
  price: 199,
  basePrice: 199,
  originalPrice: 229,
  activeDiscount: 0,
  baseDiscount: 0,
  type: "TWS Earbuds",
  stock: 12,
  lowStockThreshold: 5,
  isFlashSale: false,
  warrantyYears: 2,
  returnDays: 30,
  deliveryEstimate: "Ready to ship · Worldwide express delivery in 2–4 days",
  rating: 4.8,
  averageRating: 4.8,
  reviewCount: 94,
  sku: "AIR-TWS-SET",
  isTws: true,
  globalSpecs: {
    "Driver": "11 mm Liquid Silicone Graphene",
    "ANC Attenuation": "-38 dB Hybrid Acoustic Shield",
    "Battery Life": "8 hrs buds / 32 hrs with Qi case",
    "Bluetooth": "5.4 Multi-Point Connect",
    "Water Resistance": "IPX5 Splashproof",
  },
  childVariants: [
    {
      sku: "ANC-AIRTWS-WHITE-QI",
      color: "Polar White",
      specOverride: "Qi Wireless Fast Charging Case",
      price: 199,
      discount: 0,
      stock: 12,
      images: ["/images/earbuds-white.jpg"],
    },
    {
      sku: "ANC-AIRTWS-BLACK-PRO",
      color: "Midnight Black",
      specOverride: "Acoustic Vent Case + Comply Foam Tips",
      price: 219,
      discount: 0,
      stock: 5,
      images: ["/images/earbuds-black.jpg"],
    },
  ],
  twsComponents: [
    {
      id: "full-set",
      label: "Full Set (L + R + Qi Case)",
      description: "Complete pair with wireless charging case & 3 ear-tip sizes",
      sku: "AIR-TWS-SET",
      price: 199,
      originalPrice: 229,
      stock: 12,
    },
    {
      id: "left-bud",
      label: "Left Earbud Only",
      description: "Replacement left earbud with instant NFC pairing sequence",
      sku: "AIR-TWS-L-REP",
      price: 69,
      originalPrice: 85,
      stock: 7,
    },
    {
      id: "right-bud",
      label: "Right Earbud Only",
      description: "Replacement right earbud with instant NFC pairing sequence",
      sku: "AIR-TWS-R-REP",
      price: 69,
      originalPrice: 85,
      stock: 9,
    },
    {
      id: "charging-case",
      label: "Charging Case Only",
      description: "Replacement Qi wireless fast-charging case with USB-C",
      sku: "AIR-TWS-CASE-REP",
      price: 79,
      originalPrice: 95,
      stock: 5,
    },
  ],
  variants: [
    {
      id: "white",
      name: "Polar White",
      hex: "#F5F5F7",
      borderHex: "#D2D2D7",
      image: "/images/earbuds-white.jpg",
      tag: "01",
    },
    {
      id: "black",
      name: "Matte Obsidian",
      hex: "#1E1E22",
      borderHex: "#0D0D10",
      image: "/images/earphones-black.jpg",
      tag: "02",
    },
  ],
  mediaGallery: [
    {
      id: "m-hero-tws",
      url: "/images/earbuds-white.jpg",
      alt: "Form Air TWS in Polar White with wireless charging case",
      type: "hero",
      label: "Studio Set",
    },
    {
      id: "m-macro-tws",
      url: "/images/earbuds-exploded.jpg",
      alt: "Acoustic driver and stem architecture of Form Air TWS",
      type: "macro",
      label: "Acoustic Nozzle",
    },
    {
      id: "m-life-tws",
      url: "/images/lifestyle-cafe.jpg",
      alt: "Form Air TWS in everyday cafe setting",
      type: "lifestyle",
      label: "Lifestyle In-Ear",
    },
    {
      id: "m-360-tws",
      url: "/images/earbuds-white.jpg",
      alt: "360 inspection view of charging case",
      type: "360",
      label: "Case 360",
    },
  ],
  primaryValueCallouts: [
    {
      tag: "FEATHERLIGHT ERGONOMICS",
      title: "4.3 g Zero-Pressure Fit",
      subtitle: "Scanned Across 1,200 Ear Concha Topographies",
      description:
        "Engineered to sit effortlessly in the ear canal without suction discomfort. Custom oval medical-grade silicone ear tips create an airtight seal without ear-canal fatigue.",
    },
    {
      tag: "ACOUSTIC VENTING",
      title: "Equalized Front-Back Cavity",
      subtitle: "Eliminates In-Ear Occlusion & Footstep Thump",
      description:
        "Micro-perforated acoustic barometric vents equalize pressure against your eardrum during walking or running, ensuring natural speech and bass balance.",
    },
    {
      tag: "SPEECH CLARITY",
      title: "6-Mic Beamforming Matrix",
      subtitle: "Bone-Conduction & Wind Noise Suppression",
      description:
        "Aerodynamic intake channels and environmental noise isolation algorithms capture your vocal frequencies crisply even in 25 km/h headwinds.",
    },
  ],
  explodedView: {
    image: "/images/earbuds-exploded.jpg",
    badge: "SUB-MILLIMETER COMPACTNESS",
    caption: "Form Air TWS internal schematic detailing driver, battery cell, and antenna architecture.",
    callouts: [
      {
        number: "01",
        title: "11 mm Graphene Dynamic Driver",
        description: "Laser-tuned acoustic chamber generating crisp highs and resonant sub-bass.",
      },
      {
        number: "02",
        title: "Micro Lithium Coin Cell",
        description: "55 mAh high-energy density cell delivering 8.5 hours continuous earbud playback.",
      },
      {
        number: "03",
        title: "FPC Bluetooth 5.4 Antenna",
        description: "360-degree omnidirectional antenna preventing signal dropouts in congested transit.",
      },
      {
        number: "04",
        title: "Capacitive Force Sensor",
        description: "Stem-pinch gesture control preventing accidental hair or hat touches.",
      },
    ],
  },
  tabbedSpecs: {
    core: [
      { label: "Driver Sizing", value: "11 mm Custom Ultra-Thin Graphene diaphragm" },
      { label: "Frequency Range", value: "15 Hz – 28,000 Hz" },
      { label: "Water & Sweat Rating", value: "IPX5 (Earbuds) / IPX4 (Charging Case)", badge: "Gym Ready" },
      { label: "Earbud Weight", value: "4.3 g per bud (8.6 g pair)", badge: "Ultralight" },
      { label: "Charging Case Weight", value: "39.5 g" },
      { label: "Noise Cancellation", value: "Hybrid Dual-Mic ANC with Realtime Transparency Pass" },
    ],
    battery: [
      { label: "Standalone Playtime (Buds Alone)", value: "8.5 hours continuous (ANC on) / 10 hours (ANC off)", badge: "Per Charge" },
      { label: "Total Playtime with Case", value: "34 hours total listening time", badge: "Case Total" },
      { label: "Fast Charge Metric", value: "10 minutes charge in case = 2.5 hours playtime" },
      { label: "Wireless Charging", value: "Qi-certified wireless charging pad compatible + USB-C" },
      { label: "Case Battery Capacity", value: "520 mAh Lithium-Polymer" },
    ],
    connectivity: [
      { label: "Bluetooth Generation", value: "Bluetooth 5.4 (High Throughput / Low Energy)" },
      { label: "Multipoint Handoff", value: "Simultaneous dual-device pairing (Phone & Computer)" },
      { label: "Audio Codec Support", value: "aptX Lossless, AAC, SBC" },
      { label: "Wear Detection", value: "Infrared proximity sensors with auto-pause/play" },
      { label: "Touch Gestures", value: "Customizable squeeze controls via ancwave audio console" },
    ],
  },
  hygienePolicy: {
    title: "Sanitation Notice & Hygiene Return Policy",
    badge: "HEALTH & HYGIENE POLICY",
    description:
      "True wireless stereo earbuds are intimate in-ear personal products that make direct contact with the ear canal. For personal sanitation, public hygiene, and health regulations, opened or unsealed earbud packages cannot be returned unless verified mechanically defective upon arrival.",
    exemptionNotice:
      "All replacement components (individual left bud, right bud, charging case) are shipped in individual tamper-sealed sterile blister packs.",
  },
  qna: [
    {
      id: "q-tws-1",
      question: "If I lose my right earbud, how do I pair a single replacement bud with my existing set?",
      answer:
        "Simply place your new replacement right bud and your existing left bud into the charging case, hold the pairing button for 10 seconds until the amber light turns blue. They will automatically calibrate and bind as a synchronized stereo pair.",
      author: "ancwave Acoustics Team",
      date: "Oct 2026",
    },
    {
      id: "q-tws-2",
      question: "Does the charging case support magnetic Qi wireless chargers?",
      answer:
        "Yes, the case features an integrated MagSafe-compatible alignment coil that snaps onto standard Qi and Qi2 wireless charging pads.",
      author: "ancwave Customer Care",
      date: "Oct 2026",
    },
  ],
  specs: {
    dimensionsMetric: "24 × 21 × 23 mm (Earbud)",
    dimensionsImperial: "0.94 × 0.82 × 0.90 in",
    weightMetric: "4.3 g per bud",
    weightImperial: "0.15 oz",
    batteryLife: "8.5 h bud / 34 h with Qi case",
    charging: "USB-C + Qi Wireless · 10 min for 2.5 h",
    driver: "11 mm Graphene dynamic · 15 Hz–28 kHz",
    noiseControl: "Hybrid ANC + Realtime Transparency",
    connectivity: "Bluetooth 5.4 · Multipoint · In-ear detect",
    codecs: "aptX Lossless / AAC / SBC",
    materials: "Recycled matte polycarbonate · silicone",
    inTheBox:
      "Form Air TWS (L + R), Qi Wireless Case, S/M/L silicone ear tips, braided USB-C cable.",
  },
  metrics: {
    playtime: "34 h total",
    driverSize: "11 mm",
    weight: "4.3 g",
    bluetooth: "Bluetooth 5.4",
  },
  lastRevalidatedAt: "2026-10-20T12:00:00.000Z",
};

export const earphoneProductData: ProductData = {
  id: "form-pulse-iem",
  slug: "form-pulse-iem",
  productId: "ANC-SPORT-PRO",
  categorySlug: "earphones",
  name: "Form Pulse IEM",
  model: "WIRELESS SPORTS IN-EAR",
  category: "Audio / In-Ear Sports",
  tagline: "Lock in. Never fall out.",
  description:
    "High-performance sports earphones with ErgoLock titanium earhooks, IPX7 submersible waterproofing, and 18-hour endurance battery.",
  price: 149,
  basePrice: 149,
  originalPrice: 179,
  activeDiscount: 0,
  baseDiscount: 0,
  type: "Wireless Earphones",
  stock: 8,
  lowStockThreshold: 5,
  isFlashSale: false,
  warrantyYears: 2,
  returnDays: 30,
  deliveryEstimate: "Ready to ship · Worldwide express delivery in 2–4 days",
  rating: 4.9,
  averageRating: 4.9,
  reviewCount: 62,
  sku: "PULSE-IEM-SPORTS",
  isTws: false,
  globalSpecs: {
    "Driver": "10 mm Diamond Graphene",
    "ANC Isolation": "-30 dB Passive & Active Shield",
    "Battery Life": "18 Hours Continuous",
    "Waterproofing": "IPX7 Submersible",
  },
  childVariants: [
    {
      sku: "ANC-PULSE-BLACK-WING",
      color: "Midnight Black",
      specOverride: "Ergonomic Secure-Fit Wings",
      price: 149,
      discount: 0,
      stock: 8,
      images: ["/images/earphones-black.jpg"],
    },
    {
      sku: "ANC-PULSE-TEAL-CORD",
      color: "Glacier Teal",
      specOverride: "Kevlar Braided Anti-Tangle Cord",
      price: 149,
      discount: 0,
      stock: 6,
      images: ["/images/earphones-teal.jpg"],
    },
  ],
  variants: [
    {
      id: "black",
      name: "Midnight Black",
      hex: "#1A1A1D",
      borderHex: "#333338",
      image: "/images/earphones-black.jpg",
      tag: "01",
    },
    {
      id: "teal",
      name: "Electric Teal",
      hex: "#0E8388",
      borderHex: "#2E4F4F",
      image: "/images/earphones-black.jpg",
      tag: "02",
    },
  ],
  mediaGallery: [
    {
      id: "m-hero-iem",
      url: "/images/earphones-black.jpg",
      alt: "Form Pulse IEM sports earphones in Midnight Black",
      type: "hero",
      label: "Studio View",
    },
    {
      id: "m-macro-iem",
      url: "/images/earbuds-exploded.jpg",
      alt: "Titanium driver chamber and waterproofing seal",
      type: "macro",
      label: "Acoustic Seal",
    },
    {
      id: "m-life-iem",
      url: "/images/lifestyle-city.jpg",
      alt: "Form Pulse IEM in high intensity workout session",
      type: "lifestyle",
      label: "Athletic In-Use",
    },
  ],
  primaryValueCallouts: [
    {
      tag: "ERGOLOCK STABILITY",
      title: "Shape-Memory Titanium Hooks",
      subtitle: "Tested at 15G Sudden Deceleration",
      description:
        "Aerospace titanium alloy coated in liquid silicone adapts to the contours of your ear. Remains completely unmovable during trail sprints, HIIT routines, and gym lifting.",
    },
    {
      tag: "SUBMERSIBLE RELIABILITY",
      title: "IPX7 Hydrophobic Protection",
      subtitle: "Immersion Proof up to 1 Meter for 30 Mins",
      description:
        "Internally sealed nano-coated circuit boards repel corrosive sweat salts and heavy downpours. Wash them under the tap after intense marathon workouts.",
    },
    {
      tag: "ATHLETIC BASS TUNING",
      title: "10 mm Titanium + Balanced Armature",
      subtitle: "High-Impact Acoustic Energy Profile",
      description:
        "Tuned specifically for driving rhythmic cadence. Delivers sub-bass punch that elevates your heart rate without muddying workout coaching cues or vocal tracks.",
    },
  ],
  explodedView: {
    image: "/images/earbuds-exploded.jpg",
    badge: "RUGGED ACOUSTIC ARCHITECTURE",
    caption: "Form Pulse IEM cross-section showcasing dual hybrid drivers and IPX7 silicone hermetic seals.",
    callouts: [
      {
        number: "01",
        title: "Dual Hybrid Acoustic System",
        description: "10 mm dynamic woofer coupled to Knowles balanced armature for micro-detail.",
      },
      {
        number: "02",
        title: "IPX7 Hermetic Silicone Gasket",
        description: "Impermeable barrier guarding sensitive electronics against sweat crystallization.",
      },
      {
        number: "03",
        title: "Tactile Physical Buttons",
        description: "Raised tactile switches that provide positive click feedback even when wearing gloves.",
      },
      {
        number: "04",
        title: "Magnetic Snap Auto-Clasp",
        description: "Earbuds snap together around your neck when resting to automatically pause audio.",
      },
    ],
  },
  tabbedSpecs: {
    core: [
      { label: "Driver Architecture", value: "Hybrid: 10 mm Titanium Dynamic + Knowles Balanced Armature" },
      { label: "Frequency Range", value: "12 Hz – 32,000 Hz" },
      { label: "Water & Sweat Rating", value: "IPX7 (Submersible up to 1 meter)", badge: "Sweatproof" },
      { label: "Retention Mechanism", value: "ErgoLock Shape-Memory Titanium Over-Ear Hooks", badge: "Zero Slip" },
      { label: "Cable Reinforcement", value: "Kevlar-reinforced tangle-resistant neckband" },
      { label: "Weight", value: "22 g total" },
    ],
    battery: [
      { label: "Continuous Playtime", value: "Up to 18 hours uninterrupted music playback", badge: "Marathon Ready" },
      { label: "Rapid Magnetic Charge", value: "10 minutes charge = 4 hours high-volume playback" },
      { label: "Full Recharge Time", value: "60 minutes via magnetic fast-dock connector" },
      { label: "Standby Duration", value: "400 hours with magnetic auto-sleep" },
    ],
    connectivity: [
      { label: "Bluetooth Standard", value: "Bluetooth 5.3 with High Performance RF power" },
      { label: "Multipoint Capability", value: "Syncs with smartwatch and phone simultaneously" },
      { label: "Supported Codecs", value: "aptX Adaptive, AAC, SBC" },
      { label: "Physical Controls", value: "3-button tactile controller (Volume, Track, Siri/Assistant)" },
      { label: "Auto Sleep", value: "Magnetic clasp pauses playback and sleeps after 5 mins" },
    ],
  },
  hygienePolicy: {
    title: "Sanitary Packaging & Sports Care Policy",
    badge: "HYGIENE & HEALTH NOTICE",
    description:
      "Form Pulse IEM includes 4 pairs of antibacterial medical-grade silicone tips (XS, S, M, L) sealed in individual sterile blisters. For hygiene and customer safety, unsealed tips cannot be returned.",
    exemptionNotice:
      "Includes a 30-day performance guarantee for unopened sealed packages.",
  },
  qna: [
    {
      id: "q-iem-1",
      question: "Will the earhooks interfere with cycling glasses or sunglasses?",
      answer:
        "The titanium hooks are engineered with an ultra-thin 1.2 mm profile that lays flat against your mastoid bone, comfortably clearing prescription eyewear and cycling helmets.",
      author: "ancwave Ergonomics Lab",
      date: "Oct 2026",
    },
    {
      id: "q-iem-2",
      question: "Can I rinse these under the tap after a dusty trail run?",
      answer:
        "Yes! With full IPX7 water ingress protection, Form Pulse IEM can be safely rinsed under running fresh water to clean sweat and trail dust.",
      author: "ancwave Product Support",
      date: "Oct 2026",
    },
  ],
  specs: {
    dimensionsMetric: "Flexible neckband (420 mm)",
    dimensionsImperial: "16.5 in neckband",
    weightMetric: "22 g",
    weightImperial: "0.77 oz",
    batteryLife: "Up to 18 hours continuous",
    charging: "Magnetic Fast Charge · 10 min for 4 h",
    driver: "10 mm Titanium + Balanced Armature",
    noiseControl: "Passive Ergonomic In-Ear Seal (-28 dB)",
    connectivity: "Bluetooth 5.3 · Dual Smartwatch/Phone sync",
    codecs: "aptX Adaptive / AAC / SBC",
    materials: "Titanium wire · liquid silicone · Kevlar",
    inTheBox:
      "Form Pulse IEM, 4 sets antibacterial tips (XS/S/M/L), magnetic charging cable, breathable mesh carry pouch.",
  },
  metrics: {
    playtime: "18 h",
    driverSize: "10 mm + BA",
    weight: "22 g",
    bluetooth: "Bluetooth 5.3",
  },
  lastRevalidatedAt: "2026-10-20T12:00:00.000Z",
};

export const productAData: ProductData = {
  id: "product-a",
  slug: "product-a",
  productId: "ANC-PROD-A",
  categorySlug: "apparel-fashion",
  name: "Product A - Studio Minimalist Hoodie",
  model: "ORGANIC HEAVYWEIGHT 450 GSM",
  category: "Apparel & Fashion",
  tagline: "Ultra-dense combed cotton with tailored architectural cut.",
  description:
    "Crafted from 100% sustainable combed cotton. Designed with dual variant architectures: A1 (Regular Fit) and A2 (Oversized Streetwear Fit) across multiple muted colorways.",
  price: 120,
  basePrice: 120,
  originalPrice: 145,
  activeDiscount: 0,
  baseDiscount: 0,
  type: "Apparel & Fashion",
  stock: 26, // A1: Green (5) + Black (2) + Blue (4) + A2: White (8) + Green (7) = 26 units
  lowStockThreshold: 5,
  isFlashSale: false,
  warrantyYears: 1,
  returnDays: 30,
  deliveryEstimate: "Dispatches in 24 hours · Worldwide delivery in 3–5 business days",
  rating: 4.95,
  averageRating: 4.95,
  reviewCount: 34,
  sku: "PROD-A-MASTER",
  globalSpecs: {
    "Material / Fabric": "100% Organic Combed Ring-Spun Cotton",
    "Fabric Density": "450 GSM Heavyweight French Terry",
    "Fit Architecture": "A1 Regular Fit & A2 Streetwear Oversized Cut",
    "Care Instructions": "Cold wash inside out, lay flat to dry",
    "Origin": "Ethically milled and tailored in Portugal",
  },
  variantGroups: [
    {
      id: "A1",
      name: "A1 (Regular Fit)",
      specOverride: "A1 (Regular Fit)",
      price: 120,
      colors: [
        {
          sku: "PROD-A1-GREEN",
          color: "Forest Green",
          hex: "#2E5339",
          price: 120,
          stock: 5,
          images: ["/images/lifestyle-workspace.jpg", "/images/feature-foam.jpg"],
        },
        {
          sku: "PROD-A1-BLACK",
          color: "Pitch Black",
          hex: "#1A1A1A",
          price: 120,
          stock: 2,
          images: ["/images/hero-graphite.jpg", "/images/feature-aluminum.jpg"],
        },
        {
          sku: "PROD-A1-BLUE",
          color: "Mineral Blue",
          hex: "#3B6978",
          price: 120,
          stock: 4,
          images: ["/images/hero-silver.jpg", "/images/checkout-floating.jpg"],
        },
      ],
    },
    {
      id: "A2",
      name: "A2 (Oversized Fit)",
      specOverride: "A2 (Oversized Fit)",
      price: 130,
      colors: [
        {
          sku: "PROD-A2-WHITE",
          color: "Arctic White",
          hex: "#ECECEC",
          price: 130,
          stock: 8,
          images: ["/images/hero-sandstone.jpg", "/images/feature-dial.jpg"],
        },
        {
          sku: "PROD-A2-GREEN",
          color: "Forest Green",
          hex: "#2E5339",
          price: 130,
          stock: 7,
          images: ["/images/lifestyle-cafe.jpg", "/images/lifestyle-city.jpg"],
        },
      ],
    },
  ],
  childVariants: [
    {
      sku: "PROD-A1-GREEN",
      color: "Forest Green",
      specOverride: "A1 (Regular Fit)",
      price: 120,
      discount: 0,
      stock: 5,
      images: ["/images/lifestyle-workspace.jpg", "/images/feature-foam.jpg"],
    },
    {
      sku: "PROD-A1-BLACK",
      color: "Pitch Black",
      specOverride: "A1 (Regular Fit)",
      price: 120,
      discount: 0,
      stock: 2,
      images: ["/images/hero-graphite.jpg", "/images/feature-aluminum.jpg"],
    },
    {
      sku: "PROD-A1-BLUE",
      color: "Mineral Blue",
      specOverride: "A1 (Regular Fit)",
      price: 120,
      discount: 0,
      stock: 4,
      images: ["/images/hero-silver.jpg", "/images/checkout-floating.jpg"],
    },
    {
      sku: "PROD-A2-WHITE",
      color: "Arctic White",
      specOverride: "A2 (Oversized Fit)",
      price: 130,
      discount: 0,
      stock: 8,
      images: ["/images/hero-sandstone.jpg", "/images/feature-dial.jpg"],
    },
    {
      sku: "PROD-A2-GREEN",
      color: "Forest Green",
      specOverride: "A2 (Oversized Fit)",
      price: 130,
      discount: 0,
      stock: 7,
      images: ["/images/lifestyle-cafe.jpg", "/images/lifestyle-city.jpg"],
    },
  ],
  variants: [
    {
      id: "green",
      name: "Forest Green",
      hex: "#2E5339",
      borderHex: "#1E3826",
      image: "/images/lifestyle-workspace.jpg",
      images: ["/images/lifestyle-workspace.jpg", "/images/feature-foam.jpg"],
      tag: "01",
    },
    {
      id: "black",
      name: "Pitch Black",
      hex: "#1A1A1A",
      borderHex: "#0D0D0D",
      image: "/images/hero-graphite.jpg",
      images: ["/images/hero-graphite.jpg", "/images/feature-aluminum.jpg"],
      tag: "02",
    },
    {
      id: "blue",
      name: "Mineral Blue",
      hex: "#3E5365",
      borderHex: "#293744",
      image: "/images/hero-silver.jpg",
      images: ["/images/hero-silver.jpg", "/images/checkout-floating.jpg"],
      tag: "03",
    },
    {
      id: "white",
      name: "Arctic White",
      hex: "#F5F5F0",
      borderHex: "#D8D8D0",
      image: "/images/hero-sandstone.jpg",
      images: ["/images/hero-sandstone.jpg", "/images/feature-dial.jpg"],
      tag: "04",
    },
  ],
  lastRevalidatedAt: "2026-10-24T12:00:00.000Z",
};

export const sampleCatalog: ProductData[] = [
  initialProductData,
  earbudProductData,
  earphoneProductData,
  productAData,
];

export const sampleReviews: (Review & IReview)[] = [
  {
    id: "rev-1",
    reviewId: "rev-1",
    productId: "ANC-FORM-01",
    userId: "usr-cust-01",
    author: "Maya R.",
    userName: "Maya R.",
    role: "Architect · Silver mist",
    userRole: "Architect · Silver mist",
    initials: "MR",
    userInitials: "MR",
    variant: "Silver mist",
    variantSku: "ANC-FORM01-SILVER-BOOM",
    rating: 5,
    comment:
      "“The world gets quieter, but the music opens up. The 4.2 N clamping force is miraculously comfortable—I wear them 7 hours a day while drafting without temporal pressure.”",
    verified: true,
    images: ["/images/lifestyle-cafe.jpg", "/images/hero-silver.jpg"],
    tags: ["ANC performance", "Clamping force & comfort", "Flight travel"],
    createdAt: "2 days ago",
  },
  {
    id: "rev-2",
    reviewId: "rev-2",
    productId: "ANC-FORM-01",
    userId: "usr-demo-02",
    author: "Theo L.",
    userName: "Theo L.",
    role: "Sound Engineer · Graphite",
    userRole: "Sound Engineer · Graphite",
    initials: "TL",
    userInitials: "TL",
    variant: "Graphite",
    variantSku: "ANC-FORM01-GRAPHITE-INT",
    rating: 5,
    comment:
      "“Beautifully flat transient response. Bio-cellulose cones are noticeably faster than conventional Mylar diaphragms. The knurled dial has the exact mechanical dampening of a high-end stereo amp.”",
    verified: true,
    images: ["/images/lifestyle-workspace.jpg"],
    tags: ["Bass response", "ANC performance"],
    createdAt: "1 week ago",
  },
  {
    id: "rev-3",
    reviewId: "rev-3",
    productId: "ANC-AIR-TWS",
    userId: "usr-demo-03",
    author: "Elena Rostova",
    userName: "Elena Rostova",
    role: "Ultra-Runner · Polar White",
    userRole: "Ultra-Runner · Polar White",
    initials: "ER",
    userInitials: "ER",
    variant: "Polar White",
    variantSku: "ANC-AIRTWS-WHITE-QI",
    rating: 5,
    comment:
      "“Form Air TWS stay locked in my ears during half-marathons. The barometric pressure relief vent completely kills the 'footstep thumping' you get in cheap earbuds. Call clarity in the wind is astonishing.”",
    verified: true,
    images: ["/images/lifestyle-city.jpg"],
    tags: ["Fit during running", "Call clarity", "Charging case battery"],
    createdAt: "3 days ago",
  },
  {
    id: "rev-4",
    reviewId: "rev-4",
    productId: "ANC-SPORT-PRO",
    userId: "usr-demo-04",
    author: "Marcus Chen",
    userName: "Marcus Chen",
    role: "Cycling Coach · Midnight Black",
    userRole: "Cycling Coach · Midnight Black",
    initials: "MC",
    userInitials: "MC",
    variant: "Midnight Black",
    variantSku: "ANC-PULSE-BLACK-WING",
    rating: 5,
    comment:
      "“Pulse IEM survived torrential rain in the Pacific Northwest without a glitch. The physical raised buttons are so much better than finicky touch sensors when your fingers are soaked or gloved.”",
    verified: true,
    images: [],
    tags: ["Fit during running", "Sweat & rain resistance", "Bass response"],
    createdAt: "5 days ago",
  },
  {
    id: "rev-5",
    reviewId: "rev-5",
    productId: "ANC-FORM-01",
    userId: "usr-demo-05",
    author: "Nina K.",
    userName: "Nina K.",
    role: "Product Designer · Sandstone",
    userRole: "Product Designer · Sandstone",
    initials: "NK",
    userInitials: "NK",
    variant: "Sandstone",
    variantSku: "ANC-FORM01-SANDSTONE-STUDIO",
    rating: 5,
    comment:
      "“Multipoint switching between my iPad and ThinkPad is instant. Best-in-class industrial design that doesn't scream 'gamer' or 'tech nerd'.”",
    verified: true,
    images: ["/images/feature-aluminum.jpg"],
    tags: ["ANC performance", "Clamping force & comfort"],
    createdAt: "2 weeks ago",
  },
];

export interface InStoreUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "owner" | "admin" | "user" | "customer";
  createdAt: string;
}

// In-Memory store for fast fallback & caching demonstration
class AncWaveStore {
  private products: Map<string, ProductData> = new Map();
  private orders: Order[] = [];
  private eventLogs: AWSEventLog[] = [];
  private reviews: (Review & IReview)[] = [];
  private users: Map<string, InStoreUser> = new Map();
  private shippingFixtures: ShippingSettings = {
    generalDeliveryPriceUsd: 0,
    generalDeliveryPriceInr: 0,
    expressDeliveryPriceUsd: 15,
    expressDeliveryPriceInr: 1200,
  };

  constructor() {
    sampleCatalog.forEach((p) => {
      this.products.set(p.slug, { ...p });
    });

    this.reviews = [...sampleReviews];

    // Seed default accounts
    this.users.set("owner@ancwave.com", {
      id: "usr-owner-01",
      email: "owner@ancwave.com",
      name: "Marcus Vance (Founder & Owner)",
      passwordHash: "",
      role: "owner",
      createdAt: new Date().toISOString(),
    });

    this.users.set("admin@ancwave.com", {
      id: "usr-admin-01",
      email: "admin@ancwave.com",
      name: "Alexander Vance (Lead Architect)",
      passwordHash: "",
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    this.users.set("alex@example.com", {
      id: "usr-cust-01",
      email: "alex@example.com",
      name: "Alex Morgan",
      passwordHash: "",
      role: "user",
      createdAt: new Date().toISOString(),
    });

    // Seed an initial completed order for demo customer alex@example.com (usr-cust-01)
    // so they are immediately eligible to review Form 01 out of the box!
    this.orders.push({
      id: "ord-demo-seed-01",
      orderNumber: "ANC-914820",
      userId: "usr-cust-01",
      customer: {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        address: "1420 NW Johnson Street",
        city: "Portland",
        state: "Oregon",
        zipCode: "97209",
      },
      items: [
        {
          productId: "form-01",
          name: "Form 01",
          variant: "silver",
          variantName: "Silver mist",
          componentSku: "ANC-FORM01-SILVER-BOOM",
          price: 349,
          quantity: 1,
          image: "/images/hero-silver.jpg",
          fit: "One size · adjustable",
        },
      ],
      subtotal: 349,
      shipping: 12,
      tax: 0,
      total: 361,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayPaymentId: "pay_demo_seed_verified",
      razorpayOrderId: "order_demo_seed",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      awsEventBridgeDispatched: true,
      cacheRevalidated: true,
    });

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
        message: "ancwave catalog cache warmed at edge with 3 audio platforms",
      },
      lambdaExecution: {
        status: "SUCCEEDED",
        durationMs: 42,
        logStream: "/aws/lambda/ancwave-cache-worker/2026/10/20/[$LATEST]49a",
      },
      revalidationStatus: {
        revalidatedPath: "/",
        tags: ["product-details", "stock-inventory", "audio-catalog"],
        status: "SUCCESS",
      },
    });
  }

  getProduct(slug = "form-01"): ProductData {
    let p = this.products.get(slug);
    if (!p) p = { ...initialProductData };
    if (!p.variantGroups || p.variantGroups.length === 0) {
      if (p.childVariants && p.childVariants.length > 0) {
        p.variantGroups = childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price);
      }
    }
    return { ...p };
  }

  getProductById(id: string): ProductData | undefined {
    for (const p of this.products.values()) {
      if (p.id === id || p.slug === id || p.productId === id) {
        if (!p.variantGroups || p.variantGroups.length === 0) {
          if (p.childVariants && p.childVariants.length > 0) {
            p.variantGroups = childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price);
          }
        }
        return { ...p };
      }
    }
    return undefined;
  }

  getProductBySlug(slug: string): ProductData | undefined {
    const p = this.products.get(slug);
    if (p && (!p.variantGroups || p.variantGroups.length === 0)) {
      if (p.childVariants && p.childVariants.length > 0) {
        p.variantGroups = childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price);
      }
    }
    return p ? { ...p } : undefined;
  }

  getAllProducts(): ProductData[] {
    return Array.from(this.products.values()).map((p) => {
      if (!p.variantGroups || p.variantGroups.length === 0) {
        if (p.childVariants && p.childVariants.length > 0) {
          p.variantGroups = childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price);
        }
      }
      return { ...p };
    });
  }

  updateStock(
    newStock: number,
    activeDiscount?: number,
    slug = "form-01",
    newPrice?: number,
    newBasePrice?: number
  ): ProductData {
    const p = this.products.get(slug) || { ...initialProductData };
    p.stock = Math.max(0, newStock);
    if (activeDiscount !== undefined) {
      p.activeDiscount = activeDiscount;
    }
    if (typeof newPrice === "number") {
      p.price = newPrice;
      p.basePrice = newPrice;
      p.priceInr = Math.round(newPrice * 83);
    } else if (typeof newBasePrice === "number") {
      p.basePrice = newBasePrice;
      p.price = newBasePrice;
      p.priceInr = Math.round(newBasePrice * 83);
    }
    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(slug, p);
    return { ...p };
  }

  updateVariantStock(productIdOrSlug: string, sku: string, newStock: number): ProductData {
    const p = this.products.get(productIdOrSlug) || this.getProductById(productIdOrSlug) || { ...initialProductData };
    const stockVal = Math.max(0, newStock);
    if (p.childVariants) {
      p.childVariants = p.childVariants.map((v) =>
        v.sku === sku ? { ...v, stock: stockVal } : v
      );
      p.stock = p.childVariants.reduce((sum, v) => sum + v.stock, 0);
    }
    if (p.variantGroups && p.variantGroups.length > 0) {
      p.variantGroups = p.variantGroups.map((g) => ({
        ...g,
        colors: g.colors.map((c) => (c.sku === sku ? { ...c, stock: stockVal } : c)),
      }));
    }
    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(p.slug, p);
    return { ...p };
  }

  updateProductWithVariants(updated: Partial<ProductData> & { productId?: string; slug?: string }): ProductData {
    const targetSlug = updated.slug || (updated.productId ? this.getProductById(updated.productId)?.slug : "form-01") || "form-01";
    const existing = this.products.get(targetSlug) || { ...initialProductData };

    const effBasePrice = typeof updated.basePrice === "number" ? updated.basePrice : (typeof updated.price === "number" ? updated.price : existing.basePrice || existing.price);
    const effPrice = typeof updated.price === "number" ? updated.price : effBasePrice;
    const effPriceInr = typeof updated.priceInr === "number" ? updated.priceInr : (typeof effPrice === "number" ? Math.round(effPrice * 83) : existing.priceInr);

    const merged: ProductData = {
      ...existing,
      ...updated,
      basePrice: effBasePrice,
      price: effPrice,
      priceInr: effPriceInr,
      lastRevalidatedAt: new Date().toISOString(),
    };

    if (updated.variantGroups && updated.variantGroups.length > 0) {
      merged.variantGroups = updated.variantGroups;
      merged.childVariants = variantGroupsToChildVariants(updated.variantGroups, merged.basePrice || merged.price);
      merged.stock = merged.childVariants.reduce((sum, v) => sum + v.stock, 0);
    } else if (updated.childVariants && updated.childVariants.length > 0) {
      merged.childVariants = updated.childVariants;
      merged.variantGroups = childVariantsToVariantGroups(updated.childVariants, merged.basePrice || merged.price);
      merged.stock = updated.childVariants.reduce((sum, v) => sum + v.stock, 0);
    }

    if (merged.childVariants && merged.childVariants.length > 0) {
      const existingVariants = existing.variants || [];
      merged.variants = merged.childVariants.map((cv, idx) => {
        const matchingExisting = existingVariants.find(
          (ev) => ev.name.toLowerCase() === cv.color.toLowerCase()
        );
        const colorId = matchingExisting?.id || cv.color.toLowerCase().replace(/[^a-z0-9]/g, "-") || `var-${idx}`;
        const primaryImage = cv.images && cv.images.length > 0 ? cv.images[0] : (matchingExisting?.image || "/images/hero-silver.jpg");
        return {
          id: colorId,
          name: cv.color,
          hex: matchingExisting?.hex || (idx === 0 ? "#C4C8D0" : idx === 1 ? "#22252A" : idx === 2 ? "#D6C4A6" : "#4A5568"),
          borderHex: matchingExisting?.borderHex || (idx === 0 ? "#949DAA" : idx === 1 ? "#111215" : idx === 2 ? "#B8A27E" : "#2D3748"),
          image: primaryImage,
          images: cv.images && cv.images.length > 0 ? cv.images : [primaryImage],
          tag: String(idx + 1).padStart(2, "0"),
          price: cv.price,
          priceInr: cv.priceInr,
          stock: cv.stock,
        };
      });
    }

    this.products.set(targetSlug, merged);
    return { ...merged };
  }

  addProduct(newProduct: ProductData): ProductData {
    const slug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const productId = newProduct.productId || `PROD-${Date.now().toString(36).toUpperCase()}`;
    const p: ProductData = {
      ...newProduct,
      slug,
      productId,
      id: slug,
      lastRevalidatedAt: new Date().toISOString(),
    };
    if (p.variantGroups && p.variantGroups.length > 0) {
      p.childVariants = variantGroupsToChildVariants(p.variantGroups, p.basePrice || p.price);
      p.stock = p.childVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else if (p.childVariants && p.childVariants.length > 0) {
      p.variantGroups = childVariantsToVariantGroups(p.childVariants, p.basePrice || p.price);
      p.stock = p.childVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    this.products.set(slug, p);
    return { ...p };
  }

  deleteProduct(slug: string): boolean {
    return this.products.delete(slug);
  }

  updateMultipleVariantStocks(slug: string, updates: Array<{ sku: string; stock: number }>): ProductData {
    const p = this.products.get(slug) || this.getProductById(slug) || { ...initialProductData };
    const updatesMap = new Map<string, number>();
    updates.forEach((u) => updatesMap.set(u.sku, Math.max(0, Number(u.stock) || 0)));

    if (p.childVariants && p.childVariants.length > 0) {
      p.childVariants = p.childVariants.map((v) => {
        if (updatesMap.has(v.sku)) {
          return { ...v, stock: updatesMap.get(v.sku)! };
        }
        return v;
      });
      p.stock = p.childVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else {
      const totalStock = updates.reduce((sum, u) => sum + (Number(u.stock) || 0), 0);
      p.stock = totalStock;
    }

    if (p.variantGroups && p.variantGroups.length > 0) {
      p.variantGroups = p.variantGroups.map((g) => ({
        ...g,
        colors: g.colors.map((c) => {
          if (updatesMap.has(c.sku)) {
            return { ...c, stock: updatesMap.get(c.sku)! };
          }
          return c;
        }),
      }));
    }

    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(p.slug, p);
    return { ...p };
  }

  addColorToVariantGroup(
    slug: string,
    groupIdOrName: string,
    colorData: {
      sku?: string;
      color: string;
      hex?: string;
      price?: number;
      discount?: number;
      stock: number;
      images?: string[];
    }
  ): ProductData {
    const p = this.products.get(slug) || this.getProductById(slug) || { ...initialProductData };
    if (!p.variantGroups || p.variantGroups.length === 0) {
      p.variantGroups = childVariantsToVariantGroups(p.childVariants || [], p.basePrice || p.price);
    }

    let group = p.variantGroups.find(
      (g) => g.id.toLowerCase() === groupIdOrName.toLowerCase() || g.name.toLowerCase() === groupIdOrName.toLowerCase()
    );

    if (!group) {
      group = {
        id: groupIdOrName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `arch-${Date.now().toString(36)}`,
        name: groupIdOrName,
        specOverride: groupIdOrName,
        price: colorData.price ?? p.basePrice ?? p.price,
        discount: colorData.discount ?? 0,
        colors: [],
      };
      p.variantGroups.push(group);
    }

    const cleanColor = colorData.color.trim() || "New Color";
    const generatedSku = colorData.sku?.trim() || `${p.productId || "PROD"}-${group.id.toUpperCase()}-${cleanColor.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
    const hex = colorData.hex || (
      cleanColor.toLowerCase().includes("green") ? "#2E5339" :
      cleanColor.toLowerCase().includes("black") ? "#1A1A1A" :
      cleanColor.toLowerCase().includes("blue") ? "#3B6978" :
      cleanColor.toLowerCase().includes("white") ? "#ECECEC" :
      cleanColor.toLowerCase().includes("red") ? "#DC2626" :
      cleanColor.toLowerCase().includes("grey") || cleanColor.toLowerCase().includes("gray") ? "#6B7280" :
      "#4F46E5"
    );

    const newColor: IVariantColor = {
      id: `${group.id}-${generatedSku}`,
      sku: generatedSku,
      color: cleanColor,
      hex,
      price: colorData.price ?? group.price ?? p.basePrice ?? p.price,
      discount: colorData.discount ?? group.discount ?? 0,
      stock: Math.max(0, Number(colorData.stock) || 0),
      images: Array.isArray(colorData.images) && colorData.images.length > 0 ? colorData.images : ["/images/hero-silver.jpg"],
    };

    const existingColorIdx = group.colors.findIndex((c) => c.sku.toLowerCase() === generatedSku.toLowerCase());
    if (existingColorIdx >= 0) {
      group.colors[existingColorIdx] = newColor;
    } else {
      group.colors.push(newColor);
    }

    // Re-derive childVariants & update total stock
    p.childVariants = variantGroupsToChildVariants(p.variantGroups, p.basePrice || p.price);
    p.stock = p.childVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

    // Sync storefront variants list
    const existingVariants = p.variants || [];
    p.variants = p.childVariants.map((cv, idx) => {
      const match = existingVariants.find((ev) => ev.name.toLowerCase() === cv.color.toLowerCase());
      return {
        id: match?.id || cv.color.toLowerCase().replace(/[^a-z0-9]/g, "-") || `var-${idx}`,
        name: cv.color,
        hex: match?.hex || (cv as any).hex || "#22252A",
        borderHex: match?.borderHex || "#111215",
        image: cv.images?.[0] || match?.image || "/images/hero-silver.jpg",
        images: cv.images && cv.images.length > 0 ? cv.images : [cv.images?.[0] || "/images/hero-silver.jpg"],
        tag: String(idx + 1).padStart(2, "0"),
      };
    });

    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(p.slug, p);
    return { ...p };
  }

  removeColorFromVariantGroup(slug: string, sku: string): ProductData {
    const p = this.products.get(slug) || this.getProductById(slug) || { ...initialProductData };
    if (!p.variantGroups || p.variantGroups.length === 0) {
      p.variantGroups = childVariantsToVariantGroups(p.childVariants || [], p.basePrice || p.price);
    }

    p.variantGroups.forEach((g) => {
      g.colors = g.colors.filter((c) => c.sku.toLowerCase() !== sku.toLowerCase());
    });

    p.childVariants = variantGroupsToChildVariants(p.variantGroups, p.basePrice || p.price);
    p.stock = p.childVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(p.slug, p);
    return { ...p };
  }

  reduceStock(quantity: number, slug = "form-01"): { product: ProductData; previousStock: number } {
    const p = this.products.get(slug) || { ...initialProductData };
    const previousStock = p.stock;
    p.stock = Math.max(0, p.stock - quantity);
    p.lastRevalidatedAt = new Date().toISOString();
    this.products.set(slug, p);
    return { product: { ...p }, previousStock };
  }

  addOrder(order: Order): Order {
    this.orders.unshift(order);
    return order;
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  hasUserPurchased(userId: string, userEmail: string, productIdOrSlug: string): boolean {
    const product = this.getProductById(productIdOrSlug) || this.products.get(productIdOrSlug);
    const validIds = new Set<string>();
    if (productIdOrSlug) validIds.add(productIdOrSlug.toLowerCase());
    if (product?.id) validIds.add(product.id.toLowerCase());
    if (product?.slug) validIds.add(product.slug.toLowerCase());
    if (product?.productId) validIds.add(product.productId.toLowerCase());

    return this.orders.some((ord) => {
      if (ord.paymentStatus !== "paid") return false;
      const isUserMatch =
        (userId && ord.userId === userId) ||
        (userEmail && ord.customer?.email?.toLowerCase() === userEmail.toLowerCase());
      if (!isUserMatch) return false;

      return ord.items.some((item) =>
        validIds.has(item.productId?.toLowerCase() || "") ||
        (product && item.name?.toLowerCase().includes(product.name.toLowerCase()))
      );
    });
  }

  addVerifiedOrderForUser(userId: string, email: string, productIdOrSlug = "form-01"): Order {
    const product = this.getProductById(productIdOrSlug) || this.getProduct(productIdOrSlug);
    const order: Order = {
      id: "ord-verified-" + Math.random().toString(36).substring(2, 9),
      orderNumber: "ANC-" + Math.floor(100000 + Math.random() * 900000),
      userId,
      customer: {
        fullName: email.split("@")[0],
        email,
        address: "742 Acoustic Ave",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
      },
      items: [
        {
          productId: product.slug,
          name: product.name,
          variant: "silver",
          variantName: product.variants[0]?.name || "Default",
          price: product.price,
          quantity: 1,
          image: product.variants[0]?.image || "/images/hero-silver.jpg",
          fit: "Standard",
        },
      ],
      subtotal: product.price,
      shipping: 0,
      tax: 0,
      total: product.price,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      createdAt: new Date().toISOString(),
      awsEventBridgeDispatched: true,
      cacheRevalidated: true,
    };
    this.orders.unshift(order);
    return order;
  }

  getReviews(productIdOrSlug: string): (Review & IReview)[] {
    const product = this.getProductById(productIdOrSlug) || this.products.get(productIdOrSlug);
    const validIds = new Set<string>();
    if (productIdOrSlug) validIds.add(productIdOrSlug.toLowerCase());
    if (product?.id) validIds.add(product.id.toLowerCase());
    if (product?.slug) validIds.add(product.slug.toLowerCase());
    if (product?.productId) validIds.add(product.productId.toLowerCase());

    return this.reviews.filter((r) =>
      validIds.has(r.productId?.toLowerCase() || "") ||
      (r.productId === undefined && validIds.has("form-01"))
    );
  }

  addReview(reviewData: Partial<Review & IReview>): {
    review: Review & IReview;
    averageRating: number;
    reviewCount: number;
  } {
    const productId = reviewData.productId || "ANC-FORM-01";
    const newReview: Review & IReview = {
      id: reviewData.id || reviewData.reviewId || "rev-" + Math.random().toString(36).substring(2, 9),
      reviewId: reviewData.reviewId || "rev-" + Math.random().toString(36).substring(2, 9),
      productId,
      userId: reviewData.userId || "anonymous",
      author: reviewData.author || reviewData.userName || "Verified Buyer",
      userName: reviewData.userName || reviewData.author || "Verified Buyer",
      role: reviewData.role || "Verified Acoustic Owner",
      userRole: reviewData.userRole || "Verified Acoustic Owner",
      initials:
        reviewData.initials ||
        (reviewData.author || reviewData.userName || "VB")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      userInitials: reviewData.userInitials || "VB",
      variant: reviewData.variant || "Standard",
      variantSku: reviewData.variantSku || "",
      rating: Math.max(1, Math.min(5, reviewData.rating || 5)),
      comment: reviewData.comment || "",
      verified: true,
      images: (reviewData.images || []).slice(0, 5),
      tags: reviewData.tags || ["Verified Buyer", "Acoustic Clarity"],
      createdAt: reviewData.createdAt ? String(reviewData.createdAt) : "Just now",
    };

    this.reviews.unshift(newReview);

    // Recalculate rating and reviewCount for target product
    const matchingReviews = this.getReviews(productId);
    const count = matchingReviews.length;
    const avg = count > 0 ? matchingReviews.reduce((sum, r) => sum + r.rating, 0) / count : 5.0;
    const roundedAvg = Math.round(avg * 10) / 10;

    const targetProduct = this.getProductById(productId) || this.products.get(productId);
    if (targetProduct) {
      targetProduct.rating = roundedAvg;
      targetProduct.averageRating = roundedAvg;
      targetProduct.reviewCount = count;
      targetProduct.lastRevalidatedAt = new Date().toISOString();
      this.products.set(targetProduct.slug, targetProduct);
    }

    return {
      review: newReview,
      averageRating: roundedAvg,
      reviewCount: count,
    };
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

  registerUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    role?: "owner" | "admin" | "user" | "customer";
  }): InStoreUser {
    const emailKey = userData.email.toLowerCase().trim();
    const newUser: InStoreUser = {
      id: `usr-${Date.now().toString(36)}`,
      email: emailKey,
      name: userData.name.trim(),
      passwordHash: userData.passwordHash,
      role: userData.role || "user",
      createdAt: new Date().toISOString(),
    };
    this.users.set(emailKey, newUser);
    return newUser;
  }

  findUserByEmail(email: string): InStoreUser | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  findUserById(id: string): InStoreUser | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  searchUsers(query = ""): InStoreUser[] {
    const q = query.toLowerCase().trim();
    const all = Array.from(this.users.values());
    if (!q) return all;
    return all.filter(
      (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }

  updateUserRole(
    emailOrId: string,
    newRole: "owner" | "admin" | "user" | "customer"
  ): InStoreUser | undefined {
    const lower = emailOrId.toLowerCase().trim();
    let target = this.users.get(lower);
    if (!target) {
      target = this.findUserById(emailOrId);
    }
    if (target) {
      target.role = newRole;
      this.users.set(target.email.toLowerCase(), target);
      return { ...target };
    }
    return undefined;
  }

  getShippingFixtures(): ShippingSettings {
    return { ...this.shippingFixtures };
  }

  updateShippingFixtures(fixtures: Partial<ShippingSettings>): ShippingSettings {
    this.shippingFixtures = {
      ...this.shippingFixtures,
      ...fixtures,
    };
    return { ...this.shippingFixtures };
  }

  resetStore(): void {
    this.products.clear();
    sampleCatalog.forEach((p) => {
      this.products.set(p.slug, { ...p });
    });
    this.reviews = [...sampleReviews];
  }
}

// Global singleton across hot reloads in dev
const globalStore = global as unknown as { __ancWaveStore?: AncWaveStore };
if (
  !globalStore.__ancWaveStore ||
  typeof (globalStore.__ancWaveStore as any)?.addProduct !== "function" ||
  typeof (globalStore.__ancWaveStore as any)?.getShippingFixtures !== "function"
) {
  globalStore.__ancWaveStore = new AncWaveStore();
}
export const store = globalStore.__ancWaveStore;
if (process.env.NODE_ENV !== "production") {
  globalStore.__ancWaveStore = store;
}

export function getProductBySlug(slug: string): ProductData | undefined {
  return store.getProductBySlug?.(slug) || sampleCatalog.find((p) => p.slug === slug);
}

export function getAllProducts(): ProductData[] {
  return store.getAllProducts?.() || sampleCatalog;
}

export function getReviewsByProductId(productId: string): (Review & IReview)[] {
  return store.getReviews(productId);
}

