import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { dispatchEventBridgeEvent, getAWSInfrastructureOverview } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

export async function GET() {
  const logs = store.getAWSEventLogs();
  const infrastructure = getAWSInfrastructureOverview();
  return NextResponse.json({
    success: true,
    count: logs.length,
    eventBus: "ancwave-event-bus",
    region: "us-east-1",
    infrastructure,
    logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { detailType = "CustomSimulation", detail = {} } = body;

    const log = await dispatchEventBridgeEvent(detailType, {
      ...detail,
      triggeredVia: "Interactive AWS Architecture Dashboard",
      timestamp: new Date().toISOString(),
    });

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `AWS EventBridge received event '${detailType}' and routed to target Lambda workers.`,
      eventLog: log,
    });
  } catch (error) {
    console.error("Error in /api/aws/eventbridge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch EventBridge event" },
      { status: 500 }
    );
  }
}
