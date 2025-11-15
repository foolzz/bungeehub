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
npm run prisma:seed           # Seed database with test data
npx prisma migrate deploy     # Apply migrations (production)
```

### Testing & Data Generation
```bash
npm run seed:packages [count]           # Generate test packages (default: 50)
npm run seed:routes list                # List all packages with status
npm run seed:routes progress [count]    # Move packages to next status
npm run seed:routes status <STATUS> [count]  # Set specific status
npm run seed:routes reassign <hubId> [count] # Reassign packages to hub
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

## 🧪 Testing & Data Generation Workflows

### Initial Database Setup with Test Data
```bash
# 1. Run migrations
npm run prisma:migrate

# 2. Seed initial data (users, hubs, packages)
npm run prisma:seed
```

**What gets created:**
- **Users:**
  - Admin: `admin@bungiehub.com` / `Admin123!`
  - Hub Hosts: `john.doe@example.com` / `Password123!`
  - Customers: `customer1@example.com` / `Password123!`
- **Hubs:** 4 hubs (3 active, 1 pending)
- **Packages:** 3 initial test packages
- **Other:** Reviews, metrics, deliveries, batches

### Generate Large Package Datasets

**Generate packages for load testing:**
```bash
# Generate 50 packages (default)
npm run seed:packages

# Generate 100 packages
npm run seed:packages 100

# Generate 500 packages for stress testing
npm run seed:packages 500
```

**Package data includes:**
- Unique tracking numbers: `TRK-20251115-000001`
- Random barcodes: `BC0001234567`
- Realistic SF addresses with coordinates
- Random senders (Amazon, eBay, Walmart, etc.)
- Random recipients
- Random statuses distributed across delivery pipeline
- Automatic hub assignment (distributed evenly)
- Random weights (0.5-10 kg) and dimensions
- Expected delivery dates (1-5 days out)

### Simulate Package Routing & Delivery

**List packages:**
```bash
npm run seed:routes list
```
Shows all packages with status and hub assignments

**Progress packages through delivery stages:**
```bash
# Move 10 packages forward (default)
npm run seed:routes progress

# Move 50 packages forward
npm run seed:routes progress 50
```
Progression: PENDING → IN_TRANSIT → AT_HUB → OUT_FOR_DELIVERY → DELIVERED

**Set specific status:**
```bash
# Mark 20 packages as delivered
npm run seed:routes status DELIVERED 20

# Set 10 packages to AT_HUB
npm run seed:routes status AT_HUB 10

# Mark 5 packages as OUT_FOR_DELIVERY
npm run seed:routes status OUT_FOR_DELIVERY 5
```

Valid statuses: `PENDING`, `IN_TRANSIT`, `AT_HUB`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RETURNED`

**Reassign packages to different hub:**
```bash
# List available hubs with IDs
npm run seed:routes reassign

# Reassign 20 packages to specific hub
npm run seed:routes reassign <hub-id> 20
```

### Complete Testing Workflow Example

```bash
# 1. Start fresh
npm run prisma:seed

# 2. Generate 200 test packages
npm run seed:packages 200

# 3. View initial distribution
npm run seed:routes list

# 4. Simulate delivery progress
npm run seed:routes progress 50

# 5. Mark some as delivered
npm run seed:routes status DELIVERED 30

# 6. Reassign packages for load balancing test
npm run seed:routes reassign <hub-id> 25

# 7. Check final status
npm run seed:routes list

# 8. Test in browser
# Visit: http://localhost:8080/packages
# Login as: john.doe@example.com / Password123!
```

### Testing Different User Roles

**As Hub Host (john.doe@example.com):**
```bash
# 1. Login at http://localhost:8080/login
# 2. View dashboard: http://localhost:8080/dashboard
# 3. See assigned hubs and packages
# 4. Click hubs to view details
# 5. View packages: http://localhost:8080/packages
```

**As Admin (admin@bungiehub.com):**
```bash
# 1. Login at http://localhost:8080/login
# 2. View admin dashboard: http://localhost:8080/admin
# 3. See system-wide statistics
# 4. Review pending hub applications
```

**As Customer (customer1@example.com):**
```bash
# 1. Login at http://localhost:8080/login
# 2. View dashboard: http://localhost:8080/dashboard
# 3. Track packages
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

### Packages not showing in UI
```bash
# 1. Hard refresh browser
# Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Firefox: Ctrl+F5 or Cmd+Shift+R

# 2. Check API is returning data
curl http://localhost:8080/api/v1/packages

# 3. Check if packages exist in database
npm run prisma:studio
# Navigate to Package table
```

### Seed scripts fail
```bash
# "No active hubs found"
# Run main seed first:
npm run prisma:seed

# Then generate packages:
npm run seed:packages 100

# Permission errors
chmod +x ./dev.sh ./build.sh ./setup.sh ./start.sh
```

### Want to reset all data
```bash
# WARNING: This deletes all data!
npm run prisma:seed
# This clears and reseeds users, hubs, packages, etc.
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
4. **Use `npx prisma studio`** - Visual database browser for data inspection
5. **Check logs** - Server outputs helpful error messages
6. **Generate test data early** - Run `npm run seed:packages 100` for realistic testing
7. **Simulate delivery flow** - Use `npm run seed:routes progress` to test different package states
8. **Test with different users** - Login as admin, hub host, and customer to see all features
9. **Hard refresh browser** - Use Ctrl+Shift+R after rebuilding web to clear cache
10. **Use Prisma Studio** - Quick way to verify data changes from seed scripts

---

## 🆘 Getting Help

- Check logs for error messages
- Ensure all dependencies are installed
- Verify .env configuration
- See **TESTING.md** for detailed package testing and data generation
- See **ARCHITECTURE_GUIDE.md** for mode details
- See **README.md** for project overview
- Use **Prisma Studio** (`npx prisma studio`) to inspect database
- Check **API docs** at http://localhost:8080/api-docs
