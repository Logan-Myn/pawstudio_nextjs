'use client'

import { createContext, useContext, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/lib/store/auth';

const AuthContext = createContext<Record<string, never>>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setCredits } = useAuthStore();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const syncUser = async () => {
      if (isPending) {
        setLoading(true);
        return;
      }

      if (session?.user) {
        try {
          // Fetch full user data from API route (not directly from DB on client)
          const response = await fetch('/api/auth/profile');

          if (response.ok) {
            const userData = await response.json();

            setUser({
              id: userData.id,
              email: userData.email,
              fullName: userData.name || userData.email.split('@')[0],
              createdAt: userData.created_at,
              credits: userData.credits || 0,
              role: (userData.role || 'user') as 'user' | 'admin' | 'super_admin',
            });
            setCredits(userData.credits || 0);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setCredits(0);
      }

      setLoading(false);
    };

    syncUser();
  }, [session, isPending, setUser, setLoading, setCredits]);

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
