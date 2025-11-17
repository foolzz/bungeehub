#!/bin/bash

# BungeeHub Development Script
# Serves both frontend and backend on http://localhost:8080
# Watches for frontend changes and rebuilds automatically!

set -e

echo "🚀 BungeeHub Development Startup (Single Port Mode)"
echo "===================================================="
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

# Initial web build
echo "🔨 Building frontend (initial build)..."
npm run build:web
echo "✅ Frontend built"
echo ""

# Start both servers with hot reload
echo "🎯 Starting development servers..."
echo ""
echo "   🌐 Application:  http://localhost:8080"
echo "   🔧 Backend API:  http://localhost:8080/api/v1"
echo "   📚 API Docs:     http://localhost:8080/api-docs"
echo ""
echo "⚡ Hot reload enabled:"
echo "   • Backend changes: Auto-restart"
echo "   • Frontend changes: Auto-rebuild (may take a few seconds)"
echo ""
echo "💡 TIP: Frontend changes require a browser refresh after rebuild completes"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev:single-port
