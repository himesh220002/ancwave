import fs from "fs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Load .env.local natively without external dependencies
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const client = new SESClient({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function run() {
  const recipient = process.argv[2] || "versionname4@gmail.com";
  const from = process.env.AWS_SES_FROM_EMAIL || "ancwave Orders <orders@cyphertech.online>";

  console.log("--------------------------------------------------");
  console.log("🚀 Testing Live Email Dispatch via AWS SES");
  console.log(`Region: ${process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1"}`);
  console.log(`From:   ${from}`);
  console.log(`To:     ${recipient}`);
  console.log("--------------------------------------------------");

  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Subject: {
          Data: "Payment Confirmed: $361.00 USD paid via Razorpay for Order #ANC-763954 · ancwave",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8f9f8; margin: 0; padding: 24px; color: #1a1d1a; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eaebea; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: #181b18; color: #ffffff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; font-size: 11px; color: #a0a5a0; text-transform: uppercase; font-family: monospace; letter-spacing: 1px; }
    .content { padding: 32px; }
    .badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .box { background: #f9faf9; border: 1px solid #e8eae8; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .footer { background: #f4f5f4; padding: 20px 32px; text-align: center; font-size: 11px; color: #717671; border-top: 1px solid #eaebea; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>ancwave</h1>
      <p>Official AWS SES Verified Order Confirmation</p>
    </div>
    <div class="content">
      <div class="badge">✓ AWS SES Live Delivery Succeeded</div>
      <div class="box">
        Dear <strong>Himesh</strong>,<br /><br />
        This email confirms that your AWS SES integration for <strong>cyphertech.online</strong> is officially verified, authenticated with DKIM, and delivering live emails from your company domain!
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid #eaebea;">
          <td style="padding: 10px 0; color: #717671;">Sender Domain:</td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 600; text-align: right;">${from}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eaebea;">
          <td style="padding: 10px 0; color: #717671;">MAIL FROM:</td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 600; text-align: right;">mail.cyphertech.online</td>
        </tr>
        <tr style="border-bottom: 1px solid #eaebea;">
          <td style="padding: 10px 0; color: #717671;">Recipient:</td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 600; text-align: right;">${recipient}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #717671;">Status:</td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 600; text-align: right; color: #16a34a;">Captured & Dispatched</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      ancwave Acoustics Inc. · Official Customer Invoice & Live Order Receipt<br />
      © 2026 ancwave Acoustics. All rights reserved.
    </div>
  </div>
</body>
</html>
            `,
            Charset: "UTF-8",
          },
          Text: {
            Data: `ancwave Acoustics - AWS SES Test Succeeded!\n\nHello Himesh,\nYour AWS SES integration is verified and working. Emails are successfully delivering from ${from} to ${recipient}.`,
            Charset: "UTF-8",
          },
        },
      },
    });

    const result = await client.send(command);
    console.log("✅ EMAIL DELIVERED SUCCESSFULLY!");
    console.log(`MessageId: ${result.MessageId}`);
    console.log("Check your inbox at " + recipient);
  } catch (err) {
    console.error("❌ Send Error:", err.message);
    process.exit(1);
  }
}

run();
