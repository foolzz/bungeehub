# Delivery Hub - Community Delivery Network

> **Airbnb meets Uber for package delivery**

Delivery Hub is a hybrid delivery network platform that enables individuals to register their homes or garages as micro-fulfillment centers (hubs), receive batch deliveries of 50-100 packages, and handle last-mile delivery to their local community.

---

## 🎯 Project Vision

Transform last-mile delivery by creating a decentralized network of community-based delivery hubs, combining:
- **Airbnb's Host Model**: Users register personal spaces as delivery sub-centers
- **Uber's Delivery Network**: Real-time tracking, proof of delivery, performance-based rankings

---

## 📚 Documentation

### Core Documents

| Document | Description |
|----------|-------------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Complete business and functional requirements |
| [TECH_STACK.md](./TECH_STACK.md) | Technical architecture, database schema, API design |
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | 12-week phased implementation roadmap |
| [test/README.md](./test/README.md) | E2E testing documentation |
| [mobile/deliveryhub-host/README.md](./mobile/deliveryhub-host/README.md) | Mobile app documentation |

---

## 🏗️ Technology Stack

### Backend (✅ Implemented)
```
Framework:  NestJS + TypeScript
Database:   Neon (Serverless PostgreSQL)
ORM:        Prisma
Auth:       JWT + Passport.js
Storage:    Google Cloud Storage
API Docs:   Swagger/OpenAPI
Testing:    Jest + Supertest (100+ E2E tests)
```

### Mobile (✅ Implemented)
```
Framework:  React Native + Expo
Language:   TypeScript
Navigation: React Navigation
Camera:     expo-camera
Scanner:    expo-barcode-scanner
Location:   expo-location
Maps:       react-native-maps
```

### Infrastructure
```
Platform:   Google Cloud Platform (GCP)
Hosting:    Cloud Run
Cache:      Redis (planned)
```

---

## ✨ Implementation Status

### ✅ Completed Features

#### Backend API (6 Phases Complete)

**Phase 0: Project Foundation**
- ✅ NestJS project setup with TypeScript
- ✅ Prisma ORM integration
- ✅ Database schema design and migrations
- ✅ Environment configuration
- ✅ Swagger API documentation

**Phase 1: Authentication & User Management**
- ✅ User registration with email/password
- ✅ JWT authentication
- ✅ Role-based access control (ADMIN, HUB_HOST, CUSTOMER)
- ✅ Password hashing with bcrypt
- ✅ Protected endpoints

**Phase 2: Hub Management** (8 endpoints)
- ✅ Create and manage delivery hubs
- ✅ Hub activation/deactivation (admin only)
- ✅ Nearby hub search by coordinates
- ✅ Hub tier system (NEW_HUB → SUPER_HUB)
- ✅ Owner validation and permissions
- ✅ Soft delete pattern

**Phase 3: Package Management** (13 endpoints)
- ✅ Package creation and tracking
- ✅ Batch delivery management
- ✅ Barcode and tracking number validation
- ✅ Package status lifecycle
- ✅ Assign packages to batches
- ✅ Hub-specific package filtering

**Phase 4: Scanning & Tracking** (4 endpoints)
- ✅ QR/barcode scanning
- ✅ Automatic status transitions
- ✅ GPS coordinate tracking
- ✅ Scan history and event logs
- ✅ Batch scanning support

**Phase 5: Proof of Delivery** (6 endpoints)
- ✅ Photo upload for delivery proof
- ✅ GPS + timestamp verification
- ✅ Recipient name capture
- ✅ Delivery notes
- ✅ Failed delivery handling
- ✅ Hub metrics updates

**Phase 6: Rankings & Leaderboard** (5 endpoints)
- ✅ Hub ranking system
- ✅ Performance-based tier calculation
- ✅ Leaderboard with sorting
- ✅ Next tier requirements
- ✅ Airbnb Super Host style tiers

**Total: 36 REST API Endpoints**

#### Mobile App (iOS/Android)

**6 Screens Implemented**:
- ✅ Login screen with hub host authentication
- ✅ Home dashboard with delivery stats
- ✅ QR/barcode scanner for packages
- ✅ Delivery details with map integration
- ✅ Proof of delivery with camera
- ✅ Route optimization with map visualization

**Key Features**:
- ✅ JWT authentication with token persistence
- ✅ Real-time package scanning
- ✅ Camera integration for POD photos
- ✅ GPS tracking for scans and deliveries
- ✅ Google Maps navigation integration
- ✅ Mock data generator (20-30 nearby packages)
- ✅ Route optimization (nearest neighbor algorithm)
- ✅ Offline-ready architecture

#### Testing

**100+ E2E Tests Covering**:
- ✅ Authentication flows
- ✅ Hub CRUD operations
- ✅ Package management
- ✅ Scanning workflows
- ✅ Delivery lifecycle
- ✅ Rankings calculation
- ✅ Error handling and edge cases

---

## 🎮 How It Works

### 1. Hub Registration
Users register their home/garage as a delivery hub through the admin portal

### 2. Mobile App Login
Hub hosts download the mobile app and login with their credentials

### 3. Batch Delivery
System delivers batches of 50-100 packages to each hub location

### 4. Package Scanning
Hub hosts scan packages using the mobile app:
- Scan when receiving batch (AT_HUB status)
- Scan when starting delivery (OUT_FOR_DELIVERY status)
- GPS coordinates automatically recorded

### 5. Route Optimization
Mobile app generates optimized delivery routes using:
- Nearest neighbor algorithm
- Distance and duration calculation
- Turn-by-turn navigation to each stop

### 6. Proof of Delivery
For each delivery, hub hosts:
- Take photo of delivered package
- Capture recipient name
- GPS coordinates auto-recorded
- Submit to backend

### 7. Performance Ranking
System automatically calculates hub tier based on:
- Total deliveries completed
- Average rating
- Success rate
- Number of reviews

**Tier Progression**:
- 🆕 NEW_HUB: < 50 deliveries
- ⭐ ACTIVE_HUB: 50+ deliveries, 4.0+ rating, 85%+ success
- 🌟 TOP_HUB: 200+ deliveries, 4.5+ rating, 90%+ success
- 💎 SUPER_HUB: 500+ deliveries, 4.8+ rating, 95%+ success

---

## 📋 API Endpoints

### Authentication
```
POST   /auth/register      # Register new user
POST   /auth/login         # Login with credentials
GET    /auth/me            # Get current user
```

### Hubs (8 endpoints)
```
POST   /hubs                    # Create hub
GET    /hubs                    # List hubs
GET    /hubs/:id                # Get hub details
PUT    /hubs/:id                # Update hub
DELETE /hubs/:id                # Delete hub
POST   /hubs/:id/activate       # Activate hub (admin)
POST   /hubs/:id/deactivate     # Deactivate hub (admin)
GET    /hubs/my-hub             # Get logged-in host's hub
GET    /hubs/nearby             # Search nearby hubs
```

### Packages (13 endpoints)
```
POST   /packages                                # Create package
GET    /packages                                # List packages
GET    /packages/:id                            # Get package
PUT    /packages/:id                            # Update package
DELETE /packages/:id                            # Delete package
GET    /packages/tracking/:trackingNumber       # Track package
GET    /packages/barcode/:barcode               # Find by barcode
POST   /packages/batches                        # Create batch
GET    /packages/batches                        # List batches
GET    /packages/batches/:id                    # Get batch
PUT    /packages/batches/:id                    # Update batch
DELETE /packages/batches/:id                    # Delete batch
POST   /packages/batches/:id/assign-packages    # Assign packages
```

### Scanning (4 endpoints)
```
POST   /scanning/package                        # Scan package
POST   /scanning/batch                          # Scan batch
GET    /scanning/package/:packageId/history     # Scan history
GET    /scanning/batch/:batchId/history         # Batch history
```

### Deliveries (6 endpoints)
```
POST   /deliveries                              # Create delivery
GET    /deliveries/:id                          # Get delivery
GET    /deliveries/package/:packageId           # Get by package
GET    /deliveries/hub/:hubId                   # Hub deliveries
PUT    /deliveries/:id                          # Update delivery
POST   /deliveries/:id/proof-of-delivery        # Submit POD
POST   /deliveries/:id/mark-failed              # Mark failed
```

### Rankings (5 endpoints)
```
GET    /rankings/leaderboard                    # Top 50 hubs
GET    /rankings/leaderboard/tier/:tier         # Filter by tier
GET    /rankings/hub/:hubId/rank                # Hub rank + requirements
POST   /rankings/hub/:hubId/update-tier         # Recalculate tier (admin)
POST   /rankings/update-all-tiers               # Update all tiers (admin)
```

**Full API Documentation**: http://localhost:3000/api (Swagger UI)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ LTS
- PostgreSQL (Neon or local)
- npm or yarn

### Backend Setup

```bash
# Clone repository
git clone https://github.com/foolzz/deliveryhub.git
cd deliveryhub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npm run prisma:seed

# Start development server
npm run start:dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

### Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- auth.e2e-spec

# Run with coverage
npm run test:e2e -- --coverage
```

### Mobile App Setup

```bash
# Navigate to mobile app
cd mobile/deliveryhub-host

# Install dependencies
npm install

# Update API URL in src/config/api.ts with your IP address
# For physical device: http://YOUR_IP:3000
# For iOS simulator: http://localhost:3000
# For Android emulator: http://10.0.2.2:3000

# Start Expo development server
npm start

# Scan QR code with Expo Go app or run on emulator
npm run ios     # iOS simulator (macOS only)
npm run android # Android emulator
```

**Mobile App Login**:
- Email: hubhost@example.com
- Password: password123

---

## 📁 Project Structure

```
deliveryhub/
├── src/                          # Backend source code
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── users/                # User management
│   │   ├── hubs/                 # Hub management
│   │   ├── packages/             # Package & batch management
│   │   ├── scanning/             # Scanning & tracking
│   │   ├── deliveries/           # Delivery & POD
│   │   └── rankings/             # Rankings & leaderboard
│   ├── common/                   # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── guards/               # Auth guards
│   │   ├── prisma/               # Prisma service
│   │   └── config/               # Configuration
│   └── main.ts                   # Application entry point
│
├── prisma/                       # Database
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed script
│
├── test/                         # E2E tests
│   ├── auth.e2e-spec.ts          # Auth tests
│   ├── hubs.e2e-spec.ts          # Hub tests
│   ├── packages.e2e-spec.ts      # Package tests
│   ├── scanning-deliveries.e2e-spec.ts
│   ├── rankings.e2e-spec.ts
│   └── README.md                 # Test documentation
│
├── mobile/deliveryhub-host/        # Mobile app
│   ├── src/
│   │   ├── screens/              # App screens
│   │   ├── navigation/           # Navigation setup
│   │   ├── services/             # API services
│   │   ├── utils/                # Utilities (mock data, routes)
│   │   └── types/                # TypeScript types
│   ├── App.tsx                   # App entry point
│   └── README.md                 # Mobile app docs
│
└── docs/                         # Documentation
```

---

## 🎯 Success Metrics

**MVP Goals**:
- ✅ 36 REST API endpoints implemented
- ✅ Full mobile app for hub hosts
- ✅ 100+ E2E tests with comprehensive coverage
- ✅ End-to-end delivery workflow
- ✅ Performance-based ranking system

**Next Steps**:
- [ ] Deploy to Cloud Run
- [ ] Set up production database
- [ ] Configure Cloud Storage
- [ ] Add WebSocket for real-time updates
- [ ] Implement Redis caching
- [ ] Add admin dashboard
- [ ] Create customer-facing app

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Mobile App (React Native)                  │
│  • Hub Host Login                                   │
│  • Package Scanning (QR/Barcode)                    │
│  • Delivery Photo Capture                           │
│  • Route Optimization & Navigation                  │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS/REST
┌────────────────▼────────────────────────────────────┐
│              NestJS Backend API                     │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │   Auth   │   Hubs   │ Packages │Rankings  │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│  ┌──────────┬──────────────────────────────────┐   │
│  │ Scanning │      Deliveries & POD            │   │
│  └──────────┴──────────────────────────────────┘   │
└────────────────┬───────────────┬────────────────────┘
                 │               │
    ┌────────────▼──────┐  ┌─────▼──────────────┐
    │  Neon PostgreSQL  │  │ Google Cloud       │
    │  (Serverless)     │  │ Storage (Images)   │
    └───────────────────┘  └────────────────────┘
```

---

## 🧪 Testing

### E2E Tests
- 100+ test cases across 5 test suites
- Full coverage of all endpoints
- Authentication, authorization, and permissions
- Business logic validation
- Error handling and edge cases

### Test Execution
```bash
npm run test:e2e              # Run all tests
npm run test:e2e -- --watch   # Watch mode
npm run test:e2e -- --verbose # Detailed output
```

See [test/README.md](./test/README.md) for complete testing documentation.

---

## 📱 Mobile App Features

### Implemented Screens
1. **Login**: Hub host authentication
2. **Home**: Dashboard with delivery stats and quick actions
3. **Scanner**: QR/barcode scanning with automatic status updates
4. **Delivery Details**: View package info, navigate to address
5. **Proof of Delivery**: Capture photo, GPS, recipient name
6. **Route Map**: Optimized route visualization and navigation

### Technical Highlights
- JWT authentication with AsyncStorage
- Real-time GPS tracking
- Camera integration for POD
- Google Maps integration
- Mock data generator for testing
- Route optimization algorithm
- Offline-capable architecture

See [mobile/deliveryhub-host/README.md](./mobile/deliveryhub-host/README.md) for setup instructions.

---

## 🤝 Contributing

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commit Convention
```
feat(scope): Add new feature
fix(scope): Fix bug
docs(scope): Update documentation
test(scope): Add or update tests
refactor(scope): Code refactoring
```

---

## 📄 License

[To be determined]

---

## 📞 Support & Contact

For questions about:
- **API Documentation**: http://localhost:3000/api (Swagger)
- **Testing**: See [test/README.md](./test/README.md)
- **Mobile App**: See [mobile/deliveryhub-host/README.md](./mobile/deliveryhub-host/README.md)
- **Requirements**: See [REQUIREMENTS.md](./REQUIREMENTS.md)
- **Architecture**: See [TECH_STACK.md](./TECH_STACK.md)

---

**Project Started**: 2025-11-14
**Current Status**: Backend & Mobile MVP Complete ✅
**Total Implementation**: 15,000+ lines of code
**Test Coverage**: 100+ E2E tests
