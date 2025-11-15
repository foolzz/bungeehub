# Database Migrations

## Current State

The Prisma schema has been updated with Airbnb-style enhancements, but the migration cannot be applied automatically because the Neon database is currently unreachable.

## How to Apply Migrations When Database is Available

### Option 1: Let Prisma Handle It (Recommended)

Once your database is accessible, run:

```bash
# This will apply all pending migrations
npx prisma migrate deploy
```

### Option 2: Manual Migration (If Option 1 Fails)

If you get errors about missing migrations, you can manually apply the SQL:

```bash
# Connect to your database and run the migration SQL
psql $DATABASE_URL -f prisma/migrations/20241115_airbnb_enhancements/migration.sql
```

### Option 3: Fresh Start

If you want to start completely fresh:

```bash
# Reset the database (WARNING: Deletes all data!)
npx prisma migrate reset --force

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run the seed script (if configured)
```

### Option 4: Push Schema Without Migrations

For development only (doesn't create migration files):

```bash
npx prisma db push
```

## Migration Details

**Migration**: `20241115_airbnb_enhancements`

**Changes Include:**
- Added 3 new enums (MessageStatus, NotificationType, NotificationCategory)
- Extended HubStatus enum with UNDER_REVIEW, APPROVED, REJECTED
- Added 20+ fields to User model (profile, address, verification, payment)
- Added 16+ fields to Hub model (property details, review workflow)
- Created HubPhoto model (property photos)
- Created Message model (in-app messaging)
- Created Notification model (multi-channel notifications)

## Troubleshooting

### Error: "Could not find the migration file"

This means Prisma's migration metadata is out of sync. Fix it by:

```bash
# Remove the problematic migration directory
rm -rf prisma/migrations/PROBLEMATIC_MIGRATION_NAME

# Then run migrate deploy or migrate dev
npx prisma migrate deploy
```

### Error: "Can't reach database server"

Your database is not accessible. Check:
1. DATABASE_URL in .env file is correct
2. Neon database is running
3. Network/firewall allows connection
4. Database credentials are valid

### Error: "Migration already applied"

If you manually applied the SQL, tell Prisma:

```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied 20241115_airbnb_enhancements
```

## Database Connection

Current database from .env:
```
ep-fragrant-forest-afgn14ks-pooler.c-2.us-west-2.aws.neon.tech
```

Make sure this database is running before applying migrations.

## Post-Migration Steps

After successfully applying migrations:

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Seed the Database** (Optional)
   ```bash
   npm run prisma:seed
   ```

3. **Verify Schema**
   ```bash
   npx prisma db pull  # Pull current schema from DB
   npx prisma validate # Validate schema file
   ```

4. **Test the API**
   ```bash
   npm run start:dev
   ```

## Need Help?

If you encounter issues:
1. Check DATABASE_URL environment variable
2. Verify database is accessible
3. Look at Prisma logs for specific errors
4. Try `npx prisma db push` for development (bypasses migrations)
