import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { STANDARD_HUBS } from "@/lib/logistics-service";
import { LogisticsHub } from "@/types";

const DYNAMIC_HUBS_FILE = path.join(process.cwd(), "dynamic-hubs.json");

// Read dynamically registered hubs from file with in-memory caching
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
  // Merge standard strategic hubs with dynamic hubs
  const allHubs = [...STANDARD_HUBS, ...dynamicHubs];
  return NextResponse.json({
    success: true,
    hubs: allHubs,
    standardCount: STANDARD_HUBS.length,
    dynamicCount: dynamicHubs.length,
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
    const allExisting = [...STANDARD_HUBS, ...currentDynamics];

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
      coverageArea: coverageArea?.trim() || "Strategic business expansion coverage area.",
      strategicRole: strategicRole?.trim() || "Dynamically discovered logistics facility.",
      isDynamic: true,
      createdAt: new Date().toISOString(),
    };

    const updatedDynamics = [...currentDynamics, newHub];
    saveDynamicHubs(updatedDynamics);

    return NextResponse.json({
      success: true,
      hub: newHub,
      hubs: [...STANDARD_HUBS, ...updatedDynamics],
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
      hubs: [...STANDARD_HUBS, ...filtered],
      message: "Dynamic hub successfully decommissioned.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove dynamic hub." },
      { status: 500 }
    );
  }
}
