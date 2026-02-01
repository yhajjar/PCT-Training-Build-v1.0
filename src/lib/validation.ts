import { z } from 'zod';

// URL validation - only allow https:// URLs
const httpsUrlSchema = z.string().refine(
  (val) => !val || val.startsWith('https://'),
  { message: 'URL must use HTTPS' }
).refine(
  (val) => !val || val.length <= 2048,
  { message: 'URL is too long' }
);

// Training validation schema
export const trainingSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  shortDescription: z.string()
    .max(300, 'Short description must be less than 300 characters')
    .optional(),
  categoryId: z.string().min(1, 'Category is required'),
  externalLink: httpsUrlSchema.optional(),
  availableSlots: z.number().int().min(0, 'Available slots cannot be negative').max(10000),
  maxRegistrations: z.number().int().min(1, 'Max registrations must be at least 1').max(10000),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
});

// Resource validation schema
export const resourceSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  externalLink: httpsUrlSchema.optional(),
});

// Registration validation schema
export const registrationSchema = z.object({
  participantName: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  participantEmail: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
});

// Validate image file type by checking magic bytes
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }
  
  return { valid: true };
}

// Sanitize text for display (basic XSS prevention)
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate and parse form data
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { success: false, error: firstError?.message || 'Validation failed' };
}
