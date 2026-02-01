-- Create storage bucket for training attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-attachments', 
  'training-attachments', 
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Policy: Anyone can view attachments (public bucket)
CREATE POLICY "Anyone can view training attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-attachments');

-- Policy: Admins can upload attachments
CREATE POLICY "Admins can upload training attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update attachments
CREATE POLICY "Admins can update training attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete attachments
CREATE POLICY "Admins can delete training attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);