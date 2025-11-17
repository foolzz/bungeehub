#!/bin/bash

# BungeeHub Development Script (NEW - Dev Mode with Hot Reload)
# Runs frontend on port 3000 and backend on port 8080
# NO MORE BROWSER CACHE ISSUES!

set -e

echo "🚀 BungeeHub Development Startup (Dev Mode)"
echo "==========================================="
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

# Start both servers with hot reload
echo "🎯 Starting development servers..."
echo ""
echo "   📱 Frontend (Next.js Dev): http://localhost:3000"
echo "   🔧 Backend API:            http://localhost:8080/api/v1"
echo "   📚 API Docs:               http://localhost:8080/api-docs"
echo ""
echo "⚡ Hot reload enabled - changes update automatically!"
echo "✨ No more cache issues - always using latest code!"
echo ""
echo "💡 TIP: Keep DevTools open with 'Disable cache' checked for best experience"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev
