# GCP Services Cost Analysis & Optimization

## Current GCP Services in Use

### 1. **App Engine Flexible Environment** ⚠️ HIGH COST
**Status**: Currently deployed and running
**Configuration** (`app.yaml`):
- `min_num_instances: 1` - **THIS IS THE MAIN COST DRIVER**
- 1 CPU, 2GB RAM, 10GB disk
- Auto-scaling: 1-10 instances

**Cost Estimate**:
- **Minimum cost**: ~$50-100/month (even with zero traffic)
- App Engine Flexible charges for:
  - VM instance running 24/7 (even when idle)
  - CPU time
  - Memory allocation
  - Disk storage
  - Network egress

**Why it's expensive with no usage**:
- `min_num_instances: 1` keeps a VM running continuously
- Flexible environment uses full VMs (not serverless)
- Charges apply even when handling zero requests

**Recommendation**: 
- ✅ **Switch to Cloud Run** (serverless, pay-per-request)
- ✅ Or set `min_num_instances: 0` (but Flexible doesn't support this)
- ✅ **Best option**: Migrate to Cloud Run for true serverless

---

### 2. **Google Cloud Storage** 💰 LOW COST (if unused)
**Status**: Code exists but may not be actively used
**Location**: `src/modules/upload/upload.service.ts`

**Cost Estimate**:
- Storage: $0.020/GB/month (first 5GB free)
- Operations: $0.05 per 10,000 Class A operations
- Network egress: $0.12/GB (first 1GB free/month)

**Current Usage**: Unknown - check bucket usage in GCP Console

**Recommendation**:
- ✅ Check if bucket exists and has data
- ✅ If unused, delete the bucket
- ✅ If used minimally, consider lifecycle policies to move to Nearline/Coldline

---

### 3. **Cloud Build** ✅ NO COST (unless building)
**Status**: Enabled but only charges when building
**Cost**: $0.003/build-minute (first 120 build-minutes/day free)

**Recommendation**: Keep enabled (no cost when not building)

---

### 4. **Secret Manager** ✅ LOW COST
**Status**: Enabled
**Cost**: $0.06 per secret version/month (first 6 versions free)

**Recommendation**: Keep enabled (minimal cost)

---

### 5. **Cloud Run API** ⚠️ NOT USED
**Status**: Enabled but not deployed
**Cost**: No cost for enabling API

**Recommendation**: Can disable if not using Cloud Run

---

### 6. **Cloud Memorystore (Redis)** ❌ NOT USED
**Status**: API enabled but **NOT actually used in code**
**Evidence**: 
- `ioredis` package installed but no actual Redis client initialization found
- Rate limiting uses in-memory store (see `src/common/guards/rate-limit.guard.ts`)
- Only mentioned in comments: `// In-memory store for rate limiting (production should use Redis)`

**Cost**: Would be ~$30-50/month if provisioned (but it's NOT)

**Recommendation**: 
- ✅ **Disable `redis.googleapis.com` API** (saves no money but cleans up)
- ✅ Remove `ioredis` from package.json if not planning to use soon

---

## Cost Breakdown Summary

### Current Monthly Costs (Estimated)

| Service | Status | Monthly Cost | Notes |
|---------|--------|--------------|-------|
| **App Engine Flexible** | ✅ Active | **$50-100** | Main cost - VM running 24/7 |
| Cloud Storage | ⚠️ Unknown | $0-5 | Depends on usage |
| Cloud Build | ✅ Enabled | $0 | Free tier covers most usage |
| Secret Manager | ✅ Enabled | $0 | Free tier sufficient |
| **Total** | | **$50-105/month** | **Even with zero traffic** |

---

## Optimization Recommendations

### 🎯 Priority 1: Migrate to Cloud Run (Save ~$40-90/month)

**Why Cloud Run is better**:
- ✅ True serverless - scales to zero
- ✅ Pay only for requests (no idle costs)
- ✅ Same Docker container works
- ✅ Auto-scaling built-in
- ✅ Estimated cost: $5-15/month with low traffic

**Migration Steps**:
1. Create `cloud-run.yaml` configuration
2. Deploy to Cloud Run instead of App Engine
3. Update DNS/routing if needed
4. Delete App Engine service

**Cost Savings**: ~$40-90/month

---

### 🎯 Priority 2: Review Cloud Storage Usage

**Actions**:
1. Check GCP Console → Cloud Storage → Buckets
2. List all buckets and their sizes
3. Delete unused buckets
4. If using storage, implement lifecycle policies

**Potential Savings**: $0-5/month

---

### 🎯 Priority 3: Clean Up Unused APIs

**APIs to Disable** (if not using):
- `redis.googleapis.com` - Not used (Redis not implemented)
- `run.googleapis.com` - Only if not migrating to Cloud Run

**Cost Savings**: $0 (but cleaner setup)

---

### 🎯 Priority 4: Remove Unused Dependencies

**Package to Remove**:
- `ioredis` - Not actually used in code

**Action**: Remove from `package.json` and run `npm install`

---

## Immediate Actions to Reduce Costs

### Option A: Quick Fix (Keep App Engine)
1. **Reduce resources** in `app.yaml`:
   ```yaml
   resources:
     cpu: 0.5  # Reduce from 1
     memory_gb: 1  # Reduce from 2
   ```
   **Savings**: ~$20-30/month

2. **Check Cloud Storage** and delete unused buckets

**Total Savings**: ~$20-35/month

---

### Option B: Best Solution (Migrate to Cloud Run)
1. Deploy to Cloud Run (serverless)
2. Scales to zero when not in use
3. Pay only for actual requests

**Total Savings**: ~$40-90/month
**New Estimated Cost**: $5-15/month with low/no traffic

---

## Cost Monitoring

### Check Current Costs:
```bash
# View billing dashboard
gcloud billing accounts list
gcloud billing projects list

# Check App Engine usage
gcloud app instances list

# Check Cloud Storage usage
gsutil du -sh gs://*
```

### Set Up Budget Alerts:
1. Go to GCP Console → Billing → Budgets & alerts
2. Create budget with alerts at $25, $50, $75
3. Get email notifications

---

## Migration to Cloud Run

If you want to migrate to Cloud Run, here's what needs to be done:

1. **Create Cloud Run service configuration**
2. **Update deployment script**
3. **Deploy and test**
4. **Delete App Engine service**

Would you like me to help with the Cloud Run migration? This would significantly reduce your costs.

---

## Summary

**Current Issue**: App Engine Flexible with `min_num_instances: 1` keeps a VM running 24/7, costing $50-100/month even with zero traffic.

**Best Solution**: Migrate to Cloud Run for true serverless deployment (saves ~$40-90/month).

**Quick Win**: Reduce App Engine resources (saves ~$20-30/month).

**Other Services**: Cloud Storage, Cloud Build, Secret Manager are minimal cost. Redis API is enabled but not used.

---

## ✅ Changes Applied

### 1. Optimized `app.yaml`
- ✅ Reduced CPU: 1 → 0.5 (saves ~$15-20/month)
- ✅ Reduced Memory: 2GB → 1GB (saves ~$10-15/month)
- **Total savings**: ~$25-35/month

### 2. Created Cloud Run Configuration
- ✅ Created `cloud-run.yaml` - Cloud Run service configuration
- ✅ Created `deploy-cloud-run.sh` - Deployment script for Cloud Run
- **Benefits**: Scales to zero, pay-per-request, estimated $5-15/month

### Next Steps:
1. **To use optimized App Engine**: Deploy with `./deploy.sh` (uses optimized resources)
2. **To migrate to Cloud Run** (recommended): Run `./deploy-cloud-run.sh` (better cost savings)

