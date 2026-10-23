#!/usr/bin/env bash
# ===================================================================
# ancwave AWS Serverless Lambda Deployment Script (Scale-to-Zero)
# Builds Next.js Standalone Container with AWS Lambda Web Adapter,
# pushes to Amazon ECR, and updates the live AWS Lambda Function.
# ===================================================================

set -e

# Disable interactive pager in AWS CLI (prevents 'less' pager from blocking scripts)
export AWS_PAGER=""

# Configurable AWS settings (Defaults to current project settings)
AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-823787500418}"
ECR_REPO="ancwave-live-app"
LAMBDA_FUNCTION_NAME="ancwave-live-app"
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest"

echo "=========================================================="
echo "⚡ Deploying ancwave to AWS Lambda (Scale-to-Zero Architecture)"
echo "Region:     ${AWS_REGION}"
echo "Account ID: ${AWS_ACCOUNT_ID}"
echo "Image URI:  ${IMAGE_URI}"
echo "=========================================================="

# 1. Authenticate Docker with Amazon ECR
echo "🔑 Logging in to Amazon ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" || {
  echo "⚠️ Note: Ensure your AWS CLI is configured with credentials (aws configure)."
}

# 2. Ensure ECR Repository exists
echo "📦 Ensuring Amazon ECR repository '${ECR_REPO}' exists..."
aws ecr describe-repositories --repository-names "${ECR_REPO}" --region "${AWS_REGION}" 2>/dev/null || \
aws ecr create-repository --repository-name "${ECR_REPO}" --region "${AWS_REGION}" --image-scanning-configuration scanOnPush=true

# 3. Build the Docker container with AWS Lambda Web Adapter
echo "🔨 Building container image for linux/amd64..."
docker build --platform linux/amd64 -t "${ECR_REPO}:latest" -f infrastructure/aws/Dockerfile .

# 4. Tag and Push image to ECR
echo "🚀 Pushing container to Amazon ECR..."
docker tag "${ECR_REPO}:latest" "${IMAGE_URI}"
docker push "${IMAGE_URI}"

# 5. Update or Create Lambda Function
echo "⚡ Updating AWS Lambda function code..."
if aws lambda get-function --function-name "${LAMBDA_FUNCTION_NAME}" --region "${AWS_REGION}" 2>/dev/null; then
    aws lambda update-function-code \
        --function-name "${LAMBDA_FUNCTION_NAME}" \
        --image-uri "${IMAGE_URI}" \
        --region "${AWS_REGION}"
    echo "✅ Lambda function code updated successfully!"
else
    echo "ℹ️ Lambda function '${LAMBDA_FUNCTION_NAME}' does not exist yet."
    echo "👉 Create it in the AWS Lambda Console as a 'Container Image' selecting image URI: ${IMAGE_URI}"
    echo "   Or run:"
    echo "   aws lambda create-function --function-name ${LAMBDA_FUNCTION_NAME} --package-type Image --code ImageUri=${IMAGE_URI} --role <YOUR_LAMBDA_ROLE_ARN> --region ${AWS_REGION}"
fi

echo ""
echo "=========================================================="
echo "🎉 Deployment Complete!"
echo "• When 0 users are browsing: Lambda scales to 0 (\$0.00/month compute bill)"
echo "• When a user arrives: Lambda starts instantly and handles Next.js traffic"
echo "• Fast edge assets served from CloudFront & S3"
echo "=========================================================="
