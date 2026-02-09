import { pb } from '@/integrations/pocketbase/client';
import type { SsoUser } from '@/hooks/useAuth';

export interface ProvisioningResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Generates a cryptographically random password for SSO users
 * These passwords are never exposed to users and only exist for PocketBase auth requirements
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Provisions an SSO user in PocketBase users collection
 *
 * Features:
 * - Creates user if doesn't exist (with default 'user' role)
 * - Does NOTHING if user exists (preserves manual role assignments)
 * - Handles race conditions (multiple simultaneous logins)
 * - Generates secure random passwords (users never see these)
 * - Validates input data
 *
 * @param ssoUser - User data from /whoami endpoint
 * @returns Promise with success status and user ID or error
 */
export async function provisionUserInPocketBase(
  ssoUser: SsoUser
): Promise<ProvisioningResult> {
  // Validation
  if (!ssoUser.email) {
    console.warn('SSO provisioning skipped: email is missing');
    return { success: false, error: 'Email is required' };
  }

  const email = ssoUser.email.trim().toLowerCase();
  const name = ssoUser.name || email.split('@')[0];

  try {
    // Check if user exists
    const filter = `email = "${email.replace(/"/g, '\\"')}"`;
    const existingUsers = await pb.collection('users').getList(1, 1, { filter });

    if (existingUsers.items.length > 0) {
      // User exists - do NOTHING (preserves manual role assignments)
      const existingUser = existingUsers.items[0] as any;
      console.log(`User already exists: ${email} (skipping provisioning)`);
      return { success: true, userId: existingUser.id };
    }

    // Create new user with default 'user' role
    console.log(`Provisioning new user: ${email}`);
    const password = generateRandomPassword();
    const newUser = await pb.collection('users').create({
      email,
      name,
      role: 'user', // Always default to 'user' role (admins assigned manually)
      password,
      passwordConfirm: password,
      emailVisibility: false
    });

    console.log(`Successfully provisioned user: ${email} with role: user`);
    return { success: true, userId: newUser.id };

  } catch (error: any) {
    // Handle race condition: another request created the user
    if (error.status === 400 && error.data?.email?.code === 'validation_not_unique') {
      console.log(`Race condition detected for ${email}, fetching existing user`);
      try {
        const filter = `email = "${email.replace(/"/g, '\\"')}"`;
        const retryUser = await pb.collection('users').getFirstListItem(filter);
        return { success: true, userId: retryUser.id };
      } catch (retryError) {
        console.error('Failed to fetch user after race condition:', retryError);
        return { success: false, error: 'Failed to fetch user after race condition' };
      }
    }

    // Other errors
    console.error('User provisioning error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provision user'
    };
  }
}
