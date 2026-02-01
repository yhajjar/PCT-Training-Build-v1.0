# Patterns

## Data Access

- All data access goes through `src/lib/database.ts`.
- Use PocketBase JS SDK (`pb.collection().getList/create/update/delete`).

## Auth

- Use `src/hooks/useAuth.tsx` for auth state.
- Admin check: `pb.authStore.record?.role === "admin"`.

## Storage

- `trainings.hero_image` is a file field.
- Upload hero image via `FormData` in `createTraining`/`updateTraining`.
- Resolve file URLs using `pb.files.getUrl()`.

## Learning Platforms

- `learning_platforms` collection drives the Learning Platforms section.
- Fallback to `src/data/mockData.ts` if DB is empty.
