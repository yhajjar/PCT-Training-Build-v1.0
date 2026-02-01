-- Drop existing restrictive storage policies if any
DROP POLICY IF EXISTS "Users can upload training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete training files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view training files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create permissive policies for the training-attachments bucket
-- Allow anyone to view files (bucket is public)
CREATE POLICY "Public read access for training attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'training-attachments');

-- Allow anyone to upload files (PIN protection is client-side)
CREATE POLICY "Public upload access for training attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'training-attachments');

-- Allow anyone to update files
CREATE POLICY "Public update access for training attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'training-attachments');

-- Allow anyone to delete files
CREATE POLICY "Public delete access for training attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'training-attachments');