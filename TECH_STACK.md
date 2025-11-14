# Bungie Hub - Technical Architecture

## Technology Stack Overview

### Backend
- **Runtime**: Node.js (v18+ LTS)
- **Framework**: TBD (Express.js / Fastify / NestJS)
- **Language**: JavaScript/TypeScript
- **Platform**: Google Cloud Platform (GCP)

### Database
- **Primary Database**: Neon (Serverless PostgreSQL)
  - Serverless, auto-scaling
  - Branching for development environments
  - Connection pooling built-in
  - Pay-per-use pricing model

### Cloud Infrastructure (GCP)
- **Compute**: Cloud Run (containerized Node.js services)
- **Storage**: Google Cloud Storage (photos, documents)
- **Cache**: Cloud Memorystore for Redis
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Auth**: Firebase Authentication / Cloud Identity Platform
- **API Gateway**: Cloud Endpoints or API Gateway
- **Monitoring**: Cloud Monitoring & Cloud Logging
- **CDN**: Cloud CDN for static assets

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Apps (iOS/Android)                 │
│                     Hub Host App + Customer App                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS/REST API
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    GCP Cloud Load Balancer                       │
│                      + Cloud Armor (WAF)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────────┐
        │             │             │                  │
┌───────▼──────┐ ┌───▼─────┐ ┌────▼──────┐ ┌─────────▼────────┐
│   Auth API   │ │ Package │ │ Delivery  │ │ Ranking/Analytics│
│  (Cloud Run) │ │   API   │ │   API     │ │      API         │
│              │ │(Cloud   │ │(Cloud Run)│ │  (Cloud Run)     │
│              │ │  Run)   │ │           │ │                  │
└──────┬───────┘ └────┬────┘ └─────┬─────┘ └────────┬─────────┘
       │              │            │                 │
       │              │            │                 │
       │     ┌────────┴────────────┴────────┬────────┘
       │     │                               │
┌──────▼─────▼────────┐              ┌──────▼──────────────┐
│  Neon PostgreSQL    │              │ Cloud Memorystore   │
│  (Serverless)       │              │    (Redis)          │
│                     │              │                     │
│ - Users             │              │ - Session cache     │
│ - Hubs              │              │ - Real-time data    │
│ - Packages          │              │ - Rate limiting     │
│ - Deliveries        │              │                     │
│ - POD Records       │              └─────────────────────┘
│ - Rankings          │
└─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               Google Cloud Storage Buckets                       │
│                                                                  │
│  - delivery-photos/         (POD images)                        │
│  - hub-profiles/            (hub photos)                        │
│  - package-labels/          (barcode/QR codes)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Supporting Services                           │
│                                                                  │
│  - Firebase Cloud Messaging (Push notifications)                │
│  - Cloud Scheduler (Cron jobs, batch processing)                │
│  - Cloud Tasks (Async job queue)                                │
│  - Cloud Pub/Sub (Event streaming)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Neon PostgreSQL)

### Core Tables

```sql
-- Users (Hub Hosts & Customers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'hub_host', 'customer', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Hub Locations
CREATE TABLE hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INT DEFAULT 100, -- max packages per batch
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'suspended'
  tier VARCHAR(20) DEFAULT 'new_hub', -- 'new_hub', 'active_hub', 'top_hub', 'super_hub'
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Packages
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  barcode VARCHAR(100),
  sender_name VARCHAR(255),
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20),
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  status VARCHAR(30) DEFAULT 'created', -- 'created', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'failed'
  assigned_hub_id UUID REFERENCES hubs(id),
  weight DECIMAL(10, 2), -- kg
  dimensions JSONB, -- {length, width, height}
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Package Batches
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES hubs(id),
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  total_packages INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'created', -- 'created', 'in_transit', 'delivered', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Records (Proof of Delivery)
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES hubs(id),
  host_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL, -- 'delivered', 'failed', 'returned'
  photo_url TEXT, -- GCS URL
  signature_url TEXT, -- optional
  delivered_at TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_notes TEXT,
  failure_reason VARCHAR(255), -- if failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hub Performance Metrics
CREATE TABLE hub_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  packages_received INT DEFAULT 0,
  packages_delivered INT DEFAULT 0,
  packages_failed INT DEFAULT 0,
  avg_delivery_time INT, -- minutes
  customer_rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hub_id, date)
);

-- Hub Reviews/Ratings
CREATE TABLE hub_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id),
  customer_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Events Log
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'package_scanned', 'delivery_completed', 'hub_registered', etc.
  entity_type VARCHAR(50), -- 'package', 'hub', 'user'
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integration Webhooks
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[], -- array of event types to subscribe to
  secret VARCHAR(255), -- for signature verification
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys for third-party integrations
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  permissions TEXT[], -- array of allowed operations
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Package tracking lookups
CREATE INDEX idx_packages_tracking ON packages(tracking_number);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_hub ON packages(assigned_hub_id);

-- Hub queries
CREATE INDEX idx_hubs_host ON hubs(host_id);
CREATE INDEX idx_hubs_status ON hubs(status);
CREATE INDEX idx_hubs_tier ON hubs(tier);

-- Delivery lookups
CREATE INDEX idx_deliveries_package ON deliveries(package_id);
CREATE INDEX idx_deliveries_hub ON deliveries(hub_id);
CREATE INDEX idx_deliveries_date ON deliveries(delivered_at);

-- Metrics queries
CREATE INDEX idx_metrics_hub_date ON hub_metrics(hub_id, date);

-- Event logs
CREATE INDEX idx_events_type ON event_logs(event_type);
CREATE INDEX idx_events_entity ON event_logs(entity_type, entity_id);
CREATE INDEX idx_events_created ON event_logs(created_at);
```

---

## API Architecture

### RESTful API Endpoints

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me
```

#### Hub Management
```
POST   /api/v1/hubs                    # Register new hub
GET    /api/v1/hubs                    # List all hubs (admin)
GET    /api/v1/hubs/:id                # Get hub details
PUT    /api/v1/hubs/:id                # Update hub info
DELETE /api/v1/hubs/:id                # Deactivate hub
GET    /api/v1/hubs/:id/metrics        # Hub performance stats
GET    /api/v1/hubs/:id/reviews        # Hub reviews
```

#### Package Management
```
POST   /api/v1/packages                # Create package
GET    /api/v1/packages                # List packages (with filters)
GET    /api/v1/packages/:id            # Get package details
PUT    /api/v1/packages/:id            # Update package
GET    /api/v1/packages/track/:tracking_number  # Track by number
```

#### Batch Operations
```
POST   /api/v1/batches                 # Create batch
GET    /api/v1/batches/:id             # Get batch details
POST   /api/v1/batches/:id/assign      # Assign batch to hub
POST   /api/v1/batches/:id/receive     # Hub confirms receipt
```

#### Scanning & Delivery
```
POST   /api/v1/scan/package/:barcode   # Scan individual package
POST   /api/v1/scan/batch/:barcode     # Scan batch
POST   /api/v1/deliveries              # Submit proof of delivery
GET    /api/v1/deliveries/:id          # Get delivery details
PUT    /api/v1/deliveries/:id/fail     # Mark delivery as failed
```

#### Media Upload
```
POST   /api/v1/upload/proof-of-delivery  # Upload POD photo
POST   /api/v1/upload/hub-photo          # Upload hub profile photo
GET    /api/v1/media/:id                 # Get signed URL for media
```

#### Rankings & Gamification
```
GET    /api/v1/rankings/hubs           # Leaderboard
GET    /api/v1/rankings/hubs/:id       # Individual hub ranking
POST   /api/v1/reviews                 # Submit review
```

#### Integration API (for B2B/Third-party)
```
POST   /api/v1/integration/packages    # Bulk import packages
POST   /api/v1/integration/webhook     # Configure webhook
GET    /api/v1/integration/status      # Batch status check
```

---

## Node.js Project Structure

```
bungeehub/
├── .env.example
├── .env
├── .gitignore
├── package.json
├── tsconfig.json (if using TypeScript)
├── Dockerfile
├── .dockerignore
├── cloudbuild.yaml (for GCP Cloud Build)
│
├── src/
│   ├── index.js                    # Main entry point
│   ├── app.js                      # Express/Fastify app setup
│   │
│   ├── config/
│   │   ├── database.js             # Neon connection config
│   │   ├── redis.js                # Redis config
│   │   ├── storage.js              # GCS config
│   │   └── firebase.js             # Firebase config
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── hubs.routes.js
│   │   ├── packages.routes.js
│   │   ├── deliveries.routes.js
│   │   ├── batches.routes.js
│   │   └── integration.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── hubs.controller.js
│   │   ├── packages.controller.js
│   │   ├── deliveries.controller.js
│   │   └── rankings.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── package.service.js
│   │   ├── delivery.service.js
│   │   ├── ranking.service.js
│   │   ├── notification.service.js
│   │   ├── storage.service.js       # GCS operations
│   │   └── webhook.service.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Hub.js
│   │   ├── Package.js
│   │   ├── Delivery.js
│   │   └── Batch.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── errorHandler.middleware.js
│   │
│   ├── utils/
│   │   ├── logger.js                # Winston logger
│   │   ├── helpers.js
│   │   └── constants.js
│   │
│   └── db/
│       ├── migrations/              # Database migrations
│       │   └── 001_initial_schema.sql
│       └── seeds/                   # Seed data
│           └── dev_data.sql
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    └── api/
        └── openapi.yaml              # API documentation
```

---

## GCP Services Configuration

### Cloud Run Services
```yaml
# Example service.yaml for Cloud Run
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bungeehub-api
spec:
  template:
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/bungeehub-api:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: neon-db-url
              key: latest
        - name: REDIS_HOST
          value: REDIS_IP
        resources:
          limits:
            memory: 512Mi
            cpu: 1000m
```

### Environment Variables
```bash
# .env.example
NODE_ENV=development
PORT=8080

# Neon Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=bungeehub-media
GCS_CREDENTIALS_PATH=/path/to/credentials.json

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CREDENTIALS=/path/to/firebase-credentials.json

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# API
API_VERSION=v1
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Deployment Strategy

### Development Environment
- Local Node.js server
- Neon development branch
- Local Redis (or Cloud Memorystore)
- GCS development bucket

### Staging Environment
- Cloud Run (staging revision)
- Neon staging branch
- Cloud Memorystore (staging instance)
- GCS staging bucket

### Production Environment
- Cloud Run (production revision with auto-scaling)
- Neon production database
- Cloud Memorystore (production instance with HA)
- GCS production bucket with CDN

### CI/CD Pipeline (Cloud Build)
```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']

  # Run tests
  - name: 'node:18'
    entrypoint: npm
    args: ['test']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/bungeehub-api:$COMMIT_SHA', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/bungeehub-api:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'bungeehub-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/bungeehub-api:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

---

## Security Considerations

1. **Authentication**: Firebase Auth with JWT tokens
2. **API Security**: API Gateway with rate limiting
3. **Data Encryption**: TLS in transit, encrypted at rest (Neon default)
4. **Secrets Management**: Google Secret Manager
5. **IAM**: Principle of least privilege for service accounts
6. **Input Validation**: Joi/Zod schema validation
7. **SQL Injection Prevention**: Parameterized queries (pg library)
8. **CORS**: Configured for mobile app origins only
9. **Audit Logging**: All critical operations logged to Cloud Logging

---

## Monitoring & Observability

- **Application Logs**: Cloud Logging
- **Metrics**: Cloud Monitoring (custom metrics for package flow)
- **Tracing**: Cloud Trace
- **Error Tracking**: Cloud Error Reporting or Sentry
- **Uptime Monitoring**: Cloud Monitoring uptime checks
- **Alerts**: Cloud Monitoring alerts for critical errors

---

## Performance Optimization

1. **Connection Pooling**: Neon built-in pooling + pg-pool
2. **Caching Strategy**:
   - Redis for frequently accessed data (hub info, rankings)
   - HTTP caching headers for media
   - Cloud CDN for static assets
3. **Database Optimization**:
   - Indexes on frequently queried columns
   - Materialized views for analytics
4. **Image Optimization**:
   - Resize images before upload
   - WebP format for mobile
   - Lazy loading with signed URLs

---

## Cost Optimization

- **Neon**: Serverless, pay-per-use (auto-pause during inactivity)
- **Cloud Run**: Auto-scaling from 0, pay only when handling requests
- **Cloud Storage**: Lifecycle policies for old POD photos (move to Nearline/Coldline)
- **Redis**: Right-size instance based on actual cache needs
- **CDN**: Cache media to reduce egress costs

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Status**: Draft
