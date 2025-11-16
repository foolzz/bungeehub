#!/bin/bash

# BungeeHub Development Script
# Quick start for development

set -e

echo "🚀 BungeeHub Development Startup"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update DATABASE_URL and other settings."
    echo ""
fi

# Check if web dependencies are installed
if [ ! -d "web/node_modules" ]; then
    echo "📦 Installing web dependencies..."
    cd web && npm install && cd ..
    echo "✅ Web dependencies installed"
    echo ""
fi

# Check if backend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo "✅ Backend dependencies installed"
    echo ""
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Build web frontend
echo "🌐 Building web frontend..."
echo "   Cleaning Next.js cache..."
rm -rf web/.next/cache
npm run build:web
echo "✅ Web frontend built"
echo ""

# Start the development server
echo "🎯 Starting combined server on port 8080..."
echo "   - Web UI: http://localhost:8080/"
echo "   - API: http://localhost:8080/api/v1/*"
echo "   - API Docs: http://localhost:8080/api-docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run start:dev
