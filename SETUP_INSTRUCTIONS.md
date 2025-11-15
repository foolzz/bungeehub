# Bungie Hub - Local Setup Instructions

## ✅ What's Already Done

- ✅ Project initialized with NestJS + TypeScript + Prisma
- ✅ Database connection configured (.env file created)
- ✅ Prisma client generated
- ✅ All dependencies installed (npm install completed)

---

## 🚀 Next Steps (Run on Your MacBook Pro)

### Step 1: Activate Your Neon Database

1. Go to https://console.neon.tech/
2. Find your project: **neondb**
3. If database shows "Sleeping" or "Paused", click **"Wake up"** or **"Resume"**
4. Wait for status to show **"Active"**

### Step 2: Create Database Schema

```bash
# Make sure you're in the bungeehub directory
cd /path/to/bungeehub

# Generate Prisma client (if not already done)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Applying migration `20241115_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241115_init/
      └─ migration.sql

Your database is now in sync with your schema.
```

### Step 3: Verify Database Setup

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

This will open http://localhost:5555 where you can see all your tables:
- users
- hubs
- packages
- deliveries
- batches
- hub_metrics
- hub_reviews
- event_logs
- webhook_configs
- api_keys

### Step 4: Start Development Server

```bash
# Start the NestJS server
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 11/15/2024, 2:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/15/2024, 2:30:01 AM     LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] 12345  - 11/15/2024, 2:30:01 AM     LOG [PrismaService] ✅ Connected to Neon PostgreSQL database
...
🚀 Bungie Hub API running on: http://localhost:8080
📚 API Documentation: http://localhost:8080/api-docs
```

### Step 5: Test the API

**Option A: Browser**
- Open http://localhost:8080/api/v1/health
- Should see: `{"status":"ok","timestamp":"...","service":"Bungie Hub API","version":"0.1.0"}`

**Option B: Command Line**
```bash
curl http://localhost:8080/api/v1/health
```

**Option C: Swagger UI**
- Open http://localhost:8080/api-docs
- Browse all available endpoints

---

## 📋 Available Endpoints (Phase 0)

All endpoints currently return "Coming in Phase X" messages:

### Health Check
- `GET /api/v1/health` - ✅ **WORKING NOW**

### Authentication (Phase 1 - Coming Soon)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Users (Phase 1 - Coming Soon)
- `GET /api/v1/users/:id` - Get user by ID

### Hubs (Phase 2 - Coming Soon)
- `POST /api/v1/hubs` - Register a hub
- `GET /api/v1/hubs` - List all hubs
- `GET /api/v1/hubs/:id` - Get hub details

### Packages (Phase 3 - Coming Soon)
- `POST /api/v1/packages` - Create package
- `GET /api/v1/packages` - List packages

### Scanning (Phase 3 - Coming Soon)
- `POST /api/v1/scanning/package` - Scan a package
- `POST /api/v1/scanning/batch` - Scan a batch

### Deliveries (Phase 4 - Coming Soon)
- `POST /api/v1/deliveries` - Submit proof of delivery

### Rankings (Phase 5 - Coming Soon)
- `GET /api/v1/rankings/leaderboard` - Get hub leaderboard

---

## 🔧 Troubleshooting

### Problem: "Can't reach database server"

**Solution:**
1. Check Neon dashboard - database might be paused
2. Click "Wake up" button
3. Wait 30 seconds and try again

### Problem: "Migration failed"

**Solution:**
```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Problem: "Port 8080 already in use"

**Solution:**
```bash
# Option 1: Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Option 2: Use different port in .env
PORT=3000
```

### Problem: "Prisma client not found"

**Solution:**
```bash
npx prisma generate
```

---

## 📊 Database Schema

Your Neon database will have these tables:

**Core Tables:**
- `users` - Hub hosts, customers, admins
- `hubs` - Delivery hub locations
- `packages` - Package inventory
- `batches` - Batch deliveries to hubs
- `deliveries` - Delivery records with POD

**Metrics & Reviews:**
- `hub_metrics` - Daily performance metrics
- `hub_reviews` - Customer ratings

**System:**
- `event_logs` - Audit trail
- `webhook_configs` - Integration webhooks
- `api_keys` - Third-party API access

---

## 🎯 Success Checklist

- [ ] Neon database is active (green status)
- [ ] `npx prisma migrate dev --name init` succeeded
- [ ] Prisma Studio opens (http://localhost:5555)
- [ ] Dev server starts without errors
- [ ] Health check returns 200 OK
- [ ] Swagger docs accessible (http://localhost:8080/api-docs)

---

## 🚀 What's Next After Setup?

Once your server is running:

1. **Phase 1** - Authentication & User Management
   - Implement user registration
   - Add JWT authentication
   - Create login endpoints

2. **Phase 2** - Hub Management
   - Hub registration system
   - Hub profile management
   - Location verification

3. **Phase 3** - Package & Scanning
   - Package CRUD operations
   - Barcode scanning
   - Batch management

---

## 💡 Development Tips

**Hot Reload:**
- Server automatically restarts when you save .ts files
- No need to stop and restart manually

**Database Changes:**
- Edit `prisma/schema.prisma`
- Run `npx prisma migrate dev --name description`
- Prisma client auto-updates

**View Database:**
- Run `npx prisma studio` anytime to browse data
- Great for testing and debugging

**API Testing:**
- Use Swagger UI at http://localhost:8080/api-docs
- Or use Postman/Insomnia
- Or curl commands

---

## 📞 Need Help?

If you're stuck:
1. Check the error message carefully
2. Verify Neon database is active
3. Check .env file has correct DATABASE_URL
4. Try restarting the server

**Common Issues:**
- Database connection → Check Neon dashboard
- Port already in use → Change PORT in .env
- Module not found → Run `npm install`
- Prisma errors → Run `npx prisma generate`

---

**Status: Ready to Run! 🚀**

**Next Command:**
```bash
npx prisma migrate dev --name init
```
