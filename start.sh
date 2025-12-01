#!/bin/bash

# DeliveryHub Start Script
# Quick start with minimal setup

set -e

echo "🚀 Starting DeliveryHub..."
echo ""

# Check if built
if [ ! -d "dist" ]; then
    echo "⚠️  Backend not built. Running build first..."
    ./build.sh
fi

if [ ! -d "web/out" ]; then
    echo "⚠️  Web not built. Running build first..."
    npm run build:web
fi

echo "🎯 Starting server on port 8080..."
echo "   - Web UI: http://localhost:8080/"
echo "   - API: http://localhost:8080/api/v1/*"
echo "   - API Docs: http://localhost:8080/api-docs"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

npm run start:prod
