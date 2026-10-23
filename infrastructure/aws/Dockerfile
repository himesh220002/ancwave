# -------------------------------------------------------------------
# Multi-Stage Production Dockerfile for ancwave Next.js 16 on AWS EC2
# -------------------------------------------------------------------

# 1. Base Image with Node 20 on Alpine Linux
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 2. Dependency Installer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 4. Production Runner Stage (Dual-Compatible: AWS Lambda Serverless Scale-to-Zero & EC2/ECS)
FROM node:20-alpine AS runner
WORKDIR /app

# AWS Lambda Web Adapter: translates incoming Lambda Function URL events directly to HTTP port 3000
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
RUN chmod +x /opt/extensions/lambda-adapter

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV AWS_LWA_PORT=3000
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV AWS_LWA_INVOKE_MODE=response_stream

# Non-root user security for AWS compliance
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Writable cache symlink for AWS Lambda read-only container root
RUN ln -sf /tmp/cache ./.next/cache && \
    printf '#!/bin/sh\n[ -d "/tmp" ] && mkdir -p /tmp/cache 2>/dev/null || true\nexec node server.js\n' > ./run.sh && \
    chmod +x ./run.sh && \
    chown nextjs:nodejs ./run.sh

USER nextjs

EXPOSE 3000

CMD ["./run.sh"]
