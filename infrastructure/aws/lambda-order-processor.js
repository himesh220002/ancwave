/**
 * AWS Lambda Serverless Worker: ancwave-order-processor
 * Runtime: Node.js 20.x / 22.x / 24.x
 * Architecture: Event-driven subscriber to Amazon EventBridge bus 'ancwave-event-bus'
 */

export const handler = async (event) => {
  console.log("Received EventBridge Event:", JSON.stringify(event, null, 2));

  const detailType = event["detail-type"] || event.detailType;
  const detail = event.detail || {};

  if (detailType === "OrderPlaced") {
    const orderNumber = detail.orderNumber || "UNKNOWN";
    const totalUSD = detail.totalUSD || 0;
    const itemsCount = detail.itemsCount || 1;
    console.log(`[Lambda] Processing Order #${orderNumber} ($${totalUSD}) with ${itemsCount} items.`);

    // 1. Trigger Next.js on-demand ISR revalidation to purge edge cache
    try {
      const appHost = process.env.APP_HOST || "ancwave.cyphertech.online";
      const secret = process.env.REVALIDATE_SECRET || "ancwave_revalidation_secret_token_2026";
      
      const res = await fetch(`https://${appHost}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ path: "/", tag: "product-details" }),
        signal: AbortSignal.timeout(6000),
      });
      
      console.log(`[Lambda] ISR Revalidation Response Status: ${res.status}`);
    } catch (err) {
      console.warn("[Lambda] Notice on ISR revalidation:", err.message || err);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        orderNumber,
        revalidated: true,
        processedAt: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "No action required for event", detailType }),
  };
};
