'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/redux';
import { selectIsLoggedIn, selectToken, selectIsHydrated } from '@/store/slices/authSlice';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard HOC that protects routes requiring authentication
 * - Checks token existence first (fast check)
 * - Only shows loader during Redux Persist rehydration when token exists
 * - Instantly redirects if no token found
 */
export default function AuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = '/superadmin/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const token = useAppSelector(selectToken);
  const isHydrated = useAppSelector(selectIsHydrated);

  useEffect(() => {
    // Fast check: If no token and Redux is hydrated, redirect immediately
    if (isHydrated && !token) {
      console.log('🔐 AuthGuard: No token found, redirecting to login');
      router.push(redirectTo);
      return;
    }

    // If token exists but not logged in and Redux is hydrated, redirect
    if (isHydrated && token && !isLoggedIn) {
      console.log('🔐 AuthGuard: Token exists but not logged in, redirecting to login');
      router.push(redirectTo);
      return;
    }
  }, [isHydrated, token, isLoggedIn, router, redirectTo]);

  // Show nothing while Redux Persist is rehydrating (only if no token check needed)
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If no token, show fallback or nothing (redirect will happen)
  if (!token) {
    return fallback as React.ReactElement;
  }

  // If token exists but not logged in, show fallback (redirect will happen)
  if (token && !isLoggedIn) {
    return fallback as React.ReactElement;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Higher-Order Component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
  }
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <AuthGuard fallback={options?.fallback} redirectTo={options?.redirectTo}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthenticatedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}