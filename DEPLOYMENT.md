# Deployment Guide - Coolify

## Architecture

```
Coolify
├── PocketBase Service
│   ├── Image: ghcr.io/pocketbase/pocketbase:latest
│   ├── Port: 8090
│   └── Access: http://your-coolify-host:8090/_/ (Admin UI)
│
└── PCD App Service
    ├── Built from Dockerfile
    ├── Port: 8022
    └── Build Arg: VITE_POCKETBASE_URL
```

## Deployment Steps

### Step 1: Deploy PocketBase

In Coolify, create a new **Dockerfile** service:

**Service Configuration:**
```
Name: pocketbase
Image: ghcr.io/pocketbase/pocketbase:latest
Port: 8090
Environment Variables (dev only):
  - PB_ENCRYPTION_ENV=off
```

**GitHub Container Registry Setup:**
1. Go to Coolify → Settings → Container Registry
2. Add GitHub Container Registry:
   - Registry: `ghcr.io`
   - Username: Your GitHub username
   - Token: GitHub Personal Access Token (with `read:packages` scope)
3. To create a token:
   - GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Generate new token
   - Scope: `read:packages`

4. Deploy service

After deployment, PocketBase Admin UI will be available at:
```
http://your-coolify-host:8090/_/
```

### Step 2: Deploy PCD App

In Coolify, update your existing PCD app service:

**Build Args:**
```
VITE_POCKETBASE_URL=http://your-pocketbase-host:8090
```

Replace `pocketbase:8090` with the actual service name or external URL from Coolify.

### Step 3: Create Collections in PocketBase

Once PocketBase is running, access the Admin UI at `http://your-host:8090/_/`:

**Auth Collection:**
- Collection: `users` (auto-created by PocketBase)
- Fields to add: `role` (select: admin, user)

**Data Collections:**
Create these collections manually following the schema:

1. `categories` - Training categories
2. `trainings` - Training events
3. `training_attachments` - Training file attachments
4. `registrations` - User registrations
5. `resources` - Tools and guidelines
6. `training_updates` - Activity feed
7. `page_content` - CMS pages
8. `page_versions` - Page version history

Optional: You can also create collections + seed mock data via script (see below).

### Step 4: Create Admin User

1. Sign up via PCD app at `/signin`
2. Access PocketBase Admin UI at `http://your-host:8090/_/`
3. Navigate to `users` collection
4. Find your user and set `role` to `admin`

## Optional: Create Collections and Seed Mock Data via Script

The repository includes a one-time setup script that:
- Creates required collections (if missing)
- Adds the `role` field to the `users` collection
- Seeds data from `src/data/mockData.ts` (converted into `scripts/pocketbase/seedData.mjs`)

Run locally (do not run in production without reviewing data first):

```bash
export POCKETBASE_URL="https://pocketbase.myapps.mylabs.click"
export POCKETBASE_ADMIN_EMAIL="your-admin-email"
export POCKETBASE_ADMIN_PASSWORD="your-admin-password"

node scripts/pocketbase/setup.mjs
```

Notes:
- This script **does not delete** existing data.
- If collections already contain data, it will skip seeding those collections.
- `src/data/mockData.ts` remains untouched as a backup.

## Local Development

To run locally without Coolify:

Since PocketBase is deployed separately, you can use a simplified docker-compose:

```bash
# 1. Start PCD app only (for local testing)
docker-compose up pcd-app
```

The app will try to connect to PocketBase at `http://pocketbase:8090`.

**Note:** If you want to run PocketBase locally too, you can add it back to docker-compose.yml.

## Troubleshooting

### "Pull access denied" for PocketBase

**Cause:** GitHub Container Registry not configured in Coolify

**Solution:**
1. Go to Coolify → Settings → Container Registry
2. Add GitHub Container Registry with credentials
3. Redeploy PocketBase service

### App Can't Connect to PocketBase

**Cause:** Wrong `VITE_POCKETBASE_URL` or PocketBase service not accessible

**Solution:**
1. Verify PocketBase service is running on Coolify
2. Check the service URL in Coolify
3. Update `VITE_POCKETBASE_URL` to the correct URL
4. Redeploy PCD app

### Build Failures

**Cause:** Syntax errors in TypeScript code

**Solution:**
1. Run `npm run build` locally to check for errors
2. Fix any TypeScript/React errors
3. Push and redeploy
