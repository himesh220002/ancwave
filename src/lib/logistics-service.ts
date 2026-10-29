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
  {
    id: "HUB-DEL-01",
    code: "DEL",
    name: "Delhi National Fulfillment Hub",
    region: "Delhi NCR, IN",
    country: "India",
    type: "origin",
  },
  {
    id: "HUB-CCU-01",
    code: "CCU",
    name: "Kolkata Eastern Logistics Hub",
    region: "West Bengal, IN",
    country: "India",
    type: "regional_gateway",
  },
  {
    id: "HUB-ASN-01",
    code: "ASN",
    name: "Asansol Regional Sorting Center",
    region: "Asansol Zone, West Bengal, IN",
    country: "India",
    type: "local_delivery",
  },
  {
    id: "HUB-BOM-01",
    code: "BOM",
    name: "Mumbai Western Air Gateway",
    region: "Maharashtra, IN",
    country: "India",
    type: "regional_gateway",
  },
  {
    id: "HUB-BLR-01",
    code: "BLR",
    name: "Bangalore South Tech Hub",
    region: "Karnataka, IN",
    country: "India",
    type: "regional_gateway",
  },
  {
    id: "HUB-PDX-01",
    code: "PDX",
    name: "Portland Primary Logistics Center",
    region: "Oregon, US",
    country: "United States",
    type: "origin",
  },
  {
    id: "HUB-FRA-01",
    code: "FRA",
    name: "Frankfurt Central Air Logistics Hub",
    region: "Frankfurt, DE",
    country: "Germany",
    type: "air_transit",
  },
  {
    id: "HUB-LHR-01",
    code: "LHR",
    name: "London Heathrow Gateway Hub",
    region: "London, UK",
    country: "United Kingdom",
    type: "regional_gateway",
  },
];

export function getHubById(id?: string): LogisticsHub | undefined {
  if (!id) return undefined;
  return STANDARD_HUBS.find((h) => h.id.toLowerCase() === id.toLowerCase() || h.code.toLowerCase() === id.toLowerCase());
}

export function getHubByNameOrCity(query?: string): LogisticsHub | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return STANDARD_HUBS.find(
    (h) =>
      h.name.toLowerCase().includes(q) ||
      h.region.toLowerCase().includes(q) ||
      h.code.toLowerCase() === q ||
      h.id.toLowerCase() === q
  );
}

/**
 * Automatically creates a deterministic, scalable multi-hub sequence for an order
 * based on customer destination.
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

  const country = (customer.country || "India").toLowerCase();
  const city = (customer.city || "").toLowerCase();
  const state = (customer.state || "").toLowerCase();

  // Route Pattern A: India East / Asansol / West Bengal corridor
  if (country.includes("ind") || country.includes("in")) {
    if (city.includes("asansol") || city.includes("burdwan") || city.includes("durgapur") || state.includes("bengal")) {
      return [
        {
          sequence: 1,
          hubId: "HUB-DEL-01",
          hubName: "Delhi National Fulfillment Hub",
          region: "Delhi NCR, IN",
          status: "completed",
          transportMode: "truck",
          vehicleNo: "DL-01-TRK-8812",
          containerId: "DEL-CCU-101",
          dispatchCategory: "b2b_bulk_freight",
        },
        {
          sequence: 2,
          hubId: "HUB-CCU-01",
          hubName: "Kolkata Eastern Logistics Hub",
          region: "West Bengal, IN",
          status: "dispatched",
          transportMode: "train",
          vehicleNo: "IR-12302-RAJ",
          containerId: "KOL-ASN-0001",
          dispatchCategory: "b2b_bulk_freight",
          railFreight: {
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
          },
        },
        {
          sequence: 3,
          hubId: "HUB-ASN-01",
          hubName: "Asansol Regional Sorting Center",
          region: "Asansol Zone, West Bengal, IN",
          status: "incoming",
          transportMode: "van",
          vehicleNo: "WB-38-VAN-9920",
          containerId: "ASN-GATE-404",
          dispatchCategory: "b2c_individual_courier",
          courierService: {
            provider: "bluedart",
            providerName: "Blue Dart Express (Apex)",
            serviceType: "air_express",
            trackingAwb: "BLUEDART-882914402",
            pickupManifestId: "MNF-BD-ASN-009",
            estimatedDeliveryDays: 1,
            riderName: "Rakesh Sharma",
            riderContact: "+91 98301 23456",
          },
        },
      ];
    }

    if (city.includes("mumbai") || city.includes("pune") || state.includes("maharashtra")) {
      return [
        {
          sequence: 1,
          hubId: "HUB-DEL-01",
          hubName: "Delhi National Fulfillment Hub",
          region: "Delhi NCR, IN",
          status: "completed",
          transportMode: "plane",
          vehicleNo: "6E-CARGO-402",
        },
        {
          sequence: 2,
          hubId: "HUB-BOM-01",
          hubName: "Mumbai Western Air Gateway",
          region: "Maharashtra, IN",
          status: "sorting",
          transportMode: "van",
          vehicleNo: "MH-02-EXP-3310",
        },
      ];
    }

    if (city.includes("bangalore") || city.includes("bengaluru") || state.includes("karnataka")) {
      return [
        {
          sequence: 1,
          hubId: "HUB-BOM-01",
          hubName: "Mumbai Western Air Gateway",
          region: "Maharashtra, IN",
          status: "completed",
          transportMode: "truck",
          vehicleNo: "MH-04-TRK-7711",
        },
        {
          sequence: 2,
          hubId: "HUB-BLR-01",
          hubName: "Bangalore South Tech Hub",
          region: "Karnataka, IN",
          status: "sorting",
          transportMode: "bike",
          vehicleNo: "KA-01-BK-4040",
        },
      ];
    }

    // Default India General Route
    return [
      {
        sequence: 1,
        hubId: "HUB-DEL-01",
        hubName: "Delhi National Fulfillment Hub",
        region: "Delhi NCR, IN",
        status: "dispatched",
        transportMode: "truck",
        vehicleNo: "DL-01-TRK-9000",
      },
      {
        sequence: 2,
        hubId: "HUB-CCU-01",
        hubName: "Kolkata Eastern Logistics Hub",
        region: "West Bengal, IN",
        status: "incoming",
        transportMode: "van",
        vehicleNo: "WB-02-EXP-1122",
      },
    ];
  }

  // Route Pattern B: International (US / Europe)
  return [
    {
      sequence: 1,
      hubId: "HUB-PDX-01",
      hubName: "Portland Primary Logistics Center",
      region: "Oregon, US",
      status: "completed",
      transportMode: "truck",
      vehicleNo: "OR-TRK-5555",
      containerId: "PDX-FRA-099",
    },
    {
      sequence: 2,
      hubId: "HUB-FRA-01",
      hubName: "Frankfurt Central Air Logistics Hub",
      region: "Frankfurt, DE",
      status: "sorting",
      transportMode: "plane",
      vehicleNo: "LH-CARGO-772",
      containerId: "FRA-REG-011",
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

  // Find active leg
  // If order is delivered, everything is completed
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

  // Find current active leg (first leg not marked 'completed')
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
    currentHubId: currentLeg?.hubId || "HUB-DEL-01",
    currentHub: currentLeg?.hubName || order.currentHub || "Delhi National Fulfillment Hub",
    currentRegion: currentLeg?.region || order.currentRegion || "Delhi NCR, IN",
    nextHubId: nextLeg?.hubId,
    nextHub: nextLeg ? nextLeg.hubName : "Customer Doorstep Delivery Gate",
    nextRegion: nextLeg ? nextLeg.region : `${order.customer.city}, ${order.customer.state}`,
    transitMode: currentLeg?.transportMode || order.transitMode || "truck",
    vehicleNo: currentLeg?.vehicleNo || order.vehicleNo || "OR-TRK-5555",
    containerId: currentLeg?.containerId || order.containerId || "KOL-ASN-0001",
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

  // 1. Order Creation Step
  const orderCreatedEv = (order.events || []).find((e) => e.title.toLowerCase().includes("order created") || e.title.toLowerCase().includes("order placed"));
  const createdTime = orderCreatedEv?.timestamp || order.createdAt || "2026-10-25T11:34:00Z";
  steps.push({
    stepType: "order_creation",
    title: "Order creation",
    timestamp: formatDate(createdTime),
    status: "completed",
    details: "Order placed & verified · Boxed and dispatched at origin warehouse",
    badge: "Origin Pack Complete",
  });

  // 2. Multi-Hub In/Out Steps (hub1, hub2, hub3...)
  route.forEach((leg, idx) => {
    const hubNum = leg.sequence || idx + 1;
    const isCompleted = leg.status === "completed";
    const isActive = leg.status === "received" || leg.status === "sorting" || leg.status === "loading" || leg.status === "dispatched";

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
  const outTime = outForDeliveryEv?.timestamp || (isOutOfDelivery ? new Date(new Date(order.createdAt).getTime() + 32 * 3600 * 1000).toISOString() : undefined);

  steps.push({
    stepType: "out_for_delivery",
    title: `Out for delivery [${formatDate(outTime) || "Awaiting Final Hub Dispatch"}]`,
    timestamp: formatDate(outTime),
    status: order.deliveryStatus === "delivered" || String(order.deliveryStatus || "").startsWith("rto_") ? "completed" : order.deliveryStatus === "out_for_delivery" ? "in_progress" : "pending",
    details: "Package on the way near location · Arrives in afternoon/evening window",
    badge: "Last-Mile Active",
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

