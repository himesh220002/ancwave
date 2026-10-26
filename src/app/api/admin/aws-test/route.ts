import { NextRequest, NextResponse } from "next/server";
import { dispatchEventBridgeEvent, invokeAWSLambdaWorker, AWS_DEFAULT_CONFIG } from "@/lib/aws-services";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const recentLogs = store.getAWSEventLogs();

    return NextResponse.json({
      success: true,
      config: {
        region: AWS_DEFAULT_CONFIG.region,
        eventBusName: AWS_DEFAULT_CONFIG.eventBusName,
        lambdaFunctionName: AWS_DEFAULT_CONFIG.lambdaFunctionName,
      },
      awsConsoleLinks: {
        eventBus: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/events/home?region=${AWS_DEFAULT_CONFIG.region}#/eventbus/${AWS_DEFAULT_CONFIG.eventBusName}`,
        lambdaFunction: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/lambda/home?region=${AWS_DEFAULT_CONFIG.region}#/functions/${AWS_DEFAULT_CONFIG.lambdaFunctionName}?tab=monitoring`,
        cloudWatchLogs: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/cloudwatch/home?region=${AWS_DEFAULT_CONFIG.region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${AWS_DEFAULT_CONFIG.lambdaFunctionName}`,
      },
      recentLogs: recentLogs.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to get AWS status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "test-all", orderNumber = "ANC-LIVE-TEST", totalUSD = 361 } = body;

    // 1. Dispatch EventBridge Event
    const eventLog = await dispatchEventBridgeEvent("OrderPlaced", {
      orderNumber,
      totalUSD: Number(totalUSD),
      itemsCount: 1,
      source: "ancwave.admin.tester",
      triggeredAt: new Date().toISOString(),
    });

    // 2. Invoke Lambda Worker directly
    let lambdaResult: any = null;
    if (action === "test-all" || action === "invoke-lambda") {
      lambdaResult = await invokeAWSLambdaWorker({
        orderNumber,
        totalUSD: Number(totalUSD),
        itemsCount: 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "AWS EventBridge event dispatched and Lambda worker invoked successfully!",
      eventBridge: {
        busName: AWS_DEFAULT_CONFIG.eventBusName,
        eventId: eventLog.eventId,
        detailType: eventLog.detailType,
        source: eventLog.source,
        timestamp: eventLog.timestamp,
      },
      lambda: lambdaResult || {
        status: "DISPATCHED_VIA_EVENTBRIDGE",
        functionName: AWS_DEFAULT_CONFIG.lambdaFunctionName,
      },
      awsConsoleLinks: {
        eventBus: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/events/home?region=${AWS_DEFAULT_CONFIG.region}#/eventbus/${AWS_DEFAULT_CONFIG.eventBusName}`,
        lambdaFunction: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/lambda/home?region=${AWS_DEFAULT_CONFIG.region}#/functions/${AWS_DEFAULT_CONFIG.lambdaFunctionName}?tab=monitoring`,
        cloudWatchLogs: `https://${AWS_DEFAULT_CONFIG.region}.console.aws.amazon.com/cloudwatch/home?region=${AWS_DEFAULT_CONFIG.region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${AWS_DEFAULT_CONFIG.lambdaFunctionName}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to trigger AWS test" },
      { status: 500 }
    );
  }
}
