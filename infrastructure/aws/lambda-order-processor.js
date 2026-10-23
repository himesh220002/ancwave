/**
 * AWS Lambda Serverless Worker: ancwave-order-processor
 * Runtime: Node.js 20.x on AWS Graviton (ARM64)
 * Architecture: Event-driven subscriber to Amazon EventBridge bus 'ancwave-event-bus'
 */

const https = require("https");

exports.handler = async (event) => {
  console.log("Received EventBridge Event:", JSON.stringify(event, null, 2));

  const detailType = event["detail-type"];
  const detail = event.detail || {};

  if (detailType === "OrderPlaced") {
    const { orderId, orderNumber, totalUSD, itemsCount } = detail;
    console.log(`[Lambda] Processing Order #${orderNumber} ($${totalUSD}) with ${itemsCount} items.`);

    // 1. Invoke Next.js on-demand revalidation to purge edge cache
    try {
      await triggerISRRevalidation();
      console.log("[Lambda] Successfully purged Next.js edge ISR cache.");
    } catch (err) {
      console.error("[Lambda] Failed to trigger ISR revalidation:", err);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        orderId,
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

function triggerISRRevalidation() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ path: "/", tag: "product-details" });
    const appHost = process.env.APP_HOST || "ancwave.cyphertech.online";

    const options = {
      hostname: appHost,
      port: 443,
      path: "/api/revalidate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "x-revalidate-secret": process.env.REVALIDATE_SECRET || "ancwave_revalidation_secret_token_2026",
      },
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(data);
    req.end();
  });
}
