-- ==============================================
-- Security Fix: Replace permissive RLS policies with proper admin-only policies
-- ==============================================

-- ==============================================
-- Categories: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all category operations" ON public.categories;

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Trainings: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all training operations" ON public.trainings;

CREATE POLICY "Admins can manage trainings"
  ON public.trainings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Training Attachments: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all attachment operations" ON public.training_attachments;

CREATE POLICY "Admins can manage attachments"
  ON public.training_attachments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Registrations: Drop permissive, add proper policies
-- ==============================================
DROP POLICY IF EXISTS "Allow all registration operations" ON public.registrations;

-- Allow anyone to register for trainings (public insert)
CREATE POLICY "Anyone can register for trainings"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

-- Admins can manage all registrations
CREATE POLICY "Admins can manage registrations"
  ON public.registrations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Resources: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all resource operations" ON public.resources;

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Training Updates: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all training update operations" ON public.training_updates;

CREATE POLICY "Admins can manage training updates"
  ON public.training_updates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Page Content: Drop permissive, add proper policies
-- ==============================================
DROP POLICY IF EXISTS "Allow all page content operations" ON public.page_content;

-- Anyone can view published pages
CREATE POLICY "Anyone can view published pages"
  ON public.page_content FOR SELECT
  USING (is_published = true);

-- Admins can manage all page content
CREATE POLICY "Admins can manage page content"
  ON public.page_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Page Versions: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all page version operations" ON public.page_versions;

CREATE POLICY "Admins can manage page versions"
  ON public.page_versions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));