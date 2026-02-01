import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'training-attachments';

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to the training-attachments storage bucket
 */
export async function uploadTrainingFile(
  file: File,
  folder: 'hero-images' | 'attachments',
  trainingId?: string
): Promise<UploadResult> {
  try {
    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = trainingId 
      ? `${folder}/${trainingId}/${timestamp}-${randomStr}-${sanitizedName}`
      : `${folder}/${timestamp}-${randomStr}-${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Delete a file from the training-attachments storage bucket
 */
export async function deleteTrainingFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete error:', err);
    return false;
  }
}

/**
 * Extract the storage path from a public URL
 */
export function getPathFromUrl(url: string): string | null {
  try {
    const bucketPath = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = url.indexOf(bucketPath);
    if (index === -1) return null;
    return url.substring(index + bucketPath.length);
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a storage URL (not base64)
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('http') && url.includes('/storage/v1/object/public/');
}
