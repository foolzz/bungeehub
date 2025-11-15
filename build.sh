#!/bin/bash

# BungeeHub Build Script
# Builds both web and backend for production

set -e

echo "🏗️  BungeeHub Production Build"
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

# Build everything
echo "🌐 Building web frontend..."
npm run build:web
echo "✅ Web frontend built"
echo ""

echo "⚙️  Building backend..."
npm run build
echo "✅ Backend built"
echo ""

echo "✅ Build complete!"
echo ""
echo "To start production server:"
echo "  npm run start:prod"
