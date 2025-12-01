# Pre-Deployment Checklist

Before running `./deploy.sh`, please complete the following:

## 1. Update app.yaml

Open `app.yaml` and replace the placeholder values:

### Required Changes:

1. **Replace `YOUR_PROJECT_ID`** with your actual GCP project ID in:
   ```yaml
   API_BASE_URL: "https://YOUR_PROJECT_ID.appspot.com/api"
   CORS_ORIGIN: "https://YOUR_PROJECT_ID.appspot.com"
   ```

2. **Update JWT Secrets** (IMPORTANT for production):
   ```yaml
   JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production"
   JWT_REFRESH_SECRET: "your-super-secret-refresh-key-change-this-in-production"
   ```

   Generate secure secrets:
   ```bash
   # Generate random secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## 2. Get Your GCP Project ID

```bash
# View current project
gcloud config get-value project

# Or list all projects
gcloud projects list
```

## 3. Quick Update Script

Use this to quickly update your app.yaml with your project ID:

```bash
# Replace YOUR_PROJECT_ID_HERE with your actual project ID
PROJECT_ID="YOUR_PROJECT_ID_HERE"

# macOS
sed -i '' "s/YOUR_PROJECT_ID/$PROJECT_ID/g" app.yaml

# Linux
sed -i "s/YOUR_PROJECT_ID/$PROJECT_ID/g" app.yaml
```

## 4. Current Configuration

Your deployment is already configured with:

- ✅ **Database**: Neon PostgreSQL (same as dev)
- ✅ **Port**: 8080
- ✅ **Node.js**: Production mode
- ✅ **Static Files**: Enabled (serves web frontend)
- ✅ **Health Checks**: Configured at `/api/v1/health`
- ✅ **Auto-scaling**: 1-10 instances

## 5. Ready to Deploy?

Once you've updated the values above:

```bash
./deploy.sh
```

## Security Notes

⚠️ **Important**: The `app.yaml` file contains your database credentials.

**Options for better security:**

1. **For now (development/testing)**: Current setup is fine
2. **For production**: Use GCP Secret Manager (see DEPLOYMENT.md)
3. **Don't commit**: Add `app.yaml` to `.gitignore` if sharing publicly

## Quick Commands Reference

```bash
# Get your project ID
gcloud config get-value project

# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test your configuration locally first
npm run build
./start.sh

# When ready, deploy
./deploy.sh
```

## After Deployment

Test these endpoints:

1. **Health Check**: `https://YOUR_PROJECT_ID.appspot.com/api/v1/health`
2. **API Docs**: `https://YOUR_PROJECT_ID.appspot.com/api-docs`
3. **Web Frontend**: `https://YOUR_PROJECT_ID.appspot.com/`

---

Need help? Check `DEPLOYMENT.md` for detailed instructions.
