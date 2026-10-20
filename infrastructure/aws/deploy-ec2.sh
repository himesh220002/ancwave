#!/usr/bin/env bash
# ===================================================================
# ancwave AWS EC2 Production Automated Deployment Script
# Targets: Amazon Linux 2023 / Ubuntu 22.04 LTS on AWS Graviton3
# ===================================================================

set -e

echo "🚀 Starting ancwave deployment on AWS EC2..."

# 1. Update OS packages and install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker engine..."
    sudo dnf update -y || sudo apt update -y
    sudo dnf install -y docker || sudo apt install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
fi

# 2. Build or pull ancwave container
echo "🔨 Building Docker image: ancwave:latest..."
docker build -t ancwave:latest -f infrastructure/aws/Dockerfile .

# 3. Stop existing container if running
if docker ps -a --format '{{.Names}}' | grep -Eq "^ancwave$"; then
    echo "🛑 Stopping existing container..."
    docker stop ancwave || true
    docker rm ancwave || true
fi

# 4. Run production container with auto-restart
echo "⚡ Starting ancwave container on port 3000..."
docker run -d \
  --name ancwave \
  --restart always \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  ancwave:latest

echo "✅ ancwave is running smoothly on http://localhost:3000"
echo "🌐 Configure your CloudFront distribution to point to this EC2 public DNS / Elastic IP."
