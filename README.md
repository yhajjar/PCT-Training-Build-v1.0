# PCD Training App

Small internal events/training management app with shared calendar and role-based access.

## Overview

- Frontend: React + Vite + TypeScript
- Backend: PocketBase (self-hosted)
- Auth: PocketBase (email/password), role-based access via `users.role`
- Storage: PocketBase file fields (hero image)

## Architecture

```
Browser
  -> PCD App (static SPA)
      -> PocketBase API (auth + data + files)
```

## Key Collections (PocketBase)

- `categories`
- `trainings`
- `training_attachments`
- `registrations`
- `resources`
- `training_updates` (audit log)
- `learning_platforms`
- `page_content`
- `page_versions`
- `users` (auth) with `role` field

## Roles

- `admin`: create/update/delete
- `user`: read-only (and registration create)

## Local Development

1) Install dependencies
```
npm ci
```

2) Start dev server
```
npm run dev
```

3) Set API URL (build-time for production, runtime for dev)
```
VITE_POCKETBASE_URL=https://pocketbase.myapps.mylabs.click
```

## Deployment (Coolify)

See `DEPLOYMENT.md` for end-to-end instructions.

## Seed Data (Mock Data -> PocketBase)

This repo includes a one-time setup script:

```
node scripts/pocketbase/setup.mjs
```

It creates collections, adds `users.role`, and seeds data from `src/data/mockData.ts`.
See `DEPLOYMENT.md` for details.

## SSO Plan (High-Level)

PocketBase supports OIDC/OAuth. For SAML, use an IdP bridge (Authentik/Keycloak/Entra):

```
SAML IdP -> Authentik/Keycloak -> OIDC -> PocketBase
```

Detailed plan is documented in `.opencode/context/ARCHITECTURE.md`.

## Repo Map

- `src/` app code
- `scripts/pocketbase/` setup + seeding
- `DEPLOYMENT.md` Coolify/static hosting instructions
- `.opencode/` LLM-friendly architecture context
