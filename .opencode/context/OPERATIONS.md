# Operations

## Environment Variables

- `VITE_POCKETBASE_URL` (build-time): base URL for PocketBase API

## PocketBase Rules (Recommended)

Read rules (logged-in users):

```
List: @request.auth.id != ""
View: @request.auth.id != ""
```

Write rules (admins only):

```
Create/Update/Delete: @request.auth.role = "admin"
```

Registrations collection:

```
Create: @request.auth.id != ""
Update/Delete: @request.auth.role = "admin"
```

Users collection (admin-only management):

```
List: @request.auth.role = "admin"
View: @request.auth.role = "admin"
Update/Delete: @request.auth.role = "admin"
```

## Setup Script

Run `node scripts/pocketbase/setup.mjs` to:

- Create collections
- Add `users.role`
- Seed mock data

Requires PocketBase admin token or admin email/password.
