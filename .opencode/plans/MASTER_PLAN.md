# Master Plan

## Current State

- App migrated to PocketBase
- Collections created and seeded
- Learning Platforms read from DB with mock fallback
- Hero image upload uses PocketBase file field

## Active Tasks

- Enforce PocketBase API rules across all collections
- Verify hero image upload after file field set to correct max size

## Future Work

### SSO/SAML

PocketBase supports OIDC/OAuth. For SAML environments:

```
SAML IdP -> Authentik/Keycloak/Entra -> OIDC -> PocketBase
```

Add "Sign in with SSO" in the app and map IdP groups to `users.role`.
