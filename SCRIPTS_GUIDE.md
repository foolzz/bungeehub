# BungeeHub Scripts Guide

Quick reference for all available scripts to build and run BungeeHub.

## 🚀 Quick Start Scripts

### First Time Setup
```bash
./setup.sh
```
**What it does:**
- Creates `.env` file from template
- Installs all dependencies (backend + web)
- Generates Prisma client
- Runs database migrations
- Builds web frontend

**When to use:** First time setting up the project

---

### Development Mode
```bash
./dev.sh
```
**What it does:**
- Checks dependencies are installed
- Generates Prisma client
- Builds web frontend
- Starts development server with hot reload

**Access:**
- Web: http://localhost:8080/
- API: http://localhost:8080/api/v1/*
- Docs: http://localhost:8080/api-docs

**When to use:** Daily development work

---

### Build for Production
```bash
./build.sh
```
**What it does:**
- Installs dependencies if needed
- Generates Prisma client
- Builds web frontend (static files)
- Builds backend (TypeScript → JavaScript)

**When to use:** Preparing for deployment

---

### Start Production Server
```bash
./start.sh
```
**What it does:**
- Checks if builds exist (runs build if not)
- Starts production server

**When to use:** Running in production mode

---

## 📋 NPM Scripts Reference

### Backend
```bash
npm run build                 # Build backend only
npm run start                 # Start backend (prod)
npm run start:dev             # Start with hot reload
npm run start:debug           # Start with debugger
npm run start:api-only        # Start API without web (separated mode)
```

### Frontend
```bash
npm run build:web             # Build web frontend only
npm run build:all             # Build both web + backend
```

### Development Modes
```bash
npm run dev:combined          # Combined mode (web + API together)
npm run dev:separated         # Separated mode (API only)
```

### Database
```bash
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Create new migration
npm run prisma:studio         # Open Prisma Studio GUI
npx prisma migrate deploy     # Apply migrations (production)
```

### Testing & Quality
```bash
npm run test                  # Run tests
npm run test:watch            # Run tests in watch mode
npm run test:cov              # Run tests with coverage
npm run lint                  # Run linter
npm run format                # Format code
```

---

## 🎯 Common Workflows

### Starting Fresh on a New Machine
```bash
# 1. Clone the repo
git clone <repo-url>
cd bungeehub

# 2. Run setup
./setup.sh

# 3. Update .env with your settings (DATABASE_URL, etc.)

# 4. Start development
./dev.sh
```

### Daily Development
```bash
# Just run dev script
./dev.sh

# Or manually:
npm run build:web && npm run start:dev
```

### Preparing for Deployment
```bash
# Build everything
./build.sh

# Test production build locally
./start.sh
```

### Switching Between Modes

**Combined Mode (current default):**
```bash
# .env
SERVE_STATIC=true

# Start
npm run start:dev
```

**Separated Mode:**
```bash
# .env
SERVE_STATIC=false

# Terminal 1: API
npm run dev:separated

# Terminal 2: Web
cd web && npm run dev
```

---

## 🔧 Troubleshooting

### "Cannot find module '@nestjs/serve-static'"
```bash
npm install
```

### "next: command not found"
```bash
cd web && npm install
```

### TypeScript errors during build
```bash
# Regenerate Prisma client
npx prisma generate

# Clean and rebuild
rm -rf dist
npm run build
```

### Database connection errors
```bash
# Check .env has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

### Web not loading (404 errors)
```bash
# Rebuild web
npm run build:web

# Check files exist
ls -la web/out/
```

---

## 📁 File Structure After Build

```
bungeehub/
├── dist/              # Built backend (JavaScript)
├── web/
│   └── out/          # Built frontend (static HTML/CSS/JS)
├── node_modules/     # Backend dependencies
├── web/node_modules/ # Frontend dependencies
└── public/
    └── web/          # Copied static files (served by backend)
```

---

## 🌐 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens

**Architecture:**
- `SERVE_STATIC` - true (combined) / false (separated)

**Optional:**
- `PORT` - Server port (default: 8080)
- `ENABLE_API_DOCS` - Enable Swagger docs (true/false)
- `CORS_ORIGIN` - Allowed CORS origins

See `.env.example` for all options.

---

## 💡 Tips

1. **Use `./dev.sh` for development** - It handles everything automatically
2. **Run `./build.sh` before deployment** - Ensures clean production builds
3. **Keep `.env` updated** - Never commit it to git
4. **Use `npx prisma studio`** - Visual database browser
5. **Check logs** - Server outputs helpful error messages

---

## 🆘 Getting Help

- Check logs for error messages
- Ensure all dependencies are installed
- Verify .env configuration
- See ARCHITECTURE_GUIDE.md for mode details
- See README.md for project overview
