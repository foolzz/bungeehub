# BungeeHub - GCP App Engine Deployment Guide

This guide will walk you through deploying your BungeeHub application to Google Cloud Platform (GCP) App Engine.

## Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com
2. **GCP Project**: Create a new project in the GCP Console
3. **Billing**: Enable billing for your project
4. **gcloud CLI**: Install from https://cloud.google.com/sdk/docs/install

## Initial Setup

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Login to your Google account
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

### 2. Enable Required APIs

```bash
# Enable App Engine API
gcloud services enable appengine.googleapis.com

# Enable Cloud Build API (for building Docker images)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com
```

### 3. Create App Engine Application

```bash
# Create an App Engine application (only needed once)
gcloud app create --region=us-central
```

**Note**: Choose a region close to your users. Once created, you cannot change the region.

## Environment Variables Configuration

### Option 1: Using app.yaml (Simple)

Edit `app.yaml` and add your production environment variables:

```yaml
env_variables:
  DATABASE_URL: "your-production-database-url"
  JWT_SECRET: "your-production-jwt-secret"
  JWT_REFRESH_SECRET: "your-production-refresh-secret"
  CORS_ORIGIN: "https://your-domain.com"
  # Add other variables...
```

**Warning**: Don't commit sensitive data to git. Use Secret Manager instead for production.

### Option 2: Using GCP Secret Manager (Recommended)

1. **Create Secrets**:
```bash
# Create DATABASE_URL secret
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-

# Create JWT_SECRET secret
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-

# Grant App Engine access to secrets
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member=serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

2. **Update app.yaml to use secrets**:
```yaml
env_variables:
  # Other non-sensitive variables...

# Reference secrets
beta_settings:
  cloud_sql_instances: YOUR_PROJECT_ID:REGION:INSTANCE_NAME

# Use Secret Manager
# Note: Requires additional configuration
```

### Option 3: Set During Deployment

The `deploy.sh` script will prompt you to set environment variables during deployment.

## Database Setup

Your application uses Neon PostgreSQL. Make sure:

1. Your Neon database is accessible from GCP
2. Connection string is properly formatted
3. Database URL includes SSL mode: `?sslmode=require`

```bash
# Example DATABASE_URL format:
postgresql://user:password@host/database?sslmode=require&channel_binding=require
```

## Deployment

### Quick Deploy

```bash
# Run the deployment script
./deploy.sh
```

The script will:
- Check gcloud configuration
- Verify project settings
- Optionally set environment variables
- Deploy to App Engine
- Show deployment status and URLs

### Manual Deploy

```bash
# Deploy to App Engine
gcloud app deploy

# Deploy with specific version
gcloud app deploy --version=v1

# Deploy without promoting (for testing)
gcloud app deploy --no-promote

# Deploy with environment variables
gcloud app deploy --set-env-vars="DATABASE_URL=your-url"
```

## Post-Deployment

### Verify Deployment

1. **Check Health Endpoint**:
```bash
curl https://YOUR_PROJECT_ID.appspot.com/api/v1/health
```

2. **View Logs**:
```bash
# Tail logs in real-time
gcloud app logs tail -s default

# View recent logs
gcloud app logs read -s default --limit=50
```

3. **Open in Browser**:
```bash
gcloud app browse
```

### Test Endpoints

```bash
# Test API
curl https://YOUR_PROJECT_ID.appspot.com/api/v1/health

# Test Web Frontend
curl https://YOUR_PROJECT_ID.appspot.com/

# View API Documentation
open https://YOUR_PROJECT_ID.appspot.com/api-docs
```

## Monitoring and Management

### View Application Details

```bash
# Describe app
gcloud app describe

# List versions
gcloud app versions list

# List services
gcloud app services list
```

### Manage Traffic

```bash
# Split traffic between versions
gcloud app services set-traffic default --splits=v1=50,v2=50

# Migrate all traffic to a version
gcloud app versions migrate v2
```

### Scaling

Edit `app.yaml` to adjust scaling:

```yaml
automatic_scaling:
  min_num_instances: 1
  max_num_instances: 10
  cpu_utilization:
    target_utilization: 0.6
```

### Resource Allocation

Adjust resources in `app.yaml`:

```yaml
resources:
  cpu: 2        # 1, 2, 4, etc.
  memory_gb: 4  # 0.5, 1, 2, 4, etc.
  disk_size_gb: 10
```

## Cost Optimization

1. **Set minimum instances to 0** for development:
```yaml
automatic_scaling:
  min_num_instances: 0  # Scale to zero when idle
```

2. **Use smaller instances** for testing:
```yaml
resources:
  cpu: 1
  memory_gb: 1
```

3. **Monitor costs**:
```bash
# View billing
gcloud billing accounts list
```

## Troubleshooting

### Common Issues

1. **Build Fails**:
```bash
# Check build logs
gcloud app logs read --service=default --limit=100
```

2. **Database Connection Fails**:
- Verify DATABASE_URL is set correctly
- Check Neon database allows connections from GCP IPs
- Ensure SSL mode is enabled

3. **Application Crashes**:
```bash
# View error logs
gcloud app logs tail -s default --level=error
```

4. **Port Issues**:
- App Engine Flexible uses port 8080 by default
- Ensure your application listens on the PORT environment variable

### Debug Mode

Enable debug logging in `app.yaml`:

```yaml
env_variables:
  LOG_LEVEL: "debug"
```

## Rollback

If deployment fails:

```bash
# List versions
gcloud app versions list

# Rollback to previous version
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=100

# Delete bad version
gcloud app versions delete BAD_VERSION
```

## Custom Domain

### Add Custom Domain

```bash
# Add domain
gcloud app domain-mappings create www.yourdomain.com

# List domains
gcloud app domain-mappings list

# View SSL certificate status
gcloud app domain-mappings describe www.yourdomain.com
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP App Engine

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}

      - name: Deploy to App Engine
        run: gcloud app deploy --quiet
```

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable HTTPS only** (App Engine does this by default)
3. **Set CORS policies** properly in `app.yaml`
4. **Rotate secrets** regularly
5. **Enable Cloud Armor** for DDoS protection
6. **Set up VPC** for enhanced security

## Support and Resources

- **GCP Documentation**: https://cloud.google.com/appengine/docs
- **App Engine Pricing**: https://cloud.google.com/appengine/pricing
- **GCP Console**: https://console.cloud.google.com
- **Stack Overflow**: Tag questions with `google-app-engine`

## Summary of Commands

```bash
# First time setup
gcloud init
gcloud app create --region=us-central
gcloud services enable appengine.googleapis.com cloudbuild.googleapis.com

# Deploy
./deploy.sh
# or
gcloud app deploy

# Monitor
gcloud app logs tail -s default
gcloud app browse

# Manage
gcloud app versions list
gcloud app services list
```

---

**Need Help?** Check the GCP documentation or run `gcloud app --help` for more commands.
