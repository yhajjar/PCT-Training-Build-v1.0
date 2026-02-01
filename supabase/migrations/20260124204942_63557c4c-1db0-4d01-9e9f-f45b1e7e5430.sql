-- Drop existing restrictive policies that require auth
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage trainings" ON public.trainings;
DROP POLICY IF EXISTS "Admins can manage attachments" ON public.training_attachments;
DROP POLICY IF EXISTS "Admins can manage training updates" ON public.training_updates;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can create own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;

-- Create new policies that allow public access (PIN protection is client-side)

-- Categories: Allow all operations
CREATE POLICY "Allow all category operations"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Trainings: Allow all operations
CREATE POLICY "Allow all training operations"
ON public.trainings
FOR ALL
USING (true)
WITH CHECK (true);

-- Training attachments: Allow all operations
CREATE POLICY "Allow all attachment operations"
ON public.training_attachments
FOR ALL
USING (true)
WITH CHECK (true);

-- Training updates: Allow all operations
CREATE POLICY "Allow all training update operations"
ON public.training_updates
FOR ALL
USING (true)
WITH CHECK (true);

-- Resources: Allow all operations
CREATE POLICY "Allow all resource operations"
ON public.resources
FOR ALL
USING (true)
WITH CHECK (true);

-- Registrations: Allow all operations (public registration + admin management)
CREATE POLICY "Allow all registration operations"
ON public.registrations
FOR ALL
USING (true)
WITH CHECK (true);