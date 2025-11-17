# BungeeHub Development Guide

## Quick Start

```bash
./dev.sh
```

This starts the application in **Single Port Mode** at http://localhost:8080

## Development Modes

### 1. Single Port Mode (Recommended) ⭐

**When to use**: When you want everything on one port (8080)

```bash
./dev.sh
# OR
npm run dev:single-port
```

- **Frontend**: http://localhost:8080/
- **Backend API**: http://localhost:8080/api/v1
- **Hot Reload**: ✅ Backend auto-restarts, Frontend auto-rebuilds
- **Cache Issues**: ✅ Avoided with cache-busting

### 2. Separated Mode (Dual Port)

**When to use**: When you want Next.js dev server for fastest frontend iteration

```bash
npm run dev
```

- **Frontend**: http://localhost:3000/ (Next.js dev server - instant updates)
- **Backend API**: http://localhost:8080/api/v1
- **Hot Reload**: ✅ Both servers with instant updates
- **Cache Issues**: ✅ Next.js dev server handles this

### 3. Combined Mode (Production-like)

**When to use**: Testing production builds locally

```bash
npm run dev:combined
```

- **Frontend + Backend**: http://localhost:8080/
- **Hot Reload**: ✅ Backend only (frontend needs manual rebuild)
- **Cache Issues**: Requires browser hard refresh

## How It Works

### Single Port Mode (`./dev.sh`)

1. Builds frontend initially
2. Starts backend server on port 8080 (serves static frontend files)
3. Watches frontend files for changes
4. Auto-rebuilds frontend when files change (takes a few seconds)
5. Refresh browser to see frontend changes

**Note**: Frontend changes require a browser refresh after the rebuild completes (watch for the "✅ Frontend rebuild complete!" message).

### Separated Mode

- Frontend runs on Next.js dev server (port 3000) - changes appear instantly
- Backend runs separately (port 8080)
- Best for rapid frontend development

## Environment Setup

Make sure you have a `.env` file (copied from `.env.example`):

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A secure random string
- Other settings as needed

## Tips

1. **Browser Cache**: In DevTools, check "Disable cache" under Network tab
2. **Database**: The app will start without a database connection, but API endpoints won't work
3. **Rebuilds**: Watch the terminal for "✅ Frontend rebuild complete!" before refreshing

## Troubleshooting

**Port 8080 already in use?**
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9
```

**Frontend not updating?**
- Check terminal for build errors
- Wait for "✅ Frontend rebuild complete!"
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

**Database errors?**
- Make sure PostgreSQL is running, or
- The app will start anyway (without database, serving static files only)
