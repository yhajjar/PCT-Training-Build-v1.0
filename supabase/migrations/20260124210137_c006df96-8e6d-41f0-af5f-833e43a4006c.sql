-- Create storage bucket for resources (tools & guidelines)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resources', 'resources', true, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
ON CONFLICT (id) DO NOTHING;

-- Create permissive policies for the resources bucket
CREATE POLICY "Public read access for resources"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources');

CREATE POLICY "Public upload access for resources"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Public update access for resources"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resources');

CREATE POLICY "Public delete access for resources"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resources');

-- Add file_path column to resources table for tracking storage paths
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_path text;