#!/bin/bash

# Run ONLY the backend API server (without static file serving)
# Use this if you want to run frontend separately

echo "🔧 Starting Backend API Server Only..."
echo "   API: http://localhost:8080/api/v1"
echo "   API Docs: http://localhost:8080/api-docs"
echo ""
echo "Frontend should be started separately with: ./dev-web.sh"
echo ""

npm run dev:api
