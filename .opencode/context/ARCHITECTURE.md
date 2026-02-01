# Architecture

## System Overview

PCD Training App is a small internal events/training management SPA. The UI is a Vite/React app served as static files. All data/auth/storage are provided by a self-hosted PocketBase instance.

```
Browser
  -> PCD App (static SPA)
      -> PocketBase API (auth + data + files)
```

## Data Flow

- Client uses PocketBase JS SDK for CRUD and auth.
- All reads/writes go to PocketBase collections.
- Role-based access uses `users.role` with values `admin` or `user`.

## Auth Model

- Email/password auth (PocketBase)
- Admin users set `users.role = admin` in PocketBase Admin UI
- App checks `role === "admin"`

## Storage Model

- Training hero image stored in PocketBase `trainings.hero_image` (file field)
- File URL resolved via PocketBase `files.getUrl()`

## SSO Plan (High-Level)

PocketBase supports OIDC/OAuth. For SAML environments, use a bridge IdP:

```
SAML IdP -> Authentik/Keycloak/Entra -> OIDC -> PocketBase
```

Add "Sign in with SSO" button in the app and map IdP group claims to `users.role`.
