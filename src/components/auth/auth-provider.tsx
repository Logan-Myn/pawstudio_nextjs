'use client'

import { createContext, useContext, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/lib/store/auth';

const AuthContext = createContext<Record<string, never>>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setCredits } = useAuthStore();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // Use data directly from session - no API call needed!
      setUser({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.name || session.user.email.split('@')[0],
        createdAt: session.user.createdAt || new Date().toISOString(),
        credits: (session.user as any).credits || 0,
        role: ((session.user as any).role || 'user') as 'user' | 'admin' | 'super_admin',
      });
      setCredits((session.user as any).credits || 0);
    } else {
      setUser(null);
      setCredits(0);
    }

    setLoading(false);
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
