#!/bin/bash

# DeliveryHub - GCP App Engine Deployment Script
# This script deploys the application to Google Cloud Platform App Engine

set -e

echo "🚀 DeliveryHub - GCP App Engine Deployment"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Confirm deployment
echo -e "${YELLOW}⚠️  You are about to deploy to GCP App Engine${NC}"
echo "   Project: $PROJECT_ID"
echo "   Service: default"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Check if DATABASE_URL is configured in app.yaml
echo "🔍 Checking configuration..."
if grep -q "DATABASE_URL.*postgresql://" app.yaml 2>/dev/null; then
    echo -e "${GREEN}✅ DATABASE_URL found in app.yaml${NC}"
    DB_CONFIGURED=true
else
    echo -e "${YELLOW}⚠️  WARNING: DATABASE_URL not found in app.yaml${NC}"
    DB_CONFIGURED=false
fi

# Check for placeholder values in app.yaml
if grep -q "YOUR_PROJECT_ID" app.yaml 2>/dev/null; then
    echo -e "${RED}❌ Error: Found 'YOUR_PROJECT_ID' placeholder in app.yaml${NC}"
    echo "Please update app.yaml and replace YOUR_PROJECT_ID with your actual project ID."
    echo ""
    echo "Quick fix:"
    echo "  sed -i '' 's/YOUR_PROJECT_ID/$PROJECT_ID/g' app.yaml"
    exit 1
fi

if grep -q "your-super-secret-jwt-key-change-this-in-production" app.yaml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: JWT secrets in app.yaml still use placeholder values${NC}"
    echo "Recommendation: Generate secure secrets before deploying to production."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Please update JWT secrets in app.yaml."
        exit 0
    fi
fi

echo ""
echo "📦 Deploying to GCP App Engine..."
echo "   This may take 5-10 minutes..."
echo ""

# Deploy to App Engine using configuration from app.yaml
gcloud app deploy --quiet

# Get the deployment URL
APP_URL=$(gcloud app browse --no-launch-browser 2>&1 | grep -o 'https://[^ ]*' || echo "")

echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "========================================"
echo ""
echo "🌐 Your application is now live at:"
if [ ! -z "$APP_URL" ]; then
    echo "   $APP_URL"
else
    echo "   https://$PROJECT_ID.appspot.com"
fi
echo ""
echo "📊 Useful commands:"
echo "   View logs:     gcloud app logs tail -s default"
echo "   Open browser:  gcloud app browse"
echo "   View versions: gcloud app versions list"
echo "   Describe app:  gcloud app describe"
echo ""
echo "🔧 Post-deployment checklist:"
echo "   ☐ Verify health endpoint: /api/v1/health"
echo "   ☐ Check database connection"
echo "   ☐ Test API endpoints"
echo "   ☐ Verify web frontend loads"
echo "   ☐ Check API documentation: /api-docs"
echo ""
