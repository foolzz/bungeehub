# BungeeHub Architecture Guide

This guide explains how to switch between **Combined** and **Separated** architecture modes.

## Table of Contents
- [Overview](#overview)
- [Current Setup: Combined Mode](#current-setup-combined-mode)
- [How to Separate Frontend & Backend](#how-to-separate-frontend--backend)
- [Development Workflows](#development-workflows)
- [Production Deployment](#production-deployment)
- [When to Separate](#when-to-separate)

---

## Overview

BungeeHub supports two architectural modes:

### 🔗 Combined Mode (Current Default)
- **Single Server**: API + Web on port 8080
- **Benefits**: Simple, no CORS, one deployment
- **Use Case**: MVP, development, small-scale production

### 🔀 Separated Mode
- **Two Servers**: API (port 8080) + Web (port 3000)
- **Benefits**: Independent scaling, CDN support, SSR
- **Use Case**: Production at scale, team specialization

---

## Current Setup: Combined Mode

### How It Works

```
┌─────────────────────────────────────┐
│  Single Node.js Server (Port 8080)  │
│  ┌─────────────────────────────┐   │
│  │  NestJS Backend (API)       │   │
│  │  /api/v1/*                  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Next.js Static Files       │   │
│  │  / (web pages)              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Start Combined Mode

```bash
# Option 1: Default (serves both API and web)
npm run start:dev

# Option 2: Explicit combined mode
npm run dev:combined
```

### Access Points
- **Web UI**: http://localhost:8080/
- **API**: http://localhost:8080/api/v1/*
- **API Docs**: http://localhost:8080/api-docs

---

## How to Separate Frontend & Backend

### Step 1: Update Environment Variables

**Backend** (`.env`):
```bash
# Set to false to disable serving static files
SERVE_STATIC=false

# Update CORS to allow frontend origin
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`web/.env.local`):
```bash
# Point to separate API server
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Step 2: Update Next.js Config

Edit `web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable SSR
  // output: 'export',  // Comment this out

  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8080/api/v1',
  },
}

module.exports = nextConfig
```

### Step 3: Start Servers Separately

**Terminal 1 - Backend (API):**
```bash
# Starts API only on port 8080
npm run dev:separated
```

**Terminal 2 - Frontend (Web):**
```bash
cd web
npm run dev
# Runs on port 3000
```

### Architecture After Separation

```
┌─────────────────────────┐      ┌──────────────────────┐
│  Frontend (Port 3000)   │ ───> │  Backend (Port 8080) │
│  Next.js with SSR       │ API  │  NestJS API          │
│  http://localhost:3000  │      │  /api/v1/*           │
└─────────────────────────┘      └──────────────────────┘
```

---

## Development Workflows

### Combined Mode (Current)
```bash
# Build web frontend
npm run build:web

# Start everything together
npm run start:dev

# Access at: http://localhost:8080
```

### Separated Mode
```bash
# Terminal 1: API Server
npm run dev:separated

# Terminal 2: Web Server
cd web && npm run dev

# Access web at: http://localhost:3000
# API at: http://localhost:8080/api/v1
```

### Quick Switch Scripts

**`package.json` scripts:**
- `npm run dev:combined` - Combined mode (builds web + starts server)
- `npm run dev:separated` - API only mode (SERVE_STATIC=false)
- `npm run start:api-only` - Same as separated mode
- `npm run build:web` - Build Next.js frontend
- `npm run build:all` - Build both web and API

---

## Production Deployment

### Combined Deployment

**Docker Example:**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy and install backend
COPY package*.json ./
RUN npm ci --only=production

# Copy and build frontend
COPY web/ ./web/
RUN cd web && npm ci && npm run build

# Copy backend source
COPY . .
RUN npm run build

# Start combined server
EXPOSE 8080
CMD ["npm", "run", "start:prod"]
```

**Cloud Run / Heroku:**
```bash
# Build both
npm run build:all

# Deploy
gcloud run deploy bungeehub --source .
```

### Separated Deployment

#### Backend (Cloud Run)
```bash
# .env
SERVE_STATIC=false
CORS_ORIGIN=https://bungeehub.com

# Deploy
gcloud run deploy bungeehub-api \
  --source . \
  --set-env-vars SERVE_STATIC=false
```

#### Frontend (Vercel/Netlify)
```bash
# web/.env.production
NEXT_PUBLIC_API_URL=https://api.bungeehub.com/api/v1

# Deploy to Vercel
cd web
vercel --prod

# Or Netlify
netlify deploy --prod
```

---

## When to Separate

### Stick with Combined If:
- ✅ MVP or early stage
- ✅ Small team (< 5 developers)
- ✅ Traffic < 10k requests/day
- ✅ Simple deployment preferred
- ✅ Budget constraints

### Separate When:
- ⚡ Need independent scaling (API vs Frontend)
- ⚡ Want SSR/ISR for SEO
- ⚡ Multiple platforms (web + mobile)
- ⚡ Different deployment schedules
- ⚡ Traffic > 100k requests/day
- ⚡ Specialized teams (frontend vs backend)
- ⚡ Global CDN distribution needed

---

## Environment Variables Reference

### Backend (`/.env`)

```bash
# Architecture Mode
SERVE_STATIC=true          # true = combined, false = separated

# CORS (for separated mode)
CORS_ORIGIN=http://localhost:3000,https://bungeehub.com
CORS_CREDENTIALS=true

# API Configuration
PORT=8080
API_VERSION=v1
ENABLE_API_DOCS=true
```

### Frontend (`/web/.env.local`)

```bash
# API URL - adjust based on mode
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1  # Combined
# NEXT_PUBLIC_API_URL=https://api.bungeehub.com/api/v1  # Separated Production
```

---

## Migration Checklist

### From Combined → Separated

- [ ] Update `.env` with `SERVE_STATIC=false`
- [ ] Update `.env` with CORS origins
- [ ] Create `web/.env.local` with API URL
- [ ] Update `web/next.config.js` (remove `output: 'export'`)
- [ ] Start API: `npm run dev:separated`
- [ ] Start Web: `cd web && npm run dev`
- [ ] Test API access from web
- [ ] Update deployment configurations

### From Separated → Combined

- [ ] Update `.env` with `SERVE_STATIC=true`
- [ ] Update `web/next.config.js` (add `output: 'export'`)
- [ ] Build web: `npm run build:web`
- [ ] Start combined: `npm run start:dev`
- [ ] Test everything at http://localhost:8080

---

## Troubleshooting

### CORS Errors (Separated Mode)
```bash
# Make sure backend .env has:
CORS_ORIGIN=http://localhost:3000
```

### API Not Found (Combined Mode)
```bash
# Make sure web is built:
npm run build:web

# Check SERVE_STATIC is true:
echo $SERVE_STATIC  # Should be 'true' or empty
```

### Web Not Loading (Combined Mode)
```bash
# Verify static files exist:
ls -la public/web/

# Rebuild if needed:
npm run build:web
```

---

## Summary

Your BungeeHub architecture is **designed for flexibility**:

- **Now**: Combined mode for simplicity
- **Later**: Switch to separated mode with minimal changes
- **Always**: Mobile apps work regardless of mode

The architecture supports both modes seamlessly! 🚀
