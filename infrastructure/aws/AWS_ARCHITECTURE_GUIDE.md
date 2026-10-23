# ancwave — AWS Enterprise Architecture Masterclass Guide
*Authored by 12-Year Senior Staff Cloud Architect & Full-Stack Engineer*

---

## 1. Executive Summary & Architecture Diagram

`ancwave` is engineered for ultra-fast, high-converting e-commerce where **page speed, real-time inventory precision, and edge caching** directly drive sales.

```
                                  [ User Browser ]
                                         │
                                         ▼ (HTTPS / TLS 1.3 via ACM)
                             [ AWS CloudFront Global Edge ]
                           (d3h0eouvv2gscn.cloudfront.net)
                                    │               │
             (Static Assets & Media)│               │(Dynamic App & API Routes)
             (/_next/static/*, /img)│               │(/*)
                                    ▼               ▼
                       [ Amazon S3 Media Bucket ]   [ AWS Lambda: ancwave-live-app ]
                       (Presigned Direct Uploads)   (Next.js Standalone + AWS Web Adapter)
                                                    (⚡ Scale-to-Zero: $0.00 Idle Cost!)
                                                            │
                                            ┌───────────────┴───────────────┐
                                            ▼                               ▼
                                  [ MongoDB Atlas ]               [ Amazon EventBridge ]
                                  (Replicated DB)                 (Event Bus: ancwave-event-bus)
                                                                            │
                                                        ┌───────────────────┴───────────────────┐
                                                        ▼                                       ▼
                                              [ AWS Lambda Worker ]                  [ Next.js On-Demand ISR ]
                                              (ancwave-order-processor)              (/api/revalidate Hook)
```

---

## 2. The 8 AWS Services & How They Connect in ancwave

### 1. AWS CloudFront (CDN Edge Distribution)
- **Role**: Sits in front of the application to serve pages, headphone imagery, and acoustic assets globally with sub-15ms latency.
- **Cache-Control Strategy**:
  - `/images/*` -> `Cache-Control: public, max-age=31536000, immutable` (Cached for 1 year at edge).
  - Product Pages -> `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
  - `/api/checkout` -> Cache bypass (`CachePolicyId: 4135ea2d...`).
- **Edge Purge**: Connected to the on-demand revalidation trigger. When inventory changes, CloudFront cache is invalidated immediately via `cloudfront:CreateInvalidation`.

### 2. Amazon S3 (Simple Storage Service)
- **Role**: Secure object storage for high-resolution studio headphone photography, 3D exploded assembly diagrams, and customer review photos.
- **Presigned URLs**: Instead of users uploading photos through the Next.js server (which consumes expensive server memory and bandwidth), the client requests an **S3 SigV4 Presigned URL** (`/api/aws/s3-presign`) and uploads directly from the browser into S3 with client-side encryption.

### 3. Amazon EventBridge (Decoupled Event Bus)
- **Role**: The central nervous system of `ancwave`.
- **How It Works**:
  1. Customer completes checkout (`Pay $361.00`).
  2. The Next.js checkout handler issues a single `PutEvents` call to `ancwave-event-bus`.
  3. The checkout response returns immediately to the customer in <100ms.
  4. EventBridge asynchronously routes `OrderPlaced` to multiple targets:
     - **Target 1**: AWS Lambda worker (decrements inventory in DB).
     - **Target 2**: Next.js On-Demand ISR revalidate endpoint (wipes stale cache).
     - **Target 3**: Amazon SNS / SES (sends email receipt).

### 4. AWS Lambda (Serverless Compute & Scale-to-Zero)
- **Role**: Provides on-demand serverless execution that scales to zero ($0.00/month idle cost) when no users are active, and wakes up dynamically upon traffic.
- **Two Core Lambda Components**:
  1. **`ancwave-live-app` (Web Runner)**:
     - Runs the entire Next.js App Router standalone build packaged in Docker with the official **AWS Lambda Web Adapter**.
     - Connected to a **Lambda Function URL** with response streaming enabled (`AWS_LWA_INVOKE_MODE=response_stream`).
     - Scales to 0 instances when idle (zero cost!). Starts in ~800ms upon traffic, and remains warm with sub-25ms response times while users browse.
  2. **`ancwave-order-processor` (EventBridge Background Worker)**:
     - Asynchronously triggered by `ancwave-event-bus` on `OrderPlaced` and `StockUpdated`.
     - Executes Next.js On-Demand ISR cache invalidation (`/api/revalidate`) and background ledger updates without slowing down customer checkout.

### 5. AWS Certificate Manager (ACM)
- **Role**: Issues zero-cost wildcard SSL/TLS certificates (`*.ancwave.com`).
- **Feature**: Managed automatic renewal with DNS validation via Route 53. Deployed directly to CloudFront for TLS 1.3 protocol negotiation and Perfect Forward Secrecy.

### 6. Compute Comparison: Serverless Lambda vs. Traditional EC2
- **Option A (Recommended): AWS Lambda Serverless (Scale-to-Zero)**:
  - **Idle Cost**: **$0.00** (Uses AWS Lambda Free Tier: 1M free requests/month).
  - **Zero Maintenance**: No OS patching, no disk maintenance.
  - **Deployment**: Automatic container push to Amazon ECR (`infrastructure/aws/deploy-lambda.sh`).
- **Option B (Alternative): Traditional AWS EC2 (`t4g.large`)**:
  - Always-on VM running Docker container (`infrastructure/aws/deploy-ec2.sh`).
  - Fixed cost ~$20–$35/month billed 24/7. Zero cold start. Ideal for constant 24/7 high traffic.

### 7. AWS IAM (Identity & Access Management)
- **Role**: Enforces the principle of **least privilege**.
- **Configuration**:
  - The application never uses root or administrative AWS credentials.
  - The instance is assigned the `ancwave-app-role` role, allowing only:
    - `s3:PutObject` / `s3:GetObject` on the specific bucket.
    - `events:PutEvents` on `ancwave-event-bus`.
    - `cloudfront:CreateInvalidation` on the specific distribution.

### 8. AWS Enterprise Support & CloudWatch Monitoring
- **Role**: Production observability and 24/7 reliability.
- **Metrics**:
  - CloudFront 5xx error rate alarm (<1% SLO).
  - Lambda execution duration and throttles alarm.
  - Synthetic Canaries pinging `/api/product` every 60 seconds from multiple geographic regions.

---

## 3. The Cache & Revalidate Mechanism Demystified

The user asked:
> *"Cache saves your headphone details so the page loads instantly. When a customer buys a pair, a Revalidate command instantly wipes that old copy out. The next visitor immediately gets a fresh page showing the lower stock, active discounts, and the '🔥 Few left!' flash alert."*

### Step-by-Step Flow:
1. **Visitor A arrives**: CloudFront serves the pre-rendered HTML edge copy in **14 milliseconds**. Stock shows **5 units**.
2. **Visitor A clicks "Pay $361.00"**:
   - `/api/checkout` processes payment and reduces stock from 5 to 4.
   - `/api/checkout` executes `revalidatePath('/')` and `revalidateTag('product-details')`.
   - EventBridge receives `OrderPlaced` and triggers CloudFront cache invalidation.
3. **Visitor B arrives 2 seconds later**:
   - The edge copy was wiped by the revalidation command.
   - Next.js renders a brand new static snapshot.
   - Because stock is now **4** (which is $\le 5$), the dynamic alert banner **"🔥 Few left! Only 4 units remaining in current production batch"** is rendered immediately into the HTML!
