# Getting Started with Bungie Hub Development

This guide will help you set up your development environment and start contributing to the Bungie Hub project.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** v18+ LTS ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Accounts Needed
- **GitHub** account (for version control)
- **Google Cloud Platform** account ([Sign up](https://cloud.google.com/))
- **Neon** account ([Sign up](https://neon.tech/))
- **Firebase** account (optional, for auth/messaging)

---

## Step 1: Clone the Repository

```bash
# Clone the repo
git clone https://github.com/foolzz/bungeehub.git

# Navigate to project directory
cd bungeehub

# Checkout develop branch (or create feature branch)
git checkout develop
```

---

## Step 2: Set Up Google Cloud Platform (GCP)

### Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it `bungeehub` (or your preference)
4. Note your **Project ID** (e.g., `bungeehub-12345`)

### Enable Required APIs

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  redis.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### Create a Service Account

```bash
# Create service account
gcloud iam service-accounts create bungeehub-api \
  --display-name="Bungie Hub API Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:bungeehub-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create ./gcp-key.json \
  --iam-account=bungeehub-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Create Cloud Storage Bucket

```bash
# Create bucket for media storage
gsutil mb -p YOUR_PROJECT_ID -l us-central1 gs://bungeehub-media

# Set bucket permissions (adjust as needed)
gsutil iam ch allUsers:objectViewer gs://bungeehub-media
```

---

## Step 3: Set Up Neon Database

### Create Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Name it `bungeehub`
4. Select region (preferably same as GCP region)
5. Copy the **Connection String** (looks like: `postgresql://user:password@host/dbname`)

### Create Branches (Optional)

```bash
# Neon allows database branching for dev/staging/prod
# Create development branch via Neon Console
```

---

## Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

Update the following in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# GCP
GCP_PROJECT_ID=your-actual-project-id
GCS_BUCKET_NAME=bungeehub-media

# JWT (generate strong random strings)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

---

## Step 5: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Or using yarn
yarn install
```

---

## Step 6: Initialize Database

### Option A: Using Prisma (Recommended)

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with test data
npx prisma db seed
```

### Option B: Using Raw SQL

```bash
# If using raw SQL migrations
npm run migrate
```

---

## Step 7: Run Development Server

```bash
# Start development server
npm run dev

# Server should start on http://localhost:8080
```

You should see output similar to:
```
🚀 Server running on http://localhost:8080
✅ Connected to Neon database
✅ GCP Storage initialized
📚 API Docs available at http://localhost:8080/api-docs
```

---

## Step 8: Verify Setup

### Test Database Connection

```bash
# Check database connection
npm run db:check

# Or query directly
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

### Test API Endpoints

```bash
# Using curl
curl http://localhost:8080/api/v1/health

# Or use Postman/Insomnia
# Import the OpenAPI spec from /api-docs
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## Project Structure

Once set up, your project should look like this:

```
bungeehub/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Express/Fastify middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── index.ts         # Main entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                # Additional documentation
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
├── package.json
└── tsconfig.json        # TypeScript configuration
```

---

## Common Development Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Database Operations

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking (TypeScript)
npm run type-check
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

---

## Git Workflow

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat(scope): description of changes"

# Push to remote
git push -u origin feature/your-feature-name

# Create Pull Request on GitHub
```

See [GITFLOW.md](./GITFLOW.md) for complete workflow.

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection string
npx prisma db pull

# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Verify Neon database is active (not paused)
```

### GCP Authentication Issues

```bash
# Re-authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Verify service account key path
ls -l gcp-key.json
```

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3000
```

### Node Module Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Run tests | `npm test` |
| Build project | `npm run build` |
| Lint code | `npm run lint` |
| Format code | `npm run format` |
| Database studio | `npx prisma studio` |
| Create migration | `npx prisma migrate dev` |
| Generate types | `npx prisma generate` |
| View API docs | Open `http://localhost:8080/api-docs` |

---

## IDE Setup

### VS Code Extensions (Recommended)

- **Prisma** (Prisma.prisma)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **TypeScript** (built-in)
- **REST Client** (humao.rest-client)
- **GitLens** (eamodio.gitlens)

### VS Code Settings

Create `.vscode/settings.json` (already in .gitignore):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Next Steps

1. ✅ Read [REQUIREMENTS.md](./REQUIREMENTS.md) to understand the project
2. ✅ Review [TECH_STACK.md](./TECH_STACK.md) for architecture details
3. ✅ Check [PROJECT_PLAN.md](./PROJECT_PLAN.md) for current phase
4. ✅ Look at open issues on GitHub
5. ✅ Join team communication channel (Slack/Discord)
6. ✅ Start with a small task or bug fix

---

## Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: Search existing issues on GitHub
- **Questions**: Ask in team chat or create a GitHub discussion
- **Code Review**: Tag team members in your PR

---

## Development Best Practices

1. ✅ **Always branch from `develop`**
2. ✅ **Write tests for new features**
3. ✅ **Follow commit message conventions**
4. ✅ **Keep PRs small and focused**
5. ✅ **Update documentation when needed**
6. ✅ **Run tests before pushing**
7. ✅ **Never commit secrets or credentials**

---

**Welcome to the Bungie Hub team! Happy coding! 🚀**
