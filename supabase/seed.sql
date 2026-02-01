-- ===========================================
-- Seed Data for PCD Training App
-- ===========================================
-- This script creates initial data including the first admin user.
-- 
-- IMPORTANT: Edit the email and password below before running!
-- ===========================================

-- Create first admin user
-- Note: This uses Supabase's auth.users table directly.
-- In production, users should sign up via the app UI or Supabase Studio,
-- then you grant them admin role by inserting into user_roles.

-- Method 1: If you already created a user via the app/Studio, just grant admin:
-- 
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('paste-user-uuid-here', 'admin');

-- Method 2: Create sample categories (optional)
INSERT INTO public.categories (name, color) VALUES
  ('Leadership Development', '#3b82f6'),
  ('Technical Skills', '#10b981'),
  ('Soft Skills', '#f59e0b'),
  ('Professional Development', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Method 3: Create sample resources (optional)
INSERT INTO public.resources (title, type, external_link) VALUES
  ('Employee Handbook', 'Guideline', 'https://example.com/handbook.pdf'),
  ('Training Request Form', 'Template', 'https://example.com/form-template.docx'),
  ('FAQ - Professional Development', 'FAQ', 'https://example.com/faq')
ON CONFLICT DO NOTHING;

-- ===========================================
-- To create the FIRST ADMIN USER:
-- 
-- 1. Sign up via the app at /signin (or Supabase Studio > Auth)
-- 2. Note your user UUID from auth.users table
-- 3. Run this query (replace the UUID):
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('your-user-uuid-from-step-2', 'admin');
--
-- ===========================================
