# Database Setup for Self-Hosted Supabase

This directory contains all database migrations and initialization scripts for the PCD Training app.

## Files

| File | Purpose |
|------|---------|
| `init.sql` | Complete schema initialization (all migrations concatenated) |
| `seed.sql` | Seed data and first admin user creation |
| `migrations/*.sql` | Individual migration files (for reference) |

## Setup Instructions

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI: `npm install -g supabase`
2. Link to your self-hosted instance:
   ```bash
   supabase link --project-ref your-project-ref --db-url postgresql://postgres:password@your-host:5432/postgres
   ```
3. Push migrations:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution

1. Connect to your self-hosted Supabase Postgres instance
2. Run `init.sql` to create all tables, functions, and policies
3. Run `seed.sql` to create the first admin user (edit email/password first)

## Creating the First Admin User

After running the migrations:

1. Sign up via the app UI or Supabase Studio Auth panel
2. Note the user UUID from the `auth.users` table
3. Grant admin role:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your-user-uuid-here', 'admin');
   ```

Or use the `seed.sql` script (edit the email/password first).

## Storage Buckets

The migrations create two storage buckets:
- `training-attachments` — for event hero images and attachments
- `resources` — for downloadable resources/tools

These buckets must be configured to use MinIO as the S3 backend (see main README).
