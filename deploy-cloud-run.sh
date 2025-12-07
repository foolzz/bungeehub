#!/bin/bash

# DeliveryHub - Cloud Run Deployment Script
# This script deploys to Cloud Run (recommended for cost savings)
# Cloud Run scales to zero and only charges for actual requests

set -e

echo "🚀 DeliveryHub - Cloud Run Deployment"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get GCP project ID
echo "📋 Checking GCP configuration..."
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No GCP project configured${NC}"
    echo "Please set your project ID:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✅ GCP Project: $PROJECT_ID${NC}"
echo ""

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --quiet 2>/dev/null || true
echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

# Set variables
SERVICE_NAME="deliveryhub-api"
REGION="us-central1"  # Change to your preferred region
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Confirm deployment
echo -e "${YELLOW}⚠️  You are about to deploy to Cloud Run${NC}"
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""
echo -e "${BLUE}💡 Benefits:${NC}"
echo "   • Scales to zero (no cost when idle)"
echo "   • Pay only for requests"
echo "   • Estimated cost: \$5-15/month with low traffic"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Build Docker image
echo ""
echo "🔨 Building Docker image..."
echo "   This may take 5-10 minutes..."
echo ""

gcloud builds submit --tag $IMAGE_NAME --quiet

echo -e "${GREEN}✅ Image built successfully${NC}"
echo ""

# Deploy to Cloud Run
echo "📦 Deploying to Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars "NODE_ENV=production,PORT=8080,SERVE_STATIC=true" \
  --set-env-vars "DATABASE_URL=postgresql://neondb_owner:npg_R2xz9UfWPLQF@ep-fragrant-forest-afgn14ks-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  --set-env-vars "JWT_SECRET=594cfec8324f8839f137cbe20cb4e125eb8407a0e5e03b818799cf43a4b51d84faac383c43f396ae739b18ec2e05a9b2d92983af08cb9174131a20cbe4a3e810,JWT_EXPIRY=24h" \
  --set-env-vars "JWT_REFRESH_SECRET=ec8b51047c5930e966a0e5a6edcb80e3cf2752f7c5209789cd4ad277358f9ff1d2421c9f3a19a131b1b41f6e79b90826184bb7df9a063bc76653793c3ef40680,JWT_REFRESH_EXPIRY=7d" \
  --set-env-vars "API_VERSION=v1,API_BASE_URL=https://deliveryhub-479919.appspot.com/api" \
  --set-env-vars "RATE_LIMIT_WINDOW_MS=900000,RATE_LIMIT_MAX_REQUESTS=100" \
  --set-env-vars "CORS_ORIGIN=https://deliveryhub-479919.appspot.com,CORS_CREDENTIALS=true" \
  --set-env-vars "MAX_FILE_SIZE=10485760,ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp" \
  --set-env-vars "LOG_LEVEL=info,LOG_FORMAT=json" \
  --set-env-vars "ENABLE_WEBHOOKS=true,ENABLE_EMAIL_NOTIFICATIONS=false,ENABLE_SMS_NOTIFICATIONS=false" \
  --set-env-vars "ENABLE_ANALYTICS=true,ENABLE_API_DOCS=true" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' 2>/dev/null)

echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "========================================"
echo ""
echo "🌐 Your application is now live at:"
echo "   $SERVICE_URL"
echo ""
echo "💰 Cost Benefits:"
echo "   • Scales to zero when idle (no cost)"
echo "   • Pay only for actual requests"
echo "   • Estimated: \$5-15/month with low traffic"
echo ""
echo "📊 Useful commands:"
echo "   View logs:     gcloud run logs tail $SERVICE_NAME --region $REGION"
echo "   View service:  gcloud run services describe $SERVICE_NAME --region $REGION"
echo "   List services: gcloud run services list"
echo "   Delete:        gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
echo "🔧 Post-deployment checklist:"
echo "   ☐ Verify health endpoint: ${SERVICE_URL}/api/v1/health"
echo "   ☐ Check database connection"
echo "   ☐ Test API endpoints"
echo "   ☐ Verify web frontend loads"
echo "   ☐ Check API documentation: ${SERVICE_URL}/api-docs"
echo ""
echo "💡 Next steps:"
echo "   • Update DNS/Custom domain if needed"
echo "   • Set up Cloud Run domain mapping"
echo "   • Monitor costs in GCP Console"
echo ""

