"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cloud,
  Server,
  Database,
  Cpu,
  Shield,
  Zap,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Radio,
  FileCode,
  UploadCloud,
  Terminal,
  Activity,
  HelpCircle,
} from "lucide-react";
import { AWSEventLog } from "@/types";
import { toast } from "@/components/Toaster";

export default function AWSArchitecturePage() {
  const [selectedService, setSelectedService] = useState<string>("overview");
  const [eventLogs, setEventLogs] = useState<AWSEventLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [testUploadFileName, setTestUploadFileName] = useState("ancwave-customer-review.jpg");
  const [presignedResult, setPresignedResult] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/aws/eventbridge");
      if (res.ok) {
        const data = await res.json();
        setEventLogs(data.logs || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDispatchTestEvent = async (detailType: string) => {
    setIsDispatching(true);
    try {
      const res = await fetch("/api/aws/eventbridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detailType,
          detail: {
            source: "aws.architecture.interactive_console",
            simulatedPayload: {
              sku: "FORM-01-SILVER",
              deltaStock: -1,
              trigger: "Manual Interactive Test",
            },
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: `EventBridge Event '${detailType}' Emitted`,
          description: "Target Lambda executed and Next.js edge cache revalidated.",
        });
        fetchLogs();
      }
    } catch {
      toast({
        type: "error",
        title: "Dispatch Failed",
        description: "Failed to dispatch EventBridge event",
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleTestPresignedUrl = async () => {
    try {
      const res = await fetch("/api/aws/s3-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: testUploadFileName,
          contentType: "image/jpeg",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPresignedResult(data.data.uploadUrl);
        toast({
          type: "success",
          title: "S3 Presigned URL Generated",
          description: `Key: ${data.data.fileKey}`,
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Generation Failed",
        description: "Could not create presigned URL",
      });
    }
  };

  const handleTestCloudFrontInvalidate = async () => {
    try {
      const res = await fetch("/api/aws/cloudfront-invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: ["/*", "/api/product"] }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: `CloudFront Invalidation: ${data.invalidationId}`,
          description: "Global CDN edge cache wiped across 600+ Points of Presence.",
        });
        fetchLogs();
      }
    } catch {
      toast({
        type: "error",
        title: "Invalidation Failed",
        description: "Could not invalidate edge cache",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D0F] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to ancwave Store</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              <h1 className="text-base font-bold text-white tracking-tight">
                AWS Enterprise Architecture Hub
              </h1>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-mono">
                12-Year Senior Staff Blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All 8 AWS Services Healthy
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Cloud Infrastructure Deep-Dive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            How CloudFront, EventBridge, Lambda & S3 Power ancwave
          </h2>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            A production-ready e-commerce architecture combining Next.js On-Demand ISR, global CloudFront edge distribution, MongoDB Atlas replication, and event-driven decoupling with Amazon EventBridge.
          </p>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Live Request & Revalidation Lifecycle
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click any component below to inspect its cloud configuration and IAM policy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestCloudFrontInvalidate}
                className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                Invalidate CloudFront Cache
              </button>
            </div>
          </div>

          {/* Flow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Route 53 + ACM */}
            <div
              onClick={() => setSelectedService("acm")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedService === "acm"
                  ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                  : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>01. DNS & SSL</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h4 className="font-bold text-sm text-zinc-100">ACM + Route 53</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                Wildcard SSL/TLS 1.3 certificates auto-renewed with latency routing.
              </p>
            </div>

            {/* Step 2: CloudFront Edge */}
            <div
              onClick={() => setSelectedService("cloudfront")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedService === "cloudfront"
                  ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                  : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>02. Global Edge CDN</span>
                <Zap className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h4 className="font-bold text-sm text-zinc-100">AWS CloudFront</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                Sub-15ms edge caching. Stale-while-revalidate headers.
              </p>
            </div>

            {/* Step 3: EC2 & Container */}
            <div
              onClick={() => setSelectedService("ec2")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedService === "ec2"
                  ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                  : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>03. App Cluster</span>
                <Server className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h4 className="font-bold text-sm text-zinc-100">EC2 & Docker</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                Next.js 16 App Router on AWS Graviton3 (t4g.large) with ALB.
              </p>
            </div>

            {/* Step 4: EventBridge */}
            <div
              onClick={() => setSelectedService("eventbridge")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedService === "eventbridge"
                  ? "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
                  : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>04. Event Engine</span>
                <Radio className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Amazon EventBridge</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                Asynchronous event bus triggering Lambda and instant ISR revalidation.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Deep Dive Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Service Selector Tabs */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
              Select Architecture Pillar:
            </span>

            {[
              { id: "eventbridge", name: "Amazon EventBridge (Event Bus)", icon: Radio },
              { id: "cloudfront", name: "AWS CloudFront (Edge Caching)", icon: Zap },
              { id: "lambda", name: "AWS Lambda (Serverless Workers)", icon: Cpu },
              { id: "s3", name: "Amazon S3 (Presigned Uploads)", icon: UploadCloud },
              { id: "ec2", name: "EC2 & Docker (Compute)", icon: Server },
              { id: "iam", name: "IAM (Least-Privilege Security)", icon: Shield },
              { id: "acm", name: "Certificate Manager (ACM)", icon: Lock },
              { id: "support", name: "AWS Enterprise Support & Alarms", icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedService(tab.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    selectedService === tab.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 space-y-6">
              {/* EventBridge Tab */}
              {selectedService === "eventbridge" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-purple-400" />
                        Amazon EventBridge Bus: ancwave-event-bus
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Decouples customer checkout from background operations (stock sync, cache revalidation, invoicing).
                      </p>
                    </div>
                  </div>

                  {/* Interactive Test Event Dispatcher */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <span className="text-xs font-mono font-medium text-zinc-400 block">
                      Dispatch Live Test Event to Event Bus:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDispatchTestEvent("OrderPlaced")}
                        disabled={isDispatching}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Simulate OrderPlaced Event
                      </button>
                      <button
                        onClick={() => handleDispatchTestEvent("FlashDiscountTriggered")}
                        disabled={isDispatching}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Simulate FlashDiscount Event
                      </button>
                      <button
                        onClick={() => handleDispatchTestEvent("StockUpdated")}
                        disabled={isDispatching}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Simulate Inventory Restock
                      </button>
                    </div>
                  </div>

                  {/* EventBridge JSON Pattern Example */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Event Pattern Rule (infrastructure/aws/eventbridge-rules.json)</span>
                      <span>Target: Lambda + ISR Webhook</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`{
  "source": ["aws.eventbridge.ancwave"],
  "detail-type": ["OrderPlaced", "StockUpdated", "CachePurged"],
  "detail": {
    "stockImpact": ["DEDUCTED", "ADJUSTED"]
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* CloudFront Tab */}
              {selectedService === "cloudfront" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        AWS CloudFront Distribution & Edge ISR
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Edge distribution accelerating product pages, images, and audio assets with sub-15ms p95 latency.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-zinc-500 font-mono">Distribution ID</span>
                      <p className="font-bold text-white font-mono">E3EXAMPLE9823CF</p>
                      <span className="text-[10px] text-emerald-400">Status: Deployed · Global</span>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-zinc-500 font-mono">Cache Policy</span>
                      <p className="font-bold text-white font-mono">Managed-CachingOptimized</p>
                      <span className="text-[10px] text-zinc-400">Brotli + Gzip + HTTP/3</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>CloudFront Response Headers</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`Cache-Control: public, s-maxage=60, stale-while-revalidate=300
X-Cache: Hit from cloudfront
X-Amz-Cf-Pop: IAD89-C1
X-Inventory-Status: LOW_STOCK`}
                    </pre>
                  </div>
                </div>
              )}

              {/* S3 Presigned URL Tab */}
              {selectedService === "s3" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-amber-400" />
                        Amazon S3 & Direct Presigned Uploads
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Zero server bandwidth used: Clients upload high-res images and review photos straight to S3 with cryptographic signatures.
                      </p>
                    </div>
                  </div>

                  {/* Test Presigned URL Form */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <span className="text-xs font-mono font-medium text-zinc-400 block">
                      Interactive S3 Signature V4 Generator:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testUploadFileName}
                        onChange={(e) => setTestUploadFileName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                        placeholder="file-name.jpg"
                      />
                      <button
                        onClick={handleTestPresignedUrl}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Generate Presigned PUT URL
                      </button>
                    </div>

                    {presignedResult && (
                      <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 break-all">
                        <span className="text-emerald-400 font-bold block mb-1">
                          Generated AWS SigV4 Presigned URL (Valid 15m):
                        </span>
                        {presignedResult}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lambda Tab */}
              {selectedService === "lambda" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-rose-400" />
                        AWS Lambda Order & Revalidation Workers
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        ARM64 Graviton-powered micro-workers executing stock deduction and invoking Next.js ISR on-demand revalidation.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Worker Handler (infrastructure/aws/lambda-revalidate-handler.js)</span>
                      <span>Runtime: Node.js 20.x</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`exports.handler = async (event) => {
  const { orderId, items } = event.detail;
  console.log(\`Processing order \${orderId}\`);
  
  // Call Next.js ISR Revalidation endpoint
  const res = await fetch("https://ancwave.com/api/revalidate", {
    method: "POST",
    headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET },
    body: JSON.stringify({ path: "/", tag: "product-details" })
  });
  
  return { statusCode: 200, body: JSON.stringify({ revalidated: true }) };
};`}
                    </pre>
                  </div>
                </div>
              )}

              {/* IAM Tab */}
              {selectedService === "iam" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        IAM Least-Privilege Policy: ancwave-app-role
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Strict security boundaries prohibiting root credentials. App only has scoped permissions to write S3 objects and put EventBridge events.
                      </p>
                    </div>
                  </div>

                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::ancwave-media-storage-production/*"
    },
    {
      "Effect": "Allow",
      "Action": ["events:PutEvents"],
      "Resource": "arn:aws:events:us-east-1:*:event-bus/ancwave-event-bus"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::*:distribution/E3EXAMPLE9823CF"
    }
  ]
}`}
                  </pre>
                </div>
              )}

              {/* EC2 Tab */}
              {selectedService === "ec2" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-emerald-400" />
                        EC2 & Docker Containerization
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Deployed on AWS Graviton3 (t4g.large) instances for 40% better price-to-performance.
                      </p>
                    </div>
                  </div>

                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
{`# Multi-stage production build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]`}
                  </pre>
                </div>
              )}

              {/* ACM Tab */}
              {selectedService === "acm" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-400" />
                        AWS Certificate Manager (ACM)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        TLS 1.3 certificates deployed to CloudFront edge nodes with DNS validation in Route 53.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Certificate ARN:</span>
                      <span className="font-mono text-zinc-200">arn:aws:acm:us-east-1:123456789:certificate/abc-123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Domain Name:</span>
                      <span className="font-mono text-zinc-200">*.ancwave.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Renewal Status:</span>
                      <span className="font-mono text-emerald-400">Success (Automatic DNS Validation)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Tab */}
              {selectedService === "support" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-cyan-400" />
                        AWS Enterprise Support & Monitoring
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        15-minute response SLO with 24/7 technical account managers and synthetic canary alarms.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="font-bold text-white block mb-1">CloudWatch Alarms</span>
                      <p className="text-zinc-400">5xx Error Rate &gt; 1% triggers PagerDuty & auto-rollback.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="font-bold text-white block mb-1">Synthetic Canaries</span>
                      <p className="text-zinc-400">Pings `/api/product` every 60s from Tokyo, Frankfurt, and Virginia.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live EventBridge Stream Log Viewer */}
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Live EventBridge Event Stream
              </h3>
            </div>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Stream
            </button>
          </div>

          <div className="space-y-3">
            {eventLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center font-mono">
                No events in buffer. Click "Simulate OrderPlaced Event" above to dispatch.
              </p>
            ) : (
              eventLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-400">
                    <span className="text-purple-400 font-bold">
                      [{log.detailType}]
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      ID: {log.eventId} · {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-zinc-300 text-[11px]">
                    Lambda execution:{" "}
                    <span className="text-emerald-400">
                      {log.lambdaExecution.status} ({log.lambdaExecution.durationMs}ms)
                    </span>{" "}
                    · Revalidated:{" "}
                    <span className="text-blue-400">{log.revalidationStatus.revalidatedPath}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
