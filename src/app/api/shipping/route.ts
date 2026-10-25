import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { connectDB } from "@/lib/db";
import { ShippingSettingsModel } from "@/lib/models";
import { ShippingSettings } from "@/types";

export async function GET() {
  try {
    const db = await connectDB();
    if (db) {
      const doc = await ShippingSettingsModel.findOne({ key: "global_shipping_fixtures" });
      if (doc) {
        const settings: ShippingSettings = {
          generalDeliveryPriceUsd: doc.generalDeliveryPriceUsd ?? 0,
          generalDeliveryPriceInr: doc.generalDeliveryPriceInr ?? 0,
          expressDeliveryPriceUsd: doc.expressDeliveryPriceUsd ?? 15,
          expressDeliveryPriceInr: doc.expressDeliveryPriceInr ?? 1200,
        };
        store.updateShippingFixtures(settings);
        return NextResponse.json({ success: true, shipping: settings });
      }
    }

    const current = store.getShippingFixtures();
    return NextResponse.json({ success: true, shipping: current });
  } catch (error: any) {
    console.error("Failed to load shipping settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load shipping settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      generalDeliveryPriceUsd = 0,
      generalDeliveryPriceInr = 0,
      expressDeliveryPriceUsd = 15,
      expressDeliveryPriceInr = 1200,
    } = body;

    const updatedSettings: ShippingSettings = {
      generalDeliveryPriceUsd: Math.max(0, Number(generalDeliveryPriceUsd) || 0),
      generalDeliveryPriceInr: Math.max(0, Number(generalDeliveryPriceInr) || 0),
      expressDeliveryPriceUsd: Math.max(0, Number(expressDeliveryPriceUsd) || 0),
      expressDeliveryPriceInr: Math.max(0, Number(expressDeliveryPriceInr) || 0),
    };

    // Update memory store
    store.updateShippingFixtures(updatedSettings);

    // Update MongoDB
    const db = await connectDB();
    if (db) {
      await ShippingSettingsModel.findOneAndUpdate(
        { key: "global_shipping_fixtures" },
        {
          key: "global_shipping_fixtures",
          ...updatedSettings,
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      shipping: updatedSettings,
      message: "Shipping method pricing fixtures updated successfully",
    });
  } catch (error: any) {
    console.error("Failed to update shipping settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update shipping settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
