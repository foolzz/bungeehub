# BungeeHub Development Guide

## Development Modes

BungeeHub now supports TWO different development approaches:

### 🚀 Quick Start (Recommended) - Dev Mode with Hot Reload

**Use this for daily development - NO MORE CACHE ISSUES!**

```bash
./dev.sh
```

This runs:
- **Frontend**: Next.js dev server on `http://localhost:3000` (with hot reload)
- **Backend**: NestJS API on `http://localhost:8080/api/v1` (with hot reload)

**Benefits:**
- ✅ Instant hot reload on code changes
- ✅ No browser caching issues
- ✅ Faster development cycle
- ✅ Better error messages and debugging

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:8080/api/v1
- API Docs: http://localhost:8080/api-docs

---

### 🔧 Manual Control - Separate Servers

If you prefer running servers in separate terminals:

**Terminal 1 - Backend:**
```bash
./dev-api.sh
# OR
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
./dev-web.sh
# OR
npm run dev:web
```

---

### 📦 Production Mode (for testing production builds)

Only use this when testing production deployment:

```bash
./build.sh  # Build everything
./start.sh  # Run in production mode
```

This serves static files like in production (port 8080 only).

---

## Important Browser Setup

### For Best Development Experience

**Always keep Chrome DevTools open with cache disabled:**

1. Open DevTools: Press `F12`
2. Go to **Network** tab
3. Check **"Disable cache"** checkbox
4. Keep DevTools open while developing

### If You See Stale Code / 400 Errors

**Hard Refresh:**
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5`

**Clear Browser Cache:**
1. Chrome: `F12` → Right-click refresh button → "Empty Cache and Hard Reload"
2. Or: Settings → Privacy → Clear browsing data → Cached images and files

**Nuclear Option (if nothing works):**
- Close ALL browser windows
- Reopen and navigate to site
- Or use Incognito/Private mode
- Or try a different browser

---

## Production Deployment (GCP)

### Building for Production

```bash
./build.sh
```

This creates:
- Backend build in `dist/`
- Frontend static files in `public/web/`

### Deploying to GCP

```bash
gcloud app deploy
```

The production build:
- Uses static file export (Next.js `output: 'export'`)
- Serves everything from port 8080
- No separate frontend server needed

---

## Common Scripts

| Command | Description |
|---------|-------------|
| `./dev.sh` | Start both servers in dev mode (recommended) |
| `./dev-api.sh` | Start only backend API server |
| `./dev-web.sh` | Start only frontend dev server |
| `./build.sh` | Build for production/GCP deployment |
| `./start.sh` | Start production server |
| `npm run dev` | Same as `./dev.sh` |
| `npm run dev:api` | Same as `./dev-api.sh` |
| `npm run dev:web` | Same as `./dev-web.sh` |

---

## Troubleshooting

### "400 Bad Request" errors

This is usually cached JavaScript making old API calls.

**Solution:**
1. Stop all servers
2. Run `./dev.sh` (NOT `./build.sh`)
3. Hard refresh browser (Ctrl+Shift+R)
4. Clear browser cache if needed

### "Port already in use"

```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Frontend can't connect to API

Make sure:
1. Backend is running on port 8080
2. Check CORS settings in `src/main.ts`
3. Verify `NEXT_PUBLIC_API_URL` in `web/.env.local` (if exists)

### Database issues

```bash
# Reset database
npx prisma migrate reset

# Or just regenerate client
npx prisma generate
```

---

## Development vs Production

| Aspect | Development (`./dev.sh`) | Production (`./build.sh`) |
|--------|-------------------------|-------------------------|
| Frontend Port | 3000 | 8080 |
| Backend Port | 8080 | 8080 |
| Hot Reload | ✅ Yes | ❌ No |
| Caching | Disabled | Enabled |
| Build Time | None | ~30 seconds |
| Use Case | Daily dev | Testing/Deployment |

---

## Why Two Modes?

**Development mode** (`./dev.sh`):
- Uses Next.js dev server with hot module reloading
- No build step needed
- Changes appear instantly
- Never has cache issues

**Production mode** (`./build.sh` + `./start.sh`):
- Uses static file export
- Mimics GCP deployment
- Optimized and minified
- Tests production configuration

**Always use dev mode during development!**

---

## Questions?

- Check API docs: http://localhost:8080/api-docs
- Review logs in terminal
- Check browser console for errors
