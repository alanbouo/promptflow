'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import apiClient from '@/lib/api-client';

interface AuthProviderProps {
  children: ReactNode;
}

// Component that syncs backend token when user has NextAuth session but no backend token
function BackendTokenSync() {
  const { data: session, status } = useSession();
  const syncAttempted = useRef(false);

  useEffect(() => {
    async function syncBackendToken() {
      // Only sync if user is authenticated but has no backend token
      if (status === 'authenticated' && session?.user?.email && !syncAttempted.current) {
        const existingToken = apiClient.getToken();
        if (!existingToken) {
          syncAttempted.current = true;
          console.log('[AuthSync] User has NextAuth session but no backend token, fetching...');
          
          try {
            // Call our frontend API to exchange NextAuth session for backend token
            const response = await fetch('/api/auth/backend-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.token) {
                apiClient.setToken(data.token);
                console.log('[AuthSync] Backend token obtained successfully');
              }
            } else {
              console.warn('[AuthSync] Failed to get backend token:', await response.text());
            }
          } catch (error) {
            console.error('[AuthSync] Error fetching backend token:', error);
          }
        }
      }
    }
    syncBackendToken();
  }, [session, status]);

  return null;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <BackendTokenSync />
      {children}
    </SessionProvider>
  );
}
