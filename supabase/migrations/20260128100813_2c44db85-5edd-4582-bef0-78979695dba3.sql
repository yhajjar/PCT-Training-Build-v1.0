-- Add explicit SELECT policies for admins on tables they need to read
-- Registrations: Allow admins to view all registrations
CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Training Updates: Ensure admins can view all updates  
CREATE POLICY "Admins can view all training updates"
  ON public.training_updates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));