'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/redux';
import { selectIsLoggedIn, selectToken, selectIsHydrated } from '@/store/slices/authSlice';

interface FastAuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * FastAuthGuard - Optimized auth guard that checks localStorage first
 * for instant redirects without waiting for Redux rehydration
 */
export default function FastAuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = '/superadmin/login' 
}: FastAuthGuardProps) {
  const router = useRouter();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const token = useAppSelector(selectToken);
  const isHydrated = useAppSelector(selectIsHydrated);
  
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [hasLocalToken, setHasLocalToken] = useState(false);

  // Fast token check on mount
  useEffect(() => {
    const checkLocalToken = () => {
      try {
        // Check if there's persisted auth data in localStorage
        const persistedRoot = localStorage.getItem('persist:superadmin-root');
        if (persistedRoot) {
          const parsed = JSON.parse(persistedRoot);
          const authData = parsed.auth ? JSON.parse(parsed.auth) : null;
          const localToken = authData?.token;
          
          if (!localToken) {
            console.log('🔐 FastAuthGuard: No token in localStorage, redirecting immediately');
            router.push(redirectTo);
            return;
          }
          
          setHasLocalToken(true);
        } else {
          console.log('🔐 FastAuthGuard: No persisted data, redirecting immediately');
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.error('🔐 FastAuthGuard: Error checking localStorage:', error);
        router.push(redirectTo);
        return;
      }
      
      setIsCheckingToken(false);
    };

    checkLocalToken();
  }, [router, redirectTo]);

  // Redux-based checks after rehydration
  useEffect(() => {
    if (!isHydrated || isCheckingToken) return;

    // If Redux is hydrated but no token, redirect
    if (!token) {
      console.log('🔐 FastAuthGuard: Redux hydrated, no token found, redirecting');
      router.push(redirectTo);
      return;
    }

    // If token exists but not logged in, redirect
    if (token && !isLoggedIn) {
      console.log('🔐 FastAuthGuard: Token exists but not logged in, redirecting');
      router.push(redirectTo);
      return;
    }
  }, [isHydrated, token, isLoggedIn, router, redirectTo, isCheckingToken]);

  // Show loader only while checking initial token or during rehydration with token
  if (isCheckingToken || (!isHydrated && hasLocalToken)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // If no local token was found, show fallback (redirect already happened)
  if (!hasLocalToken) {
    return fallback as React.ReactElement;
  }

  // If Redux not hydrated yet but we have local token, wait
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  // If Redux hydrated but no token, show fallback (redirect will happen)
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
 * Higher-Order Component version of FastAuthGuard
 */
export function withFastAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
  }
) {
  const FastAuthenticatedComponent = (props: P) => {
    return (
      <FastAuthGuard fallback={options?.fallback} redirectTo={options?.redirectTo}>
        <Component {...props} />
      </FastAuthGuard>
    );
  };

  FastAuthenticatedComponent.displayName = `withFastAuthGuard(${Component.displayName || Component.name})`;
  
  return FastAuthenticatedComponent;
}