import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { pb } from '@/integrations/pocketbase/client';
import { provisionUserInPocketBase } from '@/lib/userProvisioning';

export interface SsoUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
}

interface AuthContextType {
  user: SsoUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SsoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;
    const whoamiUrl = import.meta.env.VITE_WHOAMI_URL || '/whoami';
    const enableAdminLogin = import.meta.env.VITE_ENABLE_ADMIN_LOGIN === 'true';

    const loadUser = async () => {
      try {
        if (enableAdminLogin && pb.authStore.isValid && pb.authStore.record) {
          const record = pb.authStore.record as any;
          const roles = record?.role ? [record.role] : [];
          setUser({
            id: record.id,
            email: record.email,
            name: record.name,
            role: record.role,
            roles,
          });
          setIsAdmin(roles.includes('admin'));
          setIsLoading(false);
          return;
        }

        const response = await fetch(whoamiUrl, { credentials: 'include' });
        if (!isActive) return;
        if (response.ok) {
          const data = (await response.json()) as SsoUser;

          // Auto-provision user in PocketBase
          try {
            const result = await provisionUserInPocketBase(data);
            if (!result.success) {
              console.warn('User provisioning failed (degraded mode):', result.error);
              // Continue anyway - user can still use app with SSO data
            }
          } catch (error) {
            console.error('User provisioning error:', error);
            // Continue anyway - degraded mode
          }

          setUser(data);
          const roles = data.roles || (data.role ? [data.role] : []);
          setIsAdmin(roles.includes('admin'));
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch {
        if (!isActive) return;
        setUser(null);
        setIsAdmin(false);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  const signOut = async () => {
    const enableAdminLogin = import.meta.env.VITE_ENABLE_ADMIN_LOGIN === 'true';
    if (enableAdminLogin && pb.authStore.isValid) {
      pb.authStore.clear();
    }
    const logoutBase = import.meta.env.VITE_SSO_LOGOUT_URL || '/mellon/logout';
    window.location.href = `${logoutBase}?ReturnTo=${encodeURIComponent(window.location.origin + '/')}`;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
