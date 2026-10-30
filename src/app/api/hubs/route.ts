import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LogisticsHub } from "@/types";

const DYNAMIC_HUBS_FILE = path.join(process.cwd(), "dynamic-hubs.json");

// 9 Strategic Pan-India Master Hubs + Sub-hub & International Hubs
export const STRATEGIC_MASTER_HUBS: LogisticsHub[] = [
  // 0. ORIGIN: Central Stock & Packaging Station (National Fulfillment Center)
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
  // Sub-Hub for backward compatibility
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

// Read dynamically registered hubs from file
function getStoredDynamicHubs(): LogisticsHub[] {
  try {
    if (fs.existsSync(DYNAMIC_HUBS_FILE)) {
      const raw = fs.readFileSync(DYNAMIC_HUBS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read dynamic hubs from file:", err);
  }
  return [];
}

function saveDynamicHubs(hubs: LogisticsHub[]): void {
  try {
    fs.writeFileSync(DYNAMIC_HUBS_FILE, JSON.stringify(hubs, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write dynamic hubs to file:", err);
  }
}

export async function GET() {
  const dynamicHubs = getStoredDynamicHubs();
  // Filter out any duplicates if already in strategic list
  const cleanDynamics = dynamicHubs.filter(
    (dh) => !STRATEGIC_MASTER_HUBS.some((sh) => sh.code.toUpperCase() === dh.code.toUpperCase())
  );
  const allHubs = [...STRATEGIC_MASTER_HUBS, ...cleanDynamics];
  return NextResponse.json({
    success: true,
    hubs: allHubs,
    standardCount: STRATEGIC_MASTER_HUBS.length,
    dynamicCount: cleanDynamics.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, region, country, type, coverageArea, strategicRole } = body;

    if (!code || !name || !region) {
      return NextResponse.json(
        { success: false, error: "Hub Code, Facility Name, and Region are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanId = `HUB-${cleanCode}-${String(Date.now()).slice(-4)}`;

    const currentDynamics = getStoredDynamicHubs();
    const allExisting = [...STRATEGIC_MASTER_HUBS, ...currentDynamics];

    if (allExisting.some((h) => h.code.toUpperCase() === cleanCode)) {
      return NextResponse.json(
        { success: false, error: `A hub with code '${cleanCode}' already exists.` },
        { status: 409 }
      );
    }

    const newHub: LogisticsHub = {
      id: cleanId,
      code: cleanCode,
      name: name.trim(),
      region: region.trim(),
      country: country?.trim() || "India",
      type: type || "regional_gateway",
      coverageArea: coverageArea?.trim() || "Strategic business logistics coverage area.",
      strategicRole: strategicRole?.trim() || "Dynamically discovered logistics facility.",
      isDynamic: true,
      createdAt: new Date().toISOString(),
    };

    const updatedDynamics = [...currentDynamics, newHub];
    saveDynamicHubs(updatedDynamics);

    return NextResponse.json({
      success: true,
      hub: newHub,
      hubs: [...STRATEGIC_MASTER_HUBS, ...updatedDynamics],
      message: `Strategic Hub ${newHub.name} [${newHub.code}] successfully registered.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register dynamic hub." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Hub ID is required to remove a dynamic hub." },
        { status: 400 }
      );
    }

    const currentDynamics = getStoredDynamicHubs();
    const filtered = currentDynamics.filter((h) => h.id.toLowerCase() !== id.toLowerCase());

    if (filtered.length === currentDynamics.length) {
      return NextResponse.json(
        { success: false, error: "Cannot delete standard system hubs or hub not found." },
        { status: 404 }
      );
    }

    saveDynamicHubs(filtered);

    return NextResponse.json({
      success: true,
      hubs: [...STRATEGIC_MASTER_HUBS, ...filtered],
      message: "Dynamic hub successfully decommissioned.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove dynamic hub." },
      { status: 500 }
    );
  }
}
