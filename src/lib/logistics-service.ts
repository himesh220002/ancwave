import {
  Order,
  OrderEvent,
  LogisticsHub,
  ShipmentRouteLeg,
  HubQueueStatus,
  TransportMode,
  DispatchCategory,
  RailFreightDetails,
  AirCargoDetails,
  CourierServiceDetails,
} from "@/types";

export interface CourierProviderInfo {
  id: "anc_custom" | "bluedart" | "delhivery" | "shiprocket" | "shadowfax" | "indiapost" | "xpressbees" | "dtdc";
  name: string;
  tagline: string;
  category: "ANC Custom In-House Fleet" | "Premium Air Express" | "Automated Surface & Air" | "Multi-Courier Router" | "Hyperlocal Instant" | "Universal Postal" | "Tier 2/3 Specialist";
  awbPrefix: string;
  defaultSla: string;
  highlights: string[];
}

export const COURIER_PROVIDERS_CATALOG: CourierProviderInfo[] = [
  {
    id: "anc_custom",
    name: "ANC Custom Delivery (In-House Priority Fleet)",
    tagline: "Proprietary secure direct fulfillment network — 100% in-house chain-of-custody",
    category: "ANC Custom In-House Fleet",
    awbPrefix: "ANC-LOG-",
    defaultSla: "Direct Priority (Same-Day / 24-48h)",
    highlights: [
      "Proprietary strategic route shielding",
      "Dedicated in-house fleet & verified riders",
      "Zero 3rd-party carrier routing leak",
      "Tamper-proof gate OTP verification"
    ],
  },
  {
    id: "bluedart",
    name: "Blue Dart Express",
    tagline: "South Asia's premier air express & express package distribution network",
    category: "Premium Air Express",
    awbPrefix: "BLUEDART-",
    defaultSla: "Next Day 10:30 AM / 24-48h",
    highlights: ["Dedicated Boeing freighter fleet", "Real-time automated webhooks", "High value electronics security"],
  },
  {
    id: "delhivery",
    name: "Delhivery One",
    tagline: "India's largest fully integrated logistics provider covering 18,500+ pin codes",
    category: "Automated Surface & Air",
    awbPrefix: "DELHIVERY-",
    defaultSla: "2–4 Days Direct Transit",
    highlights: ["Automated sorter hubs", "High-volume B2B & B2C API integration", "Paperless RTO workflows"],
  },
  {
    id: "shiprocket",
    name: "Shiprocket Smart-Assign",
    tagline: "AI-driven multi-carrier recommendation engine auto-picking cheapest & fastest carrier",
    category: "Multi-Courier Router",
    awbPrefix: "SR-ROUTER-",
    defaultSla: "Carrier Dynamic (1–3 Days)",
    highlights: ["Bluedart, Delhivery, Shadowfax in 1 pipeline", "Early COD remittance", "Automated buyer SMS/WhatsApp notifications"],
  },
  {
    id: "shadowfax",
    name: "Shadowfax Hyperlocal",
    tagline: "Crowdsourced hyperlocal and rapid same-day intra-city fulfillment network",
    category: "Hyperlocal Instant",
    awbPrefix: "SFX-HYPER-",
    defaultSla: "30-Min to Same-Day (Under 4h)",
    highlights: ["Local dark store & hub dispatch", "Rider live GPS telematics", "Doorstep quality verification"],
  },
  {
    id: "indiapost",
    name: "India Post Speed Post",
    tagline: "National sovereign postal network reaching 100% of Indian PIN codes & PMS rail integration",
    category: "Universal Postal",
    awbPrefix: "EE-IN-",
    defaultSla: "2–5 Days Sovereign SLA",
    highlights: ["Reaches remote & NE pincodes", "Direct rail RMS (Railway Mail Service) ties", "Sovereign proof of delivery"],
  },
  {
    id: "xpressbees",
    name: "Xpressbees",
    tagline: "Fast-growing e-commerce specialist with robust tier-2, 3, and 4 delivery footprints",
    category: "Tier 2/3 Specialist",
    awbPrefix: "XPRESS-",
    defaultSla: "2–4 Days",
    highlights: ["Specialized electronics handling", "Competitive regional rates", "Reverse logistics automation"],
  },
];

export const DEFAULT_RAIL_PMS: RailFreightDetails = {
  parcelId: "PRC-ER-20261028-091",
  consignementGroupId: "GRP-KOL-ASN-001",
  pwbNumber: "PWB-HWH-74829",
  trainNumber: "12302",
  trainName: "Howrah Rajdhani Express",
  departureDate: "2026-10-28",
  sourceStationCode: "HWH",
  sourceStationName: "Howrah Jn (Eastern Railway)",
  departureTime: "14:05",
  destinationStationCode: "ASN",
  destinationStationName: "Asansol Jn",
  arrivalTime: "17:15",
  freightScale: "Scale-R",
  spaceAllocationId: "F-SLR",
  wagonNumber: "WAG-9-44021",
  loadingManifestId: "LMF-HWH-ASN-4402",
};

export const DEFAULT_AIR_CARGO: AirCargoDetails = {
  awbNumber: "098-84729103",
  flightNumber: "6E-204",
  airline: "IndiGo Cargo",
  flightDate: "2026-10-28",
  sourceAirportCode: "DEL",
  sourceAirportName: "Indira Gandhi Intl Airport (T3 Cargo)",
  departureTime: "09:30",
  destAirportCode: "CCU",
  destAirportName: "NSCB Intl Airport (Air Cargo Complex)",
  arrivalTime: "11:45",
  uldId: "AKE-14920-6E",
  bayLocation: "Forward Hold (FWD-01)",
  flightManifestId: "FLM-6E-DEL-CCU-88",
};

export const STANDARD_HUBS: LogisticsHub[] = [
  // 1. NORTH: Delhi-NCR
  {
    id: "HUB-DEL-01",
    code: "DEL",
    name: "Delhi-NCR National Fulfillment Gateway",
    region: "Delhi-NCR (North Zone)",
    country: "India",
    type: "origin",
    coverageArea: "Covers Jammu & Kashmir, Punjab, Haryana, Himachal, and Western UP.",
    strategicRole: "Primary Northern multi-modal origin, fulfillment, and air freight gateway",
  },
  // 2. CENTRAL: Nagpur (MP/Maharashtra border)
  {
    id: "HUB-NAG-01",
    code: "NAG",
    name: "Nagpur Central Multi-Modal Logistics Hub",
    region: "Nagpur, MP/Maharashtra Border (Central Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Connects North-South and East-West corridors perfectly across Central India.",
    strategicRole: "The ultimate logistics hub of India. Zero-mile geographic crossroads connecting all 4 cardinal directions.",
  },
  // 3. WEST: Mumbai / Pune
  {
    id: "HUB-BOM-01",
    code: "BOM",
    name: "Mumbai / Pune Western Gateway Hub",
    region: "Mumbai / Pune, Maharashtra (West Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Covers Maharashtra, Goa, and coastal trade routes.",
    strategicRole: "Premier West Coast commercial, financial, and maritime deep-sea gateway",
  },
  // 4. WEST-INDUSTRIAL: Ahmedabad / Surat
  {
    id: "HUB-AMD-01",
    code: "AMD",
    name: "Ahmedabad / Surat Industrial Hub",
    region: "Ahmedabad / Surat, Gujarat (West-Industrial Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Critical for covering Gujarat, Rajasthan, and heavy manufacturing clusters.",
    strategicRole: "Industrial corridor powerhouse & Western Dedicated Freight Corridor (DFC) rail hub",
  },
  // 5. EAST: Kolkata
  {
    id: "HUB-CCU-01",
    code: "CCU",
    name: "Kolkata Eastern Logistics Gateway",
    region: "Kolkata, West Bengal (East Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Covers West Bengal, Odisha, and acts as the gateway to the East.",
    strategicRole: "Trunk line rail junction, Bay of Bengal maritime ports, and Eastern anchor",
  },
  // 6. EAST-CENTRAL: Lucknow (UP)
  {
    id: "HUB-LKO-01",
    code: "LKO",
    name: "Lucknow East-Central Logistics Center",
    region: "Lucknow, Uttar Pradesh (East-Central Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Covers Central/Eastern UP and Bihar efficiently, removing duplicate staging.",
    strategicRole: "Consolidated high-density express dispatch for Gangetic plains & Bihar",
  },
  // 7. NORTHEAST: Guwahati
  {
    id: "HUB-GAU-01",
    code: "GAU",
    name: "Guwahati Northeast Gateway Hub",
    region: "Guwahati, Assam (Northeast Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Non-negotiable for true pan-India coverage. Serves all 7 sister states.",
    strategicRole: "Essential lifeline corridor connecting Assam, Meghalaya, Tripura, Mizoram, Manipur, Nagaland, and Arunachal",
  },
  // 8. SOUTH-WEST: Bengaluru
  {
    id: "HUB-BLR-01",
    code: "BLR",
    name: "Bengaluru South-West Tech & Fulfillment Hub",
    region: "Bengaluru, Karnataka (South-West Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Covers Karnataka, Kerala, and acts as a massive tech/e-commerce consumption hub.",
    strategicRole: "High-velocity tech electronics fulfillment & South-Western corridor anchor",
  },
  // 9. SOUTH-EAST: Chennai
  {
    id: "HUB-MAA-01",
    code: "MAA",
    name: "Chennai South-East Coastal Hub",
    region: "Chennai, Tamil Nadu (South-East Zone)",
    country: "India",
    type: "regional_gateway",
    coverageArea: "Covers Tamil Nadu, Andhra Pradesh, and Telangana.",
    strategicRole: "Automotive/electronics corridor, deep-sea container terminal, and South-East distribution",
  },
  // Sub-Hub for backward compatibility with active test consignments
  {
    id: "HUB-ASN-01",
    code: "ASN",
    name: "Asansol Regional Sorting Center",
    region: "Asansol Zone, West Bengal, IN",
    country: "India",
    type: "local_delivery",
    coverageArea: "Local doorstep distribution node for West Bengal industrial belt.",
    strategicRole: "Local delivery sub-hub paired with Kolkata Gateway",
  },
  // Regional Sub-Hub for Bihar & East-Central Districts
  {
    id: "HUB-PAT-01",
    code: "PAT",
    name: "Patna Regional Distribution Center",
    region: "Patna, Bihar (East-Central Zone)",
    country: "India",
    type: "local_delivery",
    coverageArea: "Covers Bihar regional districts including Rathur, Gaya, Bhagalpur, Muzaffarpur.",
    strategicRole: "Regional express distribution center paired with Lucknow East-Central Gateway.",
  },
  // Central Stock & Inventory Fulfillment Center (The Central Hub)
  {
    id: "STOCK-CTR-01",
    code: "STK",
    name: "Central Stock & Fulfillment Center",
    region: "Central Inventory Depot (Nagpur Zero-Mile / National Stock Center)",
    country: "India",
    type: "origin",
    coverageArea: "National central inventory repository and primary packaging center.",
    strategicRole: "Core central stock warehouse. Receives live orders, performs quality checks, packaging, and assigns 1st regional transit hub based on delivery direction.",
  },

  // International Global Fulfillment Hubs
  {
    id: "HUB-PDX-01",
    code: "PDX",
    name: "Portland Primary Logistics Center",
    region: "Oregon, US",
    country: "United States",
    type: "origin",
    coverageArea: "North American Pacific Northwest fulfillment.",
    strategicRole: "US primary origin & warehouse center",
  },
  {
    id: "HUB-FRA-01",
    code: "FRA",
    name: "Frankfurt Central Air Logistics Hub",
    region: "Frankfurt, DE",
    country: "Germany",
    type: "air_transit",
    coverageArea: "European Union distribution.",
    strategicRole: "European air cargo interchange",
  },
  {
    id: "HUB-LHR-01",
    code: "LHR",
    name: "London Heathrow Gateway Hub",
    region: "London, UK",
    country: "United Kingdom",
    type: "regional_gateway",
    coverageArea: "UK & Ireland metropolitan coverage.",
    strategicRole: "British Isles regional distribution",
  },
];

export function getHubById(id?: string, customHubs: LogisticsHub[] = []): LogisticsHub | undefined {
  if (!id) return undefined;
  const targetId = id.toLowerCase();
  return (
    customHubs.find((h) => h.id.toLowerCase() === targetId || h.code.toLowerCase() === targetId) ||
    STANDARD_HUBS.find((h) => h.id.toLowerCase() === targetId || h.code.toLowerCase() === targetId)
  );
}

export function getHubByNameOrCity(query?: string, customHubs: LogisticsHub[] = []): LogisticsHub | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  const all = [...customHubs, ...STANDARD_HUBS];
  return all.find(
    (h) =>
      h.name.toLowerCase().includes(q) ||
      h.region.toLowerCase().includes(q) ||
      (h.coverageArea && h.coverageArea.toLowerCase().includes(q)) ||
      h.code.toLowerCase() === q ||
      h.id.toLowerCase() === q
  );
}

export const CENTRAL_STOCK_CENTER: LogisticsHub = STANDARD_HUBS.find((h) => h.id === "STOCK-CTR-01") || {
  id: "STOCK-CTR-01",
  code: "STK",
  name: "Central Stock & Fulfillment Center",
  region: "Central Inventory Depot (Nagpur Zero-Mile / National Stock Center)",
  country: "India",
  type: "origin",
  coverageArea: "National central inventory repository and primary packaging center.",
  strategicRole: "Core central stock warehouse. Receives live orders, performs quality checks, packaging, and assigns 1st regional transit hub based on delivery direction.",
};

export interface DirectionCorridorDecision {
  direction: "North" | "East-Central" | "East" | "Northeast" | "West" | "West-Industrial" | "South-West" | "South-East" | "Central" | "International";
  directionLabel: string;
  reason: string;
  firstHubId: string;
  firstHubName: string;
  firstHubRegion: string;
  corridorMode: "train" | "plane" | "truck" | "van";
  vehicleNo: string;
  containerId: string;
}

/**
 * Determines optimal direction corridor and assigns the 1st Hub starting from the Central Stock Center.
 */
export function getDirectionCorridorDecision(customer?: any): DirectionCorridorDecision {
  const country = (customer?.country || "India").toLowerCase();
  const city = (customer?.city || "").toLowerCase();
  const state = (customer?.state || "").toLowerCase();
  const address = (customer?.address || "").toLowerCase();

  // International (Non-India)
  if (!country.includes("ind") && !country.includes("in")) {
    if (country.includes("us") || country.includes("united states") || state.includes("or") || state.includes("oregon") || city.includes("portland")) {
      return {
        direction: "International",
        directionLabel: "North America (US Pacific Northwest)",
        reason: "Destination in US. Direct fulfillment via Portland Primary Logistics Center.",
        firstHubId: "HUB-PDX-01",
        firstHubName: "Portland Primary Logistics Center",
        firstHubRegion: "Oregon, US",
        corridorMode: "van",
        vehicleNo: "OR-EXP-8891",
        containerId: "PDX-LOCAL-01",
      };
    }
    return {
      direction: "International",
      directionLabel: "Global Transatlantic Corridor",
      reason: "International destination. Routed via Frankfurt Central Air Logistics Hub.",
      firstHubId: "HUB-FRA-01",
      firstHubName: "Frankfurt Central Air Logistics Hub",
      firstHubRegion: "Frankfurt, DE",
      corridorMode: "plane",
      vehicleNo: "LH-CARGO-772",
      containerId: "FRA-REG-011",
    };
  }

  // 1. NORTHEAST: 7 Sister States
  if (
    city.includes("guwahati") ||
    city.includes("silchar") ||
    city.includes("shillong") ||
    city.includes("agartala") ||
    city.includes("imphal") ||
    city.includes("aizawl") ||
    city.includes("kohima") ||
    city.includes("itanagar") ||
    city.includes("dimapur") ||
    state.includes("assam") ||
    state.includes("meghalaya") ||
    state.includes("tripura") ||
    state.includes("mizoram") ||
    state.includes("manipur") ||
    state.includes("nagaland") ||
    state.includes("arunachal")
  ) {
    return {
      direction: "Northeast",
      directionLabel: "Northeast 7-Sister States Corridor",
      reason: "Destination in Northeast Zone. Assigned direct from Central Stock Center to Guwahati Gateway via Dedicated Air Freight.",
      firstHubId: "HUB-GAU-01",
      firstHubName: "Guwahati Northeast Gateway Hub",
      firstHubRegion: "Guwahati, Assam (Northeast Zone)",
      corridorMode: "plane",
      vehicleNo: "6E-CARGO-701",
      containerId: "STK-GAU-AIR-01",
    };
  }

  // 2. EAST-CENTRAL: Central & Eastern UP, Bihar
  if (
    city.includes("lucknow") ||
    city.includes("kanpur") ||
    city.includes("patna") ||
    city.includes("varanasi") ||
    city.includes("gaya") ||
    city.includes("gorakhpur") ||
    city.includes("prayagraj") ||
    city.includes("allahabad") ||
    city.includes("muzaffarpur") ||
    city.includes("bhagalpur") ||
    city.includes("rathur") ||
    city.includes("mohalippur") ||
    address.includes("bihar") ||
    address.includes("rathur") ||
    state.includes("bihar") ||
    (state.includes("uttar pradesh") && !city.includes("noida") && !city.includes("ghaziabad") && !city.includes("meerut")) ||
    (state === "up" && !city.includes("noida") && !city.includes("ghaziabad"))
  ) {
    return {
      direction: "East-Central",
      directionLabel: "East-Central Zone (Gangetic Plains & Bihar)",
      reason: "Destination in Bihar / East-Central UP. Assigned to Lucknow East-Central Logistics Center as the primary gateway from Central Stock Center.",
      firstHubId: "HUB-LKO-01",
      firstHubName: "Lucknow East-Central Logistics Center",
      firstHubRegion: "Lucknow, Uttar Pradesh (East-Central Zone)",
      corridorMode: "train",
      vehicleNo: "IR-12004-SHATABDI",
      containerId: "STK-LKO-RAIL-01",
    };
  }

  // 3. EAST: West Bengal, Odisha, Jharkhand
  if (
    city.includes("kolkata") ||
    city.includes("howrah") ||
    city.includes("asansol") ||
    city.includes("burdwan") ||
    city.includes("durgapur") ||
    city.includes("siliguri") ||
    city.includes("bhubaneswar") ||
    city.includes("cuttack") ||
    city.includes("puri") ||
    city.includes("ranchi") ||
    city.includes("jamshedpur") ||
    state.includes("bengal") ||
    state.includes("odisha") ||
    state.includes("orissa") ||
    state.includes("jharkhand")
  ) {
    return {
      direction: "East",
      directionLabel: "Eastern Industrial & Port Corridor",
      reason: "Destination in Eastern Corridor (West Bengal / Odisha). Assigned to Kolkata Eastern Logistics Gateway.",
      firstHubId: "HUB-CCU-01",
      firstHubName: "Kolkata Eastern Logistics Gateway",
      firstHubRegion: "Kolkata, West Bengal (East Zone)",
      corridorMode: "train",
      vehicleNo: "IR-12302-RAJ",
      containerId: "STK-CCU-RAIL-01",
    };
  }

  // 4. NORTH: Delhi-NCR, Punjab, Haryana, HP, J&K, Uttarakhand, Western UP
  if (
    city.includes("delhi") ||
    city.includes("new delhi") ||
    city.includes("noida") ||
    city.includes("gurgaon") ||
    city.includes("gurugram") ||
    city.includes("faridabad") ||
    city.includes("ghaziabad") ||
    city.includes("chandigarh") ||
    city.includes("ludhiana") ||
    city.includes("amritsar") ||
    city.includes("jalandhar") ||
    city.includes("dehradun") ||
    city.includes("shimla") ||
    city.includes("jammu") ||
    city.includes("srinagar") ||
    state.includes("delhi") ||
    state.includes("punjab") ||
    state.includes("haryana") ||
    state.includes("himachal") ||
    state.includes("kashmir") ||
    state.includes("uttarakhand")
  ) {
    return {
      direction: "North",
      directionLabel: "Northern National Capital Corridor",
      reason: "Destination in Northern Zone. Assigned to Delhi-NCR National Fulfillment Gateway via Northern Express Trunk.",
      firstHubId: "HUB-DEL-01",
      firstHubName: "Delhi-NCR National Fulfillment Gateway",
      firstHubRegion: "Delhi-NCR (North Zone)",
      corridorMode: "train",
      vehicleNo: "IR-12434-RAJ",
      containerId: "STK-DEL-RAIL-01",
    };
  }

  // 5. WEST-INDUSTRIAL: Gujarat, Rajasthan
  if (
    city.includes("ahmedabad") ||
    city.includes("surat") ||
    city.includes("vadodara") ||
    city.includes("rajkot") ||
    city.includes("bhavnagar") ||
    city.includes("jaipur") ||
    city.includes("jodhpur") ||
    city.includes("udaipur") ||
    city.includes("kota") ||
    city.includes("ajmer") ||
    state.includes("gujarat") ||
    state.includes("rajasthan")
  ) {
    return {
      direction: "West-Industrial",
      directionLabel: "Western Dedicated Freight Corridor (Gujarat & Rajasthan)",
      reason: "Destination in Western Industrial Corridor. Assigned to Ahmedabad/Surat Industrial Hub via Western Dedicated Freight Corridor.",
      firstHubId: "HUB-AMD-01",
      firstHubName: "Ahmedabad / Surat Industrial Hub",
      firstHubRegion: "Ahmedabad / Surat, Gujarat (West-Industrial Zone)",
      corridorMode: "train",
      vehicleNo: "IR-12958-SWARNA",
      containerId: "STK-AMD-DFC-01",
    };
  }

  // 6. WEST: Maharashtra, Goa
  if (
    city.includes("mumbai") ||
    city.includes("pune") ||
    city.includes("navi mumbai") ||
    city.includes("thane") ||
    city.includes("nashik") ||
    city.includes("aurangabad") ||
    city.includes("kolhapur") ||
    city.includes("goa") ||
    city.includes("panaji") ||
    (state.includes("maharashtra") && !city.includes("nagpur")) ||
    state.includes("goa")
  ) {
    return {
      direction: "West",
      directionLabel: "Western Coastal Commercial Corridor",
      reason: "Destination in Western Coastal Zone (Mumbai/Pune). Assigned to Mumbai/Pune Western Gateway Hub.",
      firstHubId: "HUB-BOM-01",
      firstHubName: "Mumbai / Pune Western Gateway Hub",
      firstHubRegion: "Mumbai / Pune, Maharashtra (West Zone)",
      corridorMode: "plane",
      vehicleNo: "6E-CARGO-402",
      containerId: "STK-BOM-AIR-01",
    };
  }

  // 7. SOUTH-WEST: Karnataka, Kerala
  if (
    city.includes("bangalore") ||
    city.includes("bengaluru") ||
    city.includes("mysore") ||
    city.includes("hubli") ||
    city.includes("mangalore") ||
    city.includes("belgaum") ||
    city.includes("kochi") ||
    city.includes("cochin") ||
    city.includes("thiruvananthapuram") ||
    city.includes("trivandrum") ||
    city.includes("calicut") ||
    city.includes("kozhikode") ||
    state.includes("karnataka") ||
    state.includes("kerala")
  ) {
    return {
      direction: "South-West",
      directionLabel: "South-Western Tech & Coastal Corridor",
      reason: "Destination in South-West Zone. Assigned to Bengaluru South-West Tech & Fulfillment Hub.",
      firstHubId: "HUB-BLR-01",
      firstHubName: "Bengaluru South-West Tech & Fulfillment Hub",
      firstHubRegion: "Bengaluru, Karnataka (South-West Zone)",
      corridorMode: "plane",
      vehicleNo: "6E-CARGO-308",
      containerId: "STK-BLR-AIR-01",
    };
  }

  // 8. SOUTH-EAST: Tamil Nadu, Andhra Pradesh, Telangana
  if (
    city.includes("chennai") ||
    city.includes("coimbatore") ||
    city.includes("madurai") ||
    city.includes("salem") ||
    city.includes("tiruchirappalli") ||
    city.includes("hyderabad") ||
    city.includes("secunderabad") ||
    city.includes("visakhapatnam") ||
    city.includes("vijayawada") ||
    city.includes("guntur") ||
    city.includes("tirupati") ||
    city.includes("warangal") ||
    state.includes("tamil nadu") ||
    state.includes("andhra") ||
    state.includes("telangana")
  ) {
    return {
      direction: "South-East",
      directionLabel: "South-Eastern Coastal & Tech Corridor",
      reason: "Destination in South-East Zone. Assigned to Chennai South-East Coastal Hub.",
      firstHubId: "HUB-MAA-01",
      firstHubName: "Chennai South-East Coastal Hub",
      firstHubRegion: "Chennai, Tamil Nadu (South-East Zone)",
      corridorMode: "plane",
      vehicleNo: "6E-CARGO-502",
      containerId: "STK-MAA-AIR-01",
    };
  }

  // 9. CENTRAL ZERO-MILE (Nagpur, MP, Chhattisgarh)
  return {
    direction: "Central",
    directionLabel: "Central Zero-Mile Zone (Nagpur, MP & Chhattisgarh)",
    reason: "Destination in Central Corridor. Direct dispatch from Central Stock Center to Nagpur Central Multi-Modal Hub.",
    firstHubId: "HUB-NAG-01",
    firstHubName: "Nagpur Central Multi-Modal Logistics Hub",
    firstHubRegion: "Nagpur, MP/Maharashtra Border (Central Zone)",
    corridorMode: "truck",
    vehicleNo: "MH-31-TRK-5520",
    containerId: "STK-NAG-CTR-01",
  };
}

/**
 * Automatically creates a deterministic, scalable multi-hub sequence for an order
 * based on customer destination starting from the Central Stock Center.
 */
export function generateRouteForOrder(order: Partial<Order>): ShipmentRouteLeg[] {
  const customer = order.customer || {
    fullName: "Customer",
    email: "customer@example.com",
    address: "",
    city: "Asansol",
    state: "West Bengal",
    zipCode: "713301",
    country: "India",
  };

  const isNewlyCreatedOrProcessing =
    !order.deliveryStatus ||
    order.deliveryStatus === "processing" ||
    order.hubQueueStatus === "packaging";

  const isDelivered = order.deliveryStatus === "delivered";
  const isOutOfDelivery = order.deliveryStatus === "out_for_delivery";
  const isInTransit = order.deliveryStatus === "dispatched" || order.deliveryStatus === "locations_arrive";

  // When order is newly created / processing, legs start in pending/scheduled status (NO instant teleportation)
  const leg1Status = isNewlyCreatedOrProcessing
    ? "pending"
    : isInTransit
    ? "dispatched"
    : "completed";

  const leg2Status = isNewlyCreatedOrProcessing
    ? "pending"
    : isInTransit
    ? "incoming"
    : (isOutOfDelivery || isDelivered ? "completed" : "pending");

  const leg3Status = isNewlyCreatedOrProcessing
    ? "pending"
    : (isOutOfDelivery || isDelivered ? "completed" : "pending");

  const corridor = getDirectionCorridorDecision(customer);
  const city = (customer.city || "").toLowerCase();
  const state = (customer.state || "").toLowerCase();

  // 1. Northeast Corridor (Guwahati Gateway)
  if (corridor.direction === "Northeast") {
    return [
      {
        sequence: 1,
        hubId: "HUB-GAU-01",
        hubName: "Guwahati Northeast Gateway Hub",
        region: "Guwahati, Assam (Northeast Zone)",
        status: leg1Status,
        transportMode: "plane",
        vehicleNo: "6E-CARGO-701",
        containerId: "STK-GAU-AIR-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-GAU-LOCAL",
        hubName: "Northeast Regional Postal & Courier Hub",
        region: `${customer.city || "Guwahati"}, ${customer.state || "Assam"}`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "AS-01-EXP-8810",
        containerId: "GAU-LOCAL-09",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 2. East-Central Corridor (Bihar & UP)
  if (corridor.direction === "East-Central") {
    const isBihar = state.includes("bihar") || city.includes("patna") || city.includes("gaya") || city.includes("rathur") || city.includes("bhagalpur") || city.includes("muzaffarpur");
    return [
      {
        sequence: 1,
        hubId: "HUB-LKO-01",
        hubName: "Lucknow East-Central Logistics Center",
        region: "Lucknow, Uttar Pradesh (East-Central Zone)",
        status: leg1Status,
        transportMode: "train",
        vehicleNo: "IR-12004-SHATABDI",
        containerId: "STK-LKO-RAIL-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: isBihar ? "HUB-PAT-01" : "HUB-LKO-LOCAL",
        hubName: isBihar ? "Patna Regional Distribution Center" : "Central UP Regional Express Hub",
        region: isBihar ? "Patna, Bihar (East-Central Zone)" : `${customer.city || "Lucknow"}, UP`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: isBihar ? "BR-01-EXP-7720" : "UP-32-EXP-9921",
        containerId: isBihar ? "LKO-PAT-EXP-08" : "LKO-LOCAL-08",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 3. Eastern Corridor (West Bengal, Odisha, Jharkhand)
  if (corridor.direction === "East") {
    const isAsansolBelt = city.includes("asansol") || city.includes("durgapur") || city.includes("burdwan");
    return [
      {
        sequence: 1,
        hubId: "HUB-CCU-01",
        hubName: "Kolkata Eastern Logistics Gateway",
        region: "Kolkata, West Bengal (East Zone)",
        status: leg1Status,
        transportMode: "train",
        vehicleNo: "IR-12302-RAJ",
        containerId: "STK-CCU-RAIL-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: isAsansolBelt ? "HUB-ASN-01" : "HUB-CCU-LOCAL",
        hubName: isAsansolBelt ? "Asansol Regional Sorting Center" : "Kolkata Metropolitan Delivery Hub",
        region: isAsansolBelt ? "Asansol Zone, West Bengal, IN" : "Kolkata Urban Belt, West Bengal",
        status: leg2Status,
        transportMode: "van",
        vehicleNo: isAsansolBelt ? "WB-38-VAN-9920" : "WB-02-EXP-3319",
        containerId: isAsansolBelt ? "KOL-ASN-0001" : "CCU-LOCAL-10",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 4. Northern Corridor (Delhi-NCR, Punjab, Haryana, etc.)
  if (corridor.direction === "North") {
    return [
      {
        sequence: 1,
        hubId: "HUB-DEL-01",
        hubName: "Delhi-NCR National Fulfillment Gateway",
        region: "Delhi-NCR (North Zone)",
        status: leg1Status,
        transportMode: "train",
        vehicleNo: "IR-12434-RAJ",
        containerId: "STK-DEL-RAIL-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-DEL-LOCAL",
        hubName: "North Zone Regional Sorting Center",
        region: `${customer.city || "Delhi-NCR"}, Northern Zone`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "DL-01-EXP-1102",
        containerId: "DEL-LOCAL-04",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 5. West-Industrial Corridor (Gujarat, Rajasthan)
  if (corridor.direction === "West-Industrial") {
    return [
      {
        sequence: 1,
        hubId: "HUB-AMD-01",
        hubName: "Ahmedabad / Surat Industrial Hub",
        region: "Ahmedabad / Surat, Gujarat (West-Industrial Zone)",
        status: leg1Status,
        transportMode: "train",
        vehicleNo: "IR-12958-SWARNA",
        containerId: "STK-AMD-DFC-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-AMD-LOCAL",
        hubName: "Western Industrial Express Hub",
        region: `${customer.city || "Ahmedabad"}, Gujarat / Rajasthan`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "GJ-01-EXP-4411",
        containerId: "AMD-IND-04",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 6. Western Coastal Corridor (Mumbai, Pune)
  if (corridor.direction === "West") {
    return [
      {
        sequence: 1,
        hubId: "HUB-BOM-01",
        hubName: "Mumbai / Pune Western Gateway Hub",
        region: "Mumbai / Pune, Maharashtra (West Zone)",
        status: leg1Status,
        transportMode: "plane",
        vehicleNo: "6E-CARGO-402",
        containerId: "STK-BOM-AIR-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-BOM-LOCAL",
        hubName: "Mumbai Metropolitan Express Depot",
        region: `${customer.city || "Mumbai"}, Maharashtra`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "MH-01-EXP-9901",
        containerId: "BOM-METRO-02",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 7. South-Western Corridor (Bengaluru, Kerala)
  if (corridor.direction === "South-West") {
    return [
      {
        sequence: 1,
        hubId: "HUB-BLR-01",
        hubName: "Bengaluru South-West Tech & Fulfillment Hub",
        region: "Bengaluru, Karnataka (South-West Zone)",
        status: leg1Status,
        transportMode: "plane",
        vehicleNo: "6E-CARGO-308",
        containerId: "STK-BLR-AIR-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-BLR-LOCAL",
        hubName: "South-West Tech Distribution Hub",
        region: `${customer.city || "Bengaluru"}, South-West Zone`,
        status: leg2Status,
        transportMode: "bike",
        vehicleNo: "KA-01-BK-4092",
        containerId: "BLR-SW-01",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 8. South-Eastern Corridor (Chennai, Hyderabad)
  if (corridor.direction === "South-East") {
    return [
      {
        sequence: 1,
        hubId: "HUB-MAA-01",
        hubName: "Chennai South-East Coastal Hub",
        region: "Chennai, Tamil Nadu (South-East Zone)",
        status: leg1Status,
        transportMode: "plane",
        vehicleNo: "6E-CARGO-502",
        containerId: "STK-MAA-AIR-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-MAA-LOCAL",
        hubName: "South-East Regional Courier Depot",
        region: `${customer.city || "Chennai"}, South-East Zone`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "TN-01-EXP-6622",
        containerId: "MAA-SE-02",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 9. Central Zero-Mile Zone (Nagpur, MP, Chhattisgarh)
  if (corridor.direction === "Central") {
    return [
      {
        sequence: 1,
        hubId: "HUB-NAG-01",
        hubName: "Nagpur Central Multi-Modal Logistics Hub",
        region: "Nagpur, MP/Maharashtra Border (Central Zone)",
        status: leg1Status,
        transportMode: "truck",
        vehicleNo: "MH-31-TRK-5520",
        containerId: "STK-NAG-CTR-01",
        dispatchCategory: "b2b_bulk_freight",
      },
      {
        sequence: 2,
        hubId: "HUB-NAG-LOCAL",
        hubName: "Central Zero-Mile Intra-City Depot",
        region: `${customer.city || "Nagpur"}, Central Zone`,
        status: leg2Status,
        transportMode: "van",
        vehicleNo: "MH-31-EXP-1120",
        containerId: "NAG-LOCAL-03",
        dispatchCategory: "b2c_individual_courier",
      },
    ];
  }

  // 10. International (US / Europe / Global)
  return [
    {
      sequence: 1,
      hubId: "HUB-PDX-01",
      hubName: "Portland Primary Logistics Center",
      region: "Oregon, US",
      status: leg1Status,
      transportMode: "truck",
      vehicleNo: "OR-TRK-5555",
      containerId: "PDX-FRA-099",
      dispatchCategory: "b2b_bulk_freight",
    },
    {
      sequence: 2,
      hubId: "HUB-FRA-01",
      hubName: "Frankfurt Central Air Logistics Hub",
      region: "Frankfurt, DE",
      status: leg2Status,
      transportMode: "plane",
      vehicleNo: "LH-CARGO-772",
      containerId: "FRA-REG-011",
      dispatchCategory: "b2b_bulk_freight",
    },
    {
      sequence: 3,
      hubId: "HUB-LHR-01",
      hubName: "London Heathrow Gateway Hub",
      region: "London, UK",
      status: leg3Status,
      transportMode: "van",
      vehicleNo: "LDN-VAN-12",
      containerId: "LHR-FINAL-99",
      dispatchCategory: "b2c_individual_courier",
    },
  ];
}

/**
 * Ensures an order has a valid multi-leg route and aligned current/next hub attributes
 */
export function ensureOrderRoute(order: Order): Order {
  const route = Array.isArray(order.route) && order.route.length > 0
    ? order.route
    : generateRouteForOrder(order);

  // 1. If order is delivered, everything is completed
  if (order.deliveryStatus === "delivered") {
    const lastLeg = route[route.length - 1];
    return {
      ...order,
      route,
      currentHubId: lastLeg?.hubId || "HUB-ASN-01",
      currentHub: lastLeg?.hubName || order.currentHub || "Asansol Regional Sorting Center",
      currentRegion: lastLeg?.region || order.currentRegion || "Asansol Zone, West Bengal, IN",
      nextHubId: undefined,
      nextHub: "Customer Doorstep (Delivered)",
      nextRegion: order.customer.city || "Destination",
      hubQueueStatus: "delivered",
    };
  }

  // 2. If order is newly placed / in packaging stage at Central Stock Center (Origin)
  if (!order.deliveryStatus || order.deliveryStatus === "processing" || order.hubQueueStatus === "packaging") {
    const firstLeg = route[0];
    return {
      ...order,
      route,
      currentHubId: CENTRAL_STOCK_CENTER.id,
      currentHub: CENTRAL_STOCK_CENTER.name,
      currentRegion: CENTRAL_STOCK_CENTER.region,
      nextHubId: firstLeg?.hubId,
      nextHub: firstLeg ? firstLeg.hubName : "1st Regional Transit Hub",
      nextRegion: firstLeg ? firstLeg.region : "Destination Regional Corridor",
      transitMode: firstLeg?.transportMode || "van",
      vehicleNo: firstLeg?.vehicleNo || "STK-EXP-01",
      containerId: firstLeg?.containerId || "STK-CORR-01",
      dispatchCategory: firstLeg?.dispatchCategory || "b2b_bulk_freight",
      railFreight: firstLeg?.railFreight || order.railFreight,
      airCargo: firstLeg?.airCargo || order.airCargo,
      courierService: firstLeg?.courierService || order.courierService,
      hubQueueStatus: "packaging",
    };
  }

  // 3. For orders in transit / shipped: find current active leg (first leg not marked 'completed')
  let activeLegIndex = route.findIndex((l) => l.status !== "completed");
  if (activeLegIndex === -1) activeLegIndex = route.length - 1;

  const currentLeg = route[activeLegIndex] || route[0];
  const nextLeg = route[activeLegIndex + 1];

  let derivedQueueStatus: HubQueueStatus = order.hubQueueStatus || "sorting";

  if (order.deliveryStatus === "out_for_delivery" && !nextLeg) {
    derivedQueueStatus = "gate_handover";
  } else if (currentLeg.status === "incoming") {
    derivedQueueStatus = "incoming";
  } else if (currentLeg.status === "received") {
    derivedQueueStatus = "received";
  } else if (currentLeg.status === "sorting") {
    derivedQueueStatus = "sorting";
  } else if (currentLeg.status === "loading") {
    derivedQueueStatus = "loading";
  } else if (currentLeg.status === "dispatched") {
    derivedQueueStatus = "outgoing";
  }

  return {
    ...order,
    route,
    currentHubId: currentLeg?.hubId || CENTRAL_STOCK_CENTER.id,
    currentHub: currentLeg?.hubName || CENTRAL_STOCK_CENTER.name,
    currentRegion: currentLeg?.region || CENTRAL_STOCK_CENTER.region,
    nextHubId: nextLeg?.hubId,
    nextHub: nextLeg ? nextLeg.hubName : "Customer Doorstep Delivery Gate",
    nextRegion: nextLeg ? nextLeg.region : `${order.customer.city}, ${order.customer.state}`,
    transitMode: currentLeg?.transportMode || order.transitMode || "truck",
    vehicleNo: currentLeg?.vehicleNo || order.vehicleNo || "STK-TRK-01",
    containerId: currentLeg?.containerId || order.containerId || "STK-KOL-01",
    dispatchCategory: currentLeg?.dispatchCategory || order.dispatchCategory || ((currentLeg?.transportMode === "train" || currentLeg?.transportMode === "plane") ? "b2b_bulk_freight" : "b2c_individual_courier"),
    railFreight: currentLeg?.railFreight || order.railFreight,
    airCargo: currentLeg?.airCargo || order.airCargo,
    courierService: currentLeg?.courierService || order.courierService,
    hubQueueStatus: derivedQueueStatus,
  };
}

export interface HubFilteredQueue {
  hub: LogisticsHub;
  incoming: Order[];
  received: Order[];
  sorting: Order[];
  loading: Order[];
  outgoing: Order[];
  gateHandover: Order[];
  totals: {
    incoming: number;
    received: number;
    sorting: number;
    loading: number;
    outgoing: number;
    gateHandover: number;
    totalActive: number;
  };
}

/**
 * Filter orders into operational queues (incoming, received, sorting, loading, outgoing) + gate handover for a specific hub
 */
export function getHubOperationsQueue(orders: Order[], hubId: string): HubFilteredQueue {
  const hub = getHubById(hubId) || STANDARD_HUBS[0];
  const normalizedOrders = orders.map(ensureOrderRoute);

  const incoming: Order[] = [];
  const received: Order[] = [];
  const sorting: Order[] = [];
  const loading: Order[] = [];
  const outgoing: Order[] = [];
  const gateHandover: Order[] = [];

  for (const ord of normalizedOrders) {
    if (ord.deliveryStatus === "delivered" || ord.deliveryStatus === "cancelled") {
      continue;
    }

    const route = ord.route || [];
    const thisLegIndex = route.findIndex((l) => l.hubId.toLowerCase() === hub.id.toLowerCase());

    if (thisLegIndex === -1) {
      // 0. Dedicated Handling for Central Stock & Packaging Station (Origin)
      if (hub.id === "STOCK-CTR-01" || hub.id === "STK-CTR-01") {
        const isAtOrigin =
          ord.currentHubId === "STOCK-CTR-01" ||
          ord.currentHubId === "STK-CTR-01" ||
          ord.hubQueueStatus === "packaging" ||
          (!ord.deliveryStatus || ord.deliveryStatus === "processing" || ord.deliveryStatus === "order_created");

        if (isAtOrigin) {
          if (ord.hubQueueStatus === "received") received.push(ord);
          else if (ord.hubQueueStatus === "sorting") sorting.push(ord);
          else if (ord.hubQueueStatus === "loading") loading.push(ord);
          else if (ord.hubQueueStatus === "outgoing") outgoing.push(ord);
          else incoming.push(ord); // newly placed orders awaiting packaging & QC
          continue;
        }
      }

      // Hub is not in route; check if it matches currentHub name or fallback
      if (ord.currentHub?.toLowerCase().includes(hub.name.toLowerCase())) {
        if (ord.hubQueueStatus === "received") received.push(ord);
        else if (ord.hubQueueStatus === "sorting") sorting.push(ord);
        else if (ord.hubQueueStatus === "loading") loading.push(ord);
        else if (ord.hubQueueStatus === "outgoing") outgoing.push(ord);
        else incoming.push(ord);
      }
      continue;
    }

    const thisLeg = route[thisLegIndex];
    const prevLeg = route[thisLegIndex - 1];
    const nextLeg = route[thisLegIndex + 1];

    // 1. INCOMING: Upstream leg was dispatched or this leg is marked 'incoming'
    if (
      thisLeg.status === "incoming" ||
      (prevLeg && prevLeg.status === "dispatched" && thisLeg.status === "pending")
    ) {
      incoming.push(ord);
      continue;
    }

    // 2. RECEIVED: Parcel has arrived and scanned at this hub dock
    if (thisLeg.status === "received" || (ord.currentHubId === hub.id && ord.hubQueueStatus === "received")) {
      received.push(ord);
      continue;
    }

    // 3. SORTING: Under sorting dock and destination assignment
    if (thisLeg.status === "sorting" || (ord.currentHubId === hub.id && ord.hubQueueStatus === "sorting")) {
      sorting.push(ord);
      continue;
    }

    // 4. LOADING: Staged in vehicle loading bay awaiting manifest completion & dispatch
    if (thisLeg.status === "loading" || (ord.currentHubId === hub.id && ord.hubQueueStatus === "loading")) {
      loading.push(ord);
      continue;
    }

    // 5. OUTGOING: Loaded on vehicle and dispatched outbound [On the way]
    if (thisLeg.status === "dispatched" || (ord.currentHubId === hub.id && ord.hubQueueStatus === "outgoing")) {
      outgoing.push(ord);
      continue;
    }

    // 6. GATE HANDOVER: If this hub is the final delivery station and courier is out at gate
    if (!nextLeg && (ord.deliveryStatus === "out_for_delivery" || ord.gateOtpSession?.active)) {
      gateHandover.push(ord);
      continue;
    }

    // Fallback: If currentHub matches this hub and status is pending, place in incoming or received
    if (ord.currentHubId === hub.id) {
      if (thisLeg.status === "pending") incoming.push(ord);
      else sorting.push(ord);
    }
  }

  return {
    hub,
    incoming,
    received,
    sorting,
    loading,
    outgoing,
    gateHandover,
    totals: {
      incoming: incoming.length,
      received: received.length,
      sorting: sorting.length,
      loading: loading.length,
      outgoing: outgoing.length,
      gateHandover: gateHandover.length,
      totalActive: incoming.length + received.length + sorting.length + loading.length + outgoing.length + gateHandover.length,
    },
  };
}

export interface LogisticsJourneyStep {
  stepType: "order_creation" | "hub_in_out" | "out_for_delivery" | "delivered" | "gate_exception" | "rto_step";
  title: string;
  hubNumber?: number;
  hubName?: string;
  hubCode?: string;
  inTime?: string;
  outTime?: string;
  timestamp?: string;
  status: "completed" | "in_progress" | "pending" | "failed";
  details?: string;
  badge?: string;
}

/**
 * Formats the exact industrial paired timeline specified in the user whiteboard:
 * - Order creation [d & time]
 * - in hub1 [d & time] - out hub1 [d & time]
 * - in hub2 [d & time] - out hub2 [d & time]
 * - in hub3 [d & time] - out hub3 [d & time]
 * - Out for delivery [d & time]
 * - delivered [d & time] (or Gate Exception / RTO retrieval)
 */
export function formatLogisticsJourneyLogs(order: Order): LogisticsJourneyStep[] {
  const steps: LogisticsJourneyStep[] = [];
  const route = order.route && order.route.length > 0 ? order.route : generateRouteForOrder(order);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoStr;
    }
  };

  const isNewlyCreatedOrProcessing =
    !order.deliveryStatus ||
    order.deliveryStatus === "processing" ||
    order.hubQueueStatus === "packaging";

  const corridor = getDirectionCorridorDecision(order.customer);

  // 1. Order Creation Step
  const orderCreatedEv = (order.events || []).find((e) => e.title.toLowerCase().includes("order created") || e.title.toLowerCase().includes("order placed"));
  const createdTime = orderCreatedEv?.timestamp || order.createdAt || new Date().toISOString();

  if (isNewlyCreatedOrProcessing) {
    steps.push({
      stepType: "order_creation",
      title: `Order Creation & Packaging Stage [${formatDate(createdTime)}]`,
      timestamp: formatDate(createdTime),
      status: "in_progress",
      details: `Order placed & verified. Package currently at Central Stock & Fulfillment Center (${CENTRAL_STOCK_CENTER.region}). Undergoing acoustic QA inspection, precision boxing, and assignment to 1st transit hub (${corridor.firstHubName}) based on delivery direction.`,
      badge: "PACKAGING STAGE",
    });
  } else {
    steps.push({
      stepType: "order_creation",
      title: `Order creation [${formatDate(createdTime)}]`,
      timestamp: formatDate(createdTime),
      status: "completed",
      details: "Order placed & verified · Boxed and dispatched from Central Stock Center",
      badge: "Origin Pack Complete",
    });
  }

  // 2. Multi-Hub In/Out Steps (hub1, hub2, hub3...)
  route.forEach((leg, idx) => {
    const hubNum = leg.sequence || idx + 1;
    const isCompleted = leg.status === "completed";
    const isActive = leg.status === "received" || leg.status === "sorting" || leg.status === "loading" || leg.status === "dispatched";

    if (isNewlyCreatedOrProcessing) {
      steps.push({
        stepType: "hub_in_out",
        hubNumber: hubNum,
        hubName: leg.hubName,
        hubCode: leg.hubCode || leg.hubId,
        title: idx === 0
          ? `in hub${hubNum} [Awaiting Central Stock Center Dispatch] - out hub${hubNum} [Scheduled]`
          : `in hub${hubNum} [Scheduled Regional Transfer] - out hub${hubNum} [Scheduled]`,
        inTime: "",
        outTime: "",
        status: "pending",
        details: `${leg.hubName} (${leg.region}) · Fleet: ${String(leg.transportMode || "truck").toUpperCase()} ${leg.vehicleNo ? `[${leg.vehicleNo}]` : ""} · Corridor: ${corridor.directionLabel}`,
        badge: idx === 0 ? "1st Transit Hub (Scheduled)" : "2nd Regional Sub-Hub (Pending)",
      });
      return;
    }

    // Approximate timestamps from events or leg data if not explicitly set
    let inTime = leg.inHubAt || leg.receivedAt;
    let outTime = leg.outHubAt || leg.dispatchedAt;

    if (!inTime) {
      if (idx === 0) {
        inTime = order.createdAt;
      } else {
        const inEv = (order.events || []).find((e) => e.title.toLowerCase().includes(`received at ${leg.hubName.toLowerCase()}`) || e.description.toLowerCase().includes(leg.hubName.toLowerCase()));
        if (inEv) inTime = inEv.timestamp;
        else if (isCompleted || isActive) {
          // Synthetic realistic offset based on sequence
          const baseDate = new Date(order.createdAt).getTime();
          inTime = new Date(baseDate + idx * 8 * 3600 * 1000).toISOString();
        }
      }
    }

    if (!outTime) {
      const outEv = (order.events || []).find((e) => (e.title.toLowerCase().includes("dispatched") || e.title.toLowerCase().includes("on the way")) && (e.title.toLowerCase().includes(leg.hubName.toLowerCase()) || e.description.toLowerCase().includes(leg.hubName.toLowerCase())));
      if (outEv) outTime = outEv.timestamp;
      else if (isCompleted) {
        const baseDate = inTime ? new Date(inTime).getTime() : new Date(order.createdAt).getTime();
        outTime = new Date(baseDate + 3 * 3600 * 1000).toISOString();
      }
    }

    steps.push({
      stepType: "hub_in_out",
      hubNumber: hubNum,
      hubName: leg.hubName,
      hubCode: leg.hubCode || leg.hubId,
      title: `in hub${hubNum} [${formatDate(inTime) || "Pending Dock Scan"}] - out hub${hubNum} [${formatDate(outTime) || (isActive ? "Staging / Active" : "Pending")}]`,
      inTime: formatDate(inTime),
      outTime: formatDate(outTime),
      status: isCompleted ? "completed" : isActive ? "in_progress" : "pending",
      details: `${leg.hubName} (${leg.region}) · Fleet: ${String(leg.transportMode || "truck").toUpperCase()} ${leg.vehicleNo ? `[${leg.vehicleNo}]` : ""}`,
      badge: isCompleted ? "Departed Hub" : isActive ? "Inside Hub Operations" : "Scheduled",
    });
  });

  // 3. Out for delivery Step
  const outForDeliveryEv = (order.events || []).find((e) => e.title.toLowerCase().includes("out for delivery") || e.title.toLowerCase().includes("on the way near location"));
  const isOutOfDelivery = order.deliveryStatus === "out_for_delivery" || order.deliveryStatus === "delivered" || String(order.deliveryStatus || "").startsWith("rto_");
  const outTime = outForDeliveryEv?.timestamp || (!isNewlyCreatedOrProcessing && isOutOfDelivery ? new Date(new Date(order.createdAt).getTime() + 32 * 3600 * 1000).toISOString() : undefined);

  steps.push({
    stepType: "out_for_delivery",
    title: isNewlyCreatedOrProcessing
      ? "Out for delivery [Awaiting Regional Hub Arrival]"
      : `Out for delivery [${formatDate(outTime) || "Awaiting Final Hub Dispatch"}]`,
    timestamp: formatDate(outTime),
    status: isNewlyCreatedOrProcessing
      ? "pending"
      : order.deliveryStatus === "delivered" || String(order.deliveryStatus || "").startsWith("rto_")
      ? "completed"
      : order.deliveryStatus === "out_for_delivery"
      ? "in_progress"
      : "pending",
    details: isNewlyCreatedOrProcessing
      ? "Last-mile courier will be scheduled once the package completes multi-hub transit to the regional hub"
      : "Package on the way near location · Arrives in afternoon/evening window",
    badge: isNewlyCreatedOrProcessing ? "Pending Last-Mile" : "Last-Mile Active",
  });

  // 4. Gate / Handover / Delivered Step OR Gate Exception RTO
  if (String(order.deliveryStatus || "").startsWith("rto_") || order.gateException) {
    const exc = order.gateException;
    const excReason = exc?.reason === "damaged_package"
      ? "Package Damaged / Unstable Shape (Refused by customer)"
      : exc?.reason === "customer_out_of_station"
      ? "Customer Out of Station / Unreachable"
      : "Customer Bad Treatment Exception / Refused [Red Flag Customer]";

    steps.push({
      stepType: "gate_exception",
      title: `Gate Refusal Exception [${formatDate(exc?.reportedAt) || "Gate Rejection"}]`,
      timestamp: formatDate(exc?.reportedAt),
      status: "failed",
      details: `${excReason} · Initiating Return to Origin (RTO)`,
      badge: exc?.isRedFlagCustomer ? "RED FLAG CUSTOMER" : "RTO INITIATED",
    });

    if (order.rtoDetails) {
      steps.push({
        stepType: "rto_step",
        title: `RTO Reverse Logistics [Tracking: ${order.rtoDetails.returnTrackingNumber}]`,
        timestamp: formatDate(order.rtoDetails.initiatedAt),
        status: order.rtoDetails.returnStatus === "restocked_refunded" ? "completed" : "in_progress",
        details: `Reverse flow: ${order.rtoDetails.currentReturnHubId} ➔ Reverse Line-Haul ➔ ${order.rtoDetails.destinationOriginHubId} (Origin Warehouse)`,
        badge: order.rtoDetails.returnStatus.replace("_", " ").toUpperCase(),
      });
    }
  } else {
    const deliveredEv = (order.events || []).find((e) => e.title.toLowerCase().includes("delivered") || e.title.toLowerCase().includes("handover completed"));
    const isDelivered = order.deliveryStatus === "delivered";
    const delivTime = deliveredEv?.timestamp || (isDelivered ? new Date().toISOString() : undefined);

    steps.push({
      stepType: "delivered",
      title: `delivered [${formatDate(delivTime) || "Pending Handover"}]`,
      timestamp: formatDate(delivTime),
      status: isDelivered ? "completed" : "pending",
      details: isDelivered ? "Doorstep Handover Complete: Customer 6-Digit OTP verified + 2 PoD photos archived in S3 vault" : "Pending arrival at customer address",
      badge: isDelivered ? "Verified & Delivered ✓" : "Pending Gate Verification",
    });
  }

  return steps;
}

/**
 * Generates reverse routing legs for an order returned from the gate back to origin
 */
export function generateRtoReverseRoute(order: Order): ShipmentRouteLeg[] {
  const forwardRoute = order.route && order.route.length > 0 ? order.route : generateRouteForOrder(order);
  const now = new Date().toISOString();

  // Reverse the sequence: last hub (e.g. HUB-ASN-01) -> intermediate (HUB-CCU-01) -> origin (HUB-DEL-01)
  const reversed: ShipmentRouteLeg[] = [];
  const len = forwardRoute.length;

  for (let i = len - 1; i >= 0; i--) {
    const fLeg = forwardRoute[i];
    const isFirstReturnLeg = (i === len - 1);
    const seq = len - i;

    reversed.push({
      sequence: seq,
      hubId: fLeg.hubId,
      hubCode: fLeg.hubCode,
      hubName: `${fLeg.hubName} (RTO Dock)`,
      region: fLeg.region,
      status: isFirstReturnLeg ? "received" : "pending",
      transportMode: fLeg.transportMode || "truck",
      vehicleNo: `RET-${fLeg.vehicleNo || "WB-TRK-900"}`,
      containerId: `RTO-CONT-${order.orderNumber}`,
      dispatchCategory: "b2b_bulk_freight",
      receivedAt: isFirstReturnLeg ? now : undefined,
      inHubAt: isFirstReturnLeg ? now : undefined,
      isReturnLeg: true,
    });
  }

  return reversed;
}

export interface CustomerTrackingStep {
  id: string;
  title: string;
  description?: string;
  location?: string;
  timestamp?: string;
  status: "completed" | "current" | "pending";
  isHubArrival?: boolean;
}

export interface CustomerTrackingSummary {
  etaHeadline: string;
  etaSubtitle: string;
  statusBadge: string;
  steps: CustomerTrackingStep[];
  latestUpdate?: string;
}

/**
 * Creates a clean, consumer-friendly Amazon-style tracking timeline.
 * Does NOT prematurely disclose upcoming hubs until the package has physically arrived.
 */
export function getCustomerTrackingTimeline(order: Order): CustomerTrackingSummary {
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  const isDelivered = order.deliveryStatus === "delivered";
  const isOutOfDelivery = order.deliveryStatus === "out_for_delivery";
  const isCancelled = order.deliveryStatus === "cancelled" || order.cancellation?.status === "approved";
  const isRto = String(order.deliveryStatus || "").startsWith("rto_");

  const orderCreatedEv = (order.events || []).find(
    (e) => e.title.toLowerCase().includes("order created") || e.title.toLowerCase().includes("order placed")
  );
  const createdTime = orderCreatedEv?.timestamp || order.createdAt || new Date().toISOString();

  // Check if order has been packed at Central Stock Center
  const packedEv = (order.events || []).find(
    (e) => e.title.toLowerCase().includes("packed") || e.title.toLowerCase().includes("packaging")
  );
  const packedTime = packedEv?.timestamp || new Date(new Date(createdTime).getTime() + 25 * 60 * 1000).toISOString();

  // Check if dispatched from Central Stock Center
  const dispatchedEv = (order.events || []).find(
    (e) => e.title.toLowerCase().includes("dispatched") || e.title.toLowerCase().includes("on the way")
  );
  const isDispatched =
    order.deliveryStatus === "dispatched" ||
    order.deliveryStatus === "locations_arrive" ||
    order.deliveryStatus === "out_for_delivery" ||
    isDelivered ||
    isRto ||
    Boolean(dispatchedEv) ||
    Boolean(order.route && order.route.some((r) => r.status === "dispatched" || r.status === "completed" || r.status === "received"));

  const dispatchTime = dispatchedEv?.timestamp || (isDispatched ? new Date(new Date(createdTime).getTime() + 3 * 3600 * 1000).toISOString() : undefined);

  const steps: CustomerTrackingStep[] = [];

  // 1. Order Placed
  steps.push({
    id: "order_placed",
    title: "Order Placed",
    description: "We have received your order and payment is verified.",
    timestamp: formatDate(createdTime),
    status: "completed",
  });

  // 2. Order Packed
  steps.push({
    id: "order_packed",
    title: "Order Packed",
    description: "Your order has been quality checked and packed at the Central Stock Center.",
    location: "Central Stock & Fulfillment Center",
    timestamp: formatDate(packedTime),
    status: "completed",
  });

  // 3. Dispatch Status
  if (!isDispatched) {
    steps.push({
      id: "ready_dispatch",
      title: "Ready for Dispatch",
      description: "Package is boxed and queued for carrier line-haul pickup.",
      location: "Central Stock & Fulfillment Center",
      status: "current",
    });
  } else {
    steps.push({
      id: "dispatched_central",
      title: "Dispatched from Central Stock Center",
      description: "Package handed over to carrier line-haul network and in transit.",
      location: "Central Stock & Fulfillment Center",
      timestamp: formatDate(dispatchTime),
      status: "completed",
    });
  }

  // 4. Dynamic Hub Arrivals (Only revealed when reached / arrived)
  const route = Array.isArray(order.route) ? order.route : [];
  route.forEach((leg, idx) => {
    const legArrivedEv = (order.events || []).find(
      (e) =>
        (e.title.toLowerCase().includes("received at") || e.title.toLowerCase().includes("arrived at")) &&
        (e.title.toLowerCase().includes(leg.hubName.toLowerCase()) || (leg.hubCode && e.title.toLowerCase().includes(leg.hubCode.toLowerCase())))
    );

    const hasReached =
      leg.status === "received" ||
      leg.status === "sorting" ||
      leg.status === "loading" ||
      leg.status === "dispatched" ||
      leg.status === "completed" ||
      Boolean(legArrivedEv);

    if (hasReached) {
      const isLegDeparted = leg.status === "dispatched" || leg.status === "completed";
      const legTime = legArrivedEv?.timestamp || leg.inHubAt || leg.receivedAt || (isLegDeparted ? leg.outHubAt : undefined);

      const subsequentReached =
        isOutOfDelivery ||
        isDelivered ||
        route.slice(idx + 1).some((nxt) => nxt.status === "received" || nxt.status === "sorting" || nxt.status === "dispatched" || nxt.status === "completed");

      steps.push({
        id: `hub_${leg.hubId || idx}`,
        title: isLegDeparted ? `Departed from ${leg.hubName}` : `Arrived at ${leg.hubName}`,
        description: isLegDeparted
          ? "Package has departed and is moving towards the destination regional station."
          : "Package arrived and is undergoing intake scanning & sorting.",
        location: leg.region,
        timestamp: formatDate(legTime),
        status: subsequentReached || isLegDeparted ? "completed" : "current",
        isHubArrival: true,
      });
    }
  });

  // 5. Out for Delivery
  const outEv = (order.events || []).find(
    (e) => e.title.toLowerCase().includes("out for delivery") || e.title.toLowerCase().includes("on the way near location")
  );
  const outTime = outEv?.timestamp;

  steps.push({
    id: "out_for_delivery",
    title: "Out for Delivery",
    description: isOutOfDelivery
      ? "Arriving today · Package is out with your local delivery courier."
      : isDelivered
      ? "Package was out with courier."
      : "Scheduled for local delivery once package arrives at your city's station.",
    timestamp: isOutOfDelivery || isDelivered ? formatDate(outTime) : undefined,
    status: isDelivered ? "completed" : isOutOfDelivery ? "current" : "pending",
  });

  // 6. Delivered
  const delivEv = (order.events || []).find(
    (e) => e.title.toLowerCase().includes("delivered") || e.title.toLowerCase().includes("handover completed")
  );
  const delivTime = delivEv?.timestamp;

  steps.push({
    id: "delivered",
    title: "Delivered",
    description: isDelivered
      ? "Package delivered and safely handed over to customer."
      : "Delivery at customer doorstep.",
    timestamp: isDelivered ? formatDate(delivTime) : undefined,
    status: isDelivered ? "completed" : "pending",
  });

  // ETA headline & subtitle in natural language
  let etaHeadline = "Preparing to dispatch";
  let etaSubtitle = "Order placed & packed · Central Stock Center";
  let statusBadge = "Packed";

  if (isCancelled) {
    etaHeadline = "Order Cancelled";
    etaSubtitle = "This order was cancelled";
    statusBadge = "Cancelled";
  } else if (isDelivered) {
    etaHeadline = `Delivered ${delivTime ? formatDate(delivTime) : "to you"}`;
    etaSubtitle = "Package was safely delivered to your address";
    statusBadge = "Delivered";
  } else if (isOutOfDelivery) {
    etaHeadline = "Arriving today";
    etaSubtitle = "Out for delivery with your local courier";
    statusBadge = "Out for Delivery";
  } else if (isDispatched) {
    etaHeadline = "Arriving in 2–4 business days";
    etaSubtitle = "On the way · Handed over to line-haul courier network";
    statusBadge = "In Transit";
  }

  const latestCompletedOrCurrent = [...steps].reverse().find((s) => s.status === "current" || s.status === "completed");
  const latestUpdate = latestCompletedOrCurrent
    ? `${latestCompletedOrCurrent.title}${latestCompletedOrCurrent.location ? ` · ${latestCompletedOrCurrent.location}` : ""}`
    : undefined;

  return {
    etaHeadline,
    etaSubtitle,
    statusBadge,
    steps,
    latestUpdate,
  };
}

