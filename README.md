# PCT Training Hub

Internal training and event management app with SSO, a PocketBase backend, and a React SPA frontend.

## Overview

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: PocketBase (self-hosted)
- Auth: SSO via `/whoami` with role-based access (`users.role`)
- Optional fallback auth: PocketBase email/password for admin login
- Storage: PocketBase file fields (hero images, attachments, resource files)

## Features

- Home dashboard with featured and recommended trainings
- Calendar views (day/week/month/year)
- Training detail view with registration or external enrollment
- Tools & Guidelines page for shared resources
- Support page rendered from a visual page builder
- Admin portal for managing trainings, categories, enrollments, resources, and roles

## Architecture

```
Browser
  -> Training Hub SPA (static)
      -> PocketBase API (auth + data + files)
      -> /whoami (SSO identity + role provisioning)
```

For SSO and server-side details (Apache + mod_auth_mellon + PocketBase), see `docs/INFRA.md`.

## Auth and Access

- Default flow: SSO `GET /whoami` returns `{ id, email, name, role, roles[] }` and the app uses `role` for access.
- Admin pages are gated by `role === "admin"`.
- Optional admin login page at `/admin-login` uses PocketBase user auth.
  - Enabled only when `VITE_ENABLE_ADMIN_LOGIN=true`.

## Routes

- `/` Home
- `/calendar` Calendar views
- `/tools` Tools & Guidelines
- `/support` Support page (page builder content)
- `/training/:id` Training details
- `/admin` Admin portal
- `/admin/training/new` Create training
- `/admin/training/:id/edit` Edit training
- `/admin-login` Local admin login (optional)

## PocketBase Collections

Created and seeded by `scripts/pocketbase/setup.mjs`:

- `categories`
- `trainings`
- `training_attachments`
- `registrations`
- `resources`
- `training_updates`
- `learning_platforms`
- `page_content`
- `page_versions`
- `users` (auth collection with custom `role` field)

## Environment Variables

Frontend (Vite):

- `VITE_API_BASE_URL` (preferred) or `VITE_PB_API_URL` or `VITE_POCKETBASE_URL`
  - Base URL for PocketBase API (e.g., `https://training-hub.example.com` or `https://.../api` if proxied).
- `VITE_WHOAMI_URL` (default: `/whoami`)
- `VITE_SSO_LOGOUT_URL` (default: `/mellon/logout`)
- `VITE_ENABLE_ADMIN_LOGIN` (default: `false`)

Seeder script (`scripts/pocketbase/setup.mjs`):

- `POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD`
- or `POCKETBASE_ADMIN_TOKEN`

## Local Development

1. Install dependencies

```
npm ci
```

2. Start dev server

```
npm run dev
```

3. Set environment variables (example)

```
VITE_API_BASE_URL=http://127.0.0.1:8090
VITE_WHOAMI_URL=/whoami
VITE_SSO_LOGOUT_URL=/mellon/logout
VITE_ENABLE_ADMIN_LOGIN=false
```

## Seed Data and Schema Setup

Run once to create collections, role field, and seed data:

```
POCKETBASE_URL=http://127.0.0.1:8090 \
POCKETBASE_ADMIN_EMAIL=admin@example.com \
POCKETBASE_ADMIN_PASSWORD=secret \
node scripts/pocketbase/setup.mjs
```

You can use `POCKETBASE_ADMIN_TOKEN` instead of email/password.

## Deployment

- App deployment: `DEPLOYMENT.md`
- SSO and infra requirements: `docs/INFRA.md`

## Admin Guide

See `docs/ADMIN_GUIDE.md` for detailed admin workflows.

## Repo Map

- `src/` app code
- `scripts/pocketbase/` schema + seeding
- `docs/` infrastructure and admin guides
- `DEPLOYMENT.md` deployment steps
