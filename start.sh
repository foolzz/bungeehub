#!/bin/bash

# BungeeHub Start Script
# Quick start with minimal setup

set -e

echo "🚀 Starting BungeeHub..."
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

npm run start:prod
