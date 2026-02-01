-- ==============================================
-- Security Fix: Fix storage bucket policies
-- ==============================================

-- Drop ALL existing storage policies for our buckets (both old and potential duplicates)
DROP POLICY IF EXISTS "Admins can upload training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;

-- Recreate admin-only write policies for training-attachments
CREATE POLICY "Admins can upload training attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

-- Recreate admin-only write policies for resources
CREATE POLICY "Admins can upload resources"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));