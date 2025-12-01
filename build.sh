#!/bin/bash

# DeliveryHub Production Build Script
# Builds both web and backend for production/GCP deployment

set -e

echo "🏗️  DeliveryHub Production Build"
echo "=============================="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "web/node_modules" ]; then
    echo "📦 Installing web dependencies..."
    cd web && npm install && cd ..
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Build web frontend (static export for production)
echo "🌐 Building web frontend (production mode)..."
npm run build:web
echo "✅ Web frontend built to web/out/"
echo ""

# Copy web build to public directory for serving
echo "📦 Copying web build to public/web/..."
rm -rf public/web/*
cp -r web/out/* public/web/
echo "✅ Static files ready for serving"
echo ""

# Build backend
echo "⚙️  Building backend..."
npm run build
echo "✅ Backend built to dist/"
echo ""

echo "✅ Production build complete!"
echo ""
echo "To start production server:"
echo "  ./start.sh"
echo "  OR"
echo "  npm run start:prod"
echo ""
echo "To deploy to GCP:"
echo "  gcloud app deploy"
