#!/bin/bash

# Run ONLY the Next.js frontend dev server
# Use this if you want to run backend separately

echo "📱 Starting Next.js Frontend Dev Server..."
echo "   Frontend: http://localhost:3000"
echo ""
echo "Backend should be started separately with: ./dev-api.sh"
echo ""

npm run dev:web
