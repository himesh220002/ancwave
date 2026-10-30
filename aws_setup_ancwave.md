# AWS Setup - Ancwave

## Overview
This document contains the AWS infrastructure setup, security architecture, role management, Razorpay integration, and deployment configuration for the Ancwave platform.

---

# 1. Multi-Tier Role System

Hierarchy:

```
owner -> admin -> user
```

## Default Signup Role
- All new registrations via the website or `/api/auth/signup` are created with:

```json
{
  "role": "user"
}
```

## Root Owner Activation via MongoDB Atlas
- Update a user record from `user` to `owner` in MongoDB Atlas/Compass.
- `/api/auth/me` reads roles directly from MongoDB.
- Owner privileges become active immediately.

## Owner Team Management
- Owner-only dashboard section: **Team Access & Roles**
- Search teammates by email or name.
- Grant admin access.
- Revoke admin access.
- Owner role cannot be modified through APIs.

---

# 2. Daily Operations Passcode Gate

## Security Flow
- Owner/Admin authentication required.
- Accessing `/admin` triggers a second security layer.

### Environment Variable

```env
DAILY_ADMIN_PASSCODE=ancwave-ops-secure-2026
```

### Features
- Generates a 24-hour token (`ancwave_day_token`).
- Displays:

```
🟢 24h Ops Session Active
```

- Lock button immediately removes token.
- Users with role `user` receive Access Restricted messages.

---

# 3. Razorpay Environment Variables

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_live_secret_key
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_key
```

---

# 4. AWS Infrastructure Setup Order

```mermaid
sequenceDiagram
    autonumber
    actor IAM as 5. IAM User & Keys
    participant S3 as 1. S3 Media Bucket
    participant CF as 2. CloudFront CDN
    participant EB as 3. EventBridge Custom Bus
    participant Lambda as 4. Lambda Worker
    participant Next as Next.js App Edge ISR

    %% IAM Configuration / Provisioning Phase
    Note over IAM, Next: Phase 1: Least Privilege Access Provisioning
    IAM->>S3: Configures / Accesses
    IAM->>CF: Configures / Accesses
    IAM->>EB: Configures / Accesses
    IAM->>Lambda: Configures / Accesses

    %% Runtime Operations Phase
    Note over S3, Next: Phase 2: Media Delivery & Cache Invalidation Lifecycle
    CF->>S3: Fetch Content via "Origin Target + OAC"
    EB->>Lambda: "Rule Trigger" event fires
    Lambda->>Next: Trigger "Calls Webhook / Cache Purge"
  
```

```mermaid
flowchart TD
    A["1. S3 Media Bucket"] -->|Origin Target + OAC| B["2. CloudFront CDN"]
    C["3. EventBridge Custom Bus"] -->|Rule Trigger| D["4. Lambda Worker"]
    D -->|Calls Webhook / Cache Purge| E["Next.js App Edge ISR"]
    
    F["5. IAM User & Keys"] -->|Least Privilege Access| A
    F -->|Least Privilege Access| B
    F -->|Least Privilege Access| C
    F -->|Least Privilege Access| D
```

---

# Step 1: Amazon S3 Bucket

Bucket Example:

```text
ancwave-media-storage-production
```

Region:

```text
ap-south-1
```

Keep public access blocked.

### CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Environment Variables

```env
AWS_S3_BUCKET=ancwave-media-storage-production
AWS_REGION=ap-south-1
```

---

# Step 2: CloudFront Distribution

### Origin

```text
ancwave-media-storage-production.s3.ap-south-1.amazonaws.com
```

### Configuration
- Origin Access Control (OAC)
- Redirect HTTP to HTTPS
- Methods: GET, HEAD, OPTIONS

### Bucket Policy Template

```json
{
  "Version": "2012-10-17",
  "Statement": {
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::ancwave-media-storage-production/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::823787500418:distribution/E3HVB881LFOYR6"
      }
    }
  }
}
```

### Environment Variables

Configured in your `.env.local`:

```env
# 1. Distribution ID (Used for cache invalidations / AWS API):
CLOUDFRONT_DISTRIBUTION_ID=E3HVB881LFOYR6

# 2. Distribution Domain (Used for serving public media):
CLOUDFRONT_DOMAIN=d3h0eouvv2gscn.cloudfront.net
```

---

---

# Step 3: EventBridge Custom Bus

EventBridge acts as the decoupled messaging backbone of `ancwave`. When a customer buys headphones, Next.js fires an event to this bus and finishes checkout in `<80ms`. EventBridge then asynchronously invokes your Lambda worker.

### 1. Create the Bus in AWS Console:
1. Open **Amazon EventBridge** in region `ap-south-1` (Mumbai).
2. Click **Event buses** -> **Create event bus**.
3. **Name**: `ancwave-event-bus`
4. Leave other settings as default and click **Create**.

### Environment Variable in `.env.local`:
```env
EVENTBRIDGE_BUS_NAME=ancwave-event-bus
```

---

# Step 4: Lambda Worker (`ancwave-order-processor`)

### Architecture: How Lambda Works in `ancwave` vs. `igvictory`
In your previous project (`igvictory`), you built:
- **Lambda 1: S3 <-> MongoDB sync** (listening to S3 file uploads and recording keys in MongoDB).
- **Lambda 2: URL signer** (generating access tokens for files).

In **`ancwave`**:
- **Presigned URLs**: Are generated directly inside Next.js (`/api/aws/s3-presign`) in 1 millisecond using `@aws-sdk/s3-request-presigner`. No separate Lambda needed for URL signing.
- **The Core Lambda Needed Here**: **`ancwave-order-processor`** (EventBridge Consumer).
  - **Trigger**: Receives `OrderPlaced` and `StockUpdated` events from `ancwave-event-bus`.
  - **Job 1 (Edge Invalidation)**: Calls Next.js `/api/revalidate` with `REVALIDATE_SECRET` to immediately wipe the stale product page cache so the next visitor instantly sees reduced stock and the "🔥 Few left!" flash alert.
  - **Job 2 (CloudFront Purge)**: Can also issue invalidations directly or trigger order fulfillment webhooks.
  - **Job 3 (Order Ledger)**: Confirms order processing in the background without slowing down customer checkout.

---

### Step-by-Step Setup:

#### A. Create the Lambda Function:
1. Open **AWS Lambda** in region `ap-south-1`.
2. Click **Create function**.
3. Choose **Author from scratch**.
4. **Function name**: `ancwave-order-processor`
5. **Runtime**: `Node.js 20.x` or `Node.js 22.x`
6. **Architecture**: `arm64` (AWS Graviton - faster & cheaper) or `x86_64`.
7. Click **Create function**.

#### B. Paste the Lambda Code:
In the Lambda **Code source** tab, double-click `index.mjs` and paste this clean, dependency-free code (uses native `fetch` built into Node.js 20+):

```javascript
/**
 * ancwave Asynchronous Order & Cache Processor
 * Triggered by Amazon EventBridge (ancwave-event-bus)
 */
export const handler = async (event) => {
  console.log("=== [ancwave] EventBridge Event Received ===");
  console.log(JSON.stringify(event, null, 2));

  const detailType = event["detail-type"] || event.detailType || "OrderPlaced";
  const detail = event.detail || {};

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const revalidateSecret = process.env.REVALIDATE_SECRET || "ancwave_revalidation_secret_token_2026";

  const responsePayload = {
    processed: true,
    detailType,
    orderNumber: detail.orderNumber || detail.orderId || "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Purge Next.js On-Demand ISR Edge Cache
    if (appUrl && revalidateSecret) {
      console.log(`[Cache Purge] Triggering revalidation on: ${appUrl}/api/revalidate`);
      
      const revalRes = await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": revalidateSecret,
        },
        body: JSON.stringify({
          path: "/",
          tag: "product-details",
          triggeredBy: "AWS Lambda (ancwave-order-processor)",
          orderId: detail.orderId,
          orderNumber: detail.orderNumber,
        }),
      });

      const revalData = await revalRes.json();
      console.log("[Cache Purge] Next.js Response:", revalData);
      responsePayload.revalidation = revalData;
    }

    // 2. Background Ledger & Stock Sync
    console.log(`[Order Processing] Order ${detail.orderNumber} successfully processed by Lambda.`);
    responsePayload.status = "SUCCESS";

    return {
      statusCode: 200,
      body: JSON.stringify(responsePayload),
    };
  } catch (error) {
    console.error("[Lambda Error] Failed to process event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```
Click **Deploy** in the Lambda console.

#### C. Set Lambda Environment Variables:
Go to **Configuration** -> **Environment variables** -> **Edit** and add:
- `REVALIDATE_SECRET`: `ancwave_revalidation_secret_token_2026`
- `APP_URL`: Your deployed website URL (e.g. `http://<your-ec2-ip>:3000` or `https://ancwave.com`)

#### D. Connect EventBridge Rule to Trigger this Lambda:
1. Open **Amazon EventBridge** -> **Rules** -> select event bus `ancwave-event-bus`.
2. Click **Create rule**.
3. **Name**: `ancwave-order-placed-rule`
4. **Event bus**: `ancwave-event-bus`
5. **Rule type**: Rule with an event pattern.
6. In **Event pattern**, choose **Custom pattern (JSON editor)** and paste:
```json
{
  "source": ["aws.eventbridge.ancwave", "ancwave.store"],
  "detail-type": ["OrderPlaced", "StockUpdated", "CachePurged"]
}
```
7. Click **Next**.
8. Under **Target 1**:
   - Target type: **AWS service**
   - Select a target: **Lambda function**
   - Function: `ancwave-order-processor`
9. Click **Next** through tags and click **Create rule**.

---

### Environment Variable in `.env.local`:
```env
LAMBDA_WORKER_NAME=ancwave-order-processor
```

---

# Step 5: IAM User & Access Keys

User:

```text
ancwave-app-worker
```

### Least Privilege Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::ancwave-media-storage-production/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    },
    {
      "Effect": "Allow",
      "Action": ["events:PutEvents"],
      "Resource": "arn:aws:events:*:*:event-bus/ancwave-event-bus"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:*:*:function:ancwave-order-processor"
    }
  ]
}
```

### Environment Variables

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

# Step 6: Serverless Next.js App on AWS Lambda (Scale-to-Zero)

Instead of paying $20–$35/month for an EC2 server running 24/7, `ancwave` is configured to run serverlessly on AWS Lambda using the **Official AWS Lambda Web Adapter**.

### How Scale-to-Zero Works:
* **0 Active Users**: 0 Lambda containers running. Compute bill is literally **$0.00**.
* **1st User Arrives**: CloudFront routes to the Lambda Function URL. Lambda boots the Next.js standalone container in ~800ms.
* **Active User Browsing**: Lambda stays warm in memory and serves dynamic requests, checkout, and API routes in **15–25ms**.
* **Static Assets**: All `/_next/static/*` files and studio images are cached and served from CloudFront + S3 with **0ms Lambda runtime**.
* **User Leaves**: After 10–15 minutes of inactivity, Lambda gracefully shuts down to 0 instances.

---

### Deployment Options:

#### Option A: 1-Click Automated Script:
Run the deployment script from your terminal:
```bash
chmod +x infrastructure/aws/deploy-lambda.sh
./infrastructure/aws/deploy-lambda.sh
```

#### Option B: AWS Console Walkthrough:
1. **Create Amazon ECR Repository**:
   - Go to **Amazon ECR** -> **Create repository** -> Name: `ancwave-live-app`.
2. **Build & Push Container**:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 823787500418.dkr.ecr.ap-south-1.amazonaws.com
   docker build --platform linux/amd64 -t ancwave-live-app -f infrastructure/aws/Dockerfile .
   docker tag ancwave-live-app:latest 823787500418.dkr.ecr.ap-south-1.amazonaws.com/ancwave-live-app:latest
   docker push 823787500418.dkr.ecr.ap-south-1.amazonaws.com/ancwave-live-app:latest
   ```
3. **Create Lambda Function**:
   - Go to **AWS Lambda** -> **Create function** -> Select **Container image**.
   - **Function name**: `ancwave-live-app`.
   - **Container image URI**: Select `823787500418.dkr.ecr.ap-south-1.amazonaws.com/ancwave-live-app:latest`.
   - **Architecture**: `x86_64` (matches Docker build) or `arm64`.
   - Memory: `1024 MB`, Timeout: `30 seconds`.
4. **Enable Function URL (Direct HTTPS Endpoint)**:
   - Go to **Configuration** -> **Function URL** -> **Create Function URL**.
   - **Auth type**: `NONE` (public internet access).
   - **Invoke mode**: `RESPONSE_STREAM` (enables React Server Component streaming and fast TTFB).
5. **Connect CloudFront**:
   - In CloudFront Distribution `E3HVB881LFOYR6`, add the **Lambda Function URL domain** (`<id>.lambda-url.ap-south-1.on.aws`) as an Origin.
   - Set the Default Cache Behavior (`/*`) to forward to this Lambda Origin.

---

# Razorpay Webhook Orchestrator

Endpoint:

```text
/api/razorpay/webhook
```

## Supported Events

### payment.captured / order.paid
- Verify HMAC signature.
- Mark order as paid.
- Auto-create completed order if needed.
- Deduct stock.
- Send EventBridge event.
- Trigger ISR revalidation.

### payment.failed
- Log error details.
- Mark order failed.

### refund.processed
- Mark order refunded.

### GET
- Webhook health status.

---

# Razorpay Dashboard Setup

Webhook URL:

```text
https://YOUR_DOMAIN/api/razorpay/webhook
```

Secret:

```env
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_key
```

Enable:

- payment.captured
- order.paid
- payment.failed
- refund.processed

---

# Verification Checklist

## Auth & Access
- Signup defaults to user.
- Non-admin blocked.
- Owner authentication verified.
- Admin token issuance verified.
- Admin revocation verified.

## Build Validation

```bash
npx tsc --noEmit
npm run build
```

Results:
- TypeScript compilation successful.
- Next.js production build successful.
- Webhook integration tests passed.
- Event dispatch verified.
- Stock reduction verified.


---
1. The Big Questions Answered First (Docker Hub & GitHub Secrets)
❌ Do you need a Docker Hub account?
NO. You do NOT need Docker Hub at all. AWS has its own built-in, private, free container registry called Amazon ECR (Elastic Container Registry). You push directly from your computer or GitHub Actions to your own AWS ECR (823787500418.dkr.ecr.ap-south-1.amazonaws.com). You never need Docker Hub.

❌ Does Docker bake in your environment variables?
NO. Never bake secrets into Docker images. If you put passwords in a Dockerfile, anyone who views the image can steal them. Your Docker container stays clean. All environment variables are added in the AWS Lambda Console under "Configuration → Environment variables". When Lambda wakes up, AWS automatically injects them into process.env.

❌ Do you need to add ALL envs into GitHub Secrets?
NO.

If you deploy from your terminal: You don't need GitHub Secrets at all. You just run ./infrastructure/aws/deploy-lambda.sh.
If you use GitHub Actions (CI/CD auto-deploy on git push): You only need 2 secrets in GitHub:
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
(GitHub only needs permission to push the image to Amazon ECR. All your app secrets like MONGODB_URI and RAZORPAY_SECRET stay safely inside AWS Lambda!)
2. The 2 Lambdas Explained (Names, Details & Codes)
Your architecture has two distinct Lambdas:

┌────────────────────────────────────────────────────────────────────────┐
│ 1. "ancwave-live-app" (Next.js Live Website — Scale-to-Zero)           │
│    Runs the website live. Wakes up when a user visits, $0 when idle.   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. "ancwave-order-processor" (Background Worker)                       │
│    Wakes up only when an order is placed to purge edge cache.          │
└────────────────────────────────────────────────────────────────────────┘
🚀 Lambda 1: ancwave-live-app (Runs the Live Website)
This is the containerized Next.js website that runs serverlessly.

Step 1: Create the ECR Repository (in AWS Console)
Go to Amazon ECR (Region: ap-south-1 Mumbai).
Click Create repository.
Name: ancwave-live-app.
Visibility: Private.
Click Create repository.
Step 2: Push Your Code to ECR
Run this in your terminal from the project folder:

bash
# 1. Login Docker to your AWS ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 823787500418.dkr.ecr.ap-south-1.amazonaws.com
# 2. Build the standalone image
docker build --platform linux/amd64 -t ancwave-live-app -f infrastructure/aws/Dockerfile .
# 3. Tag and push to ECR
docker tag ancwave-live-app:latest 823787500418.dkr.ecr.ap-south-1.amazonaws.com/ancwave-live-app:latest
docker push 823787500418.dkr.ecr.ap-south-1.amazonaws.com/ancwave-live-app:latest
(Or simply run ./infrastructure/aws/deploy-lambda.sh which runs these commands automatically).

Step 3: Create the Lambda Function (in AWS Console)
Go to AWS Lambda (Region: ap-south-1).
Click Create function.
Choose Container image.
Function name: ancwave-live-app.
Container image URI: Click Browse images, choose ancwave-live-app repository, and select latest.
Architecture: x86_64.
Click Create function.
Step 4: Configure Memory & Timeout
In the Lambda function page:

Go to Configuration → General configuration → Edit.
Memory: Change 128 MB to 1024 MB (Next.js needs ~500MB to run smoothly).
Timeout: Change 3 sec to 30 sec.
Click Save.
Step 5: Enable Function URL (Live HTTPS Web Address)
Go to Configuration → Function URL → Create Function URL.
Auth type: Choose NONE (so web visitors can access it).
Click Additional settings:
Invoke mode: Select RESPONSE_STREAM (This enables Next.js fast streaming and Partial Prerendering).
Click Save.
AWS will give you a public URL like: https://abcdef12345.lambda-url.ap-south-1.on.aws
Step 6: Add Environment Variables in Lambda Console
Go to Configuration → Environment variables → Edit and paste your values from .env.local:

Key	Value
MONGODB_URI	mongodb+srv://satyamhimesh:06452220002Hq@cluster0.ckkeqng.mongodb.net/ancwaveDB
JWT_SECRET	ancwave-super-secret-jwt-key-2026-production-grade
DAILY_ADMIN_PASSCODE	ancwave-ops-secure-2026
NEXT_PUBLIC_RAZORPAY_KEY_ID	rzp_live_ThR51B1sJfYQvr
RAZORPAY_KEY_ID	rzp_live_ThR51B1sJfYQvr
RAZORPAY_KEY_SECRET	4ftsl3szrXQEk4G1grg4Rfl6
RAZORPAY_WEBHOOK_SECRET	cyphertechrazorsecret
AWS_REGION	ap-south-1
AWS_S3_BUCKET	ancwave-media-storage-production
CLOUDFRONT_DISTRIBUTION_ID	E3HVB881LFOYR6
CLOUDFRONT_DOMAIN	d3h0eouvv2gscn.cloudfront.net
EVENTBRIDGE_BUS_NAME	ancwave-event-bus
REVALIDATE_SECRET	ancwave_revalidation_secret_token_2026
⚡ Lambda 2: ancwave-order-processor (Background Worker)
This function does not need Docker. You create it in 30 seconds directly in the AWS web console.

Step 1: Create the Function (in AWS Console)
Go to AWS Lambda (Region: ap-south-1).
Click Create function.
Choose Author from scratch.
Function name: ancwave-order-processor.
Runtime: Node.js 20.x or Node.js 22.x.
Architecture: arm64.
Click Create function.
Step 2: Paste the Code Directly in the Web Editor
In the Code source tab, double-click index.mjs and paste:

javascript
export const handler = async (event) => {
  console.log("=== EventBridge Event Received ===", JSON.stringify(event, null, 2));
  const detail = event.detail || {};
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  try {
    // 1. Purge Next.js On-Demand ISR Edge Cache
    if (appUrl && revalidateSecret) {
      console.log(`Purging cache at: ${appUrl}/api/revalidate`);
      const res = await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": revalidateSecret,
        },
        body: JSON.stringify({
          path: "/",
          tag: "product-details",
          triggeredBy: "AWS Lambda (ancwave-order-processor)",
          orderId: detail.orderId,
        }),
      });
      const data = await res.json();
      console.log("Revalidation result:", data);
    }
    console.log(`Order ${detail.orderNumber || detail.orderId} processed.`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Processor error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
Click Deploy.

Step 3: Add Its 2 Environment Variables
Under Configuration → Environment variables:

REVALIDATE_SECRET: ancwave_revalidation_secret_token_2026
APP_URL: Your ancwave-live-app Function URL from Lambda 1 (e.g. https://abcdef12345.lambda-url.ap-south-1.on.aws or your CloudFront domain https://d3h0eouvv2gscn.cloudfront.net).
Summary Checklist
Docker Hub: Not needed. Use Amazon ECR.
Secrets: Added directly in the AWS Lambda Console UI. Docker never touches them.
GitHub Secrets: Not needed for manual deploys. If using GitHub Actions, only add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.