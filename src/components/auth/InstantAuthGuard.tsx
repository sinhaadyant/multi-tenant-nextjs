'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { instantAuthCheck } from '@/lib/instantAuth';

interface InstantAuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * InstantAuthGuard - Ultra-fast authentication guard
 * Uses synchronous localStorage checks for immediate redirects
 * No loading states, no waiting for Redux rehydration
 */
export default function InstantAuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = '/superadmin/login' 
}: InstantAuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure tokens are available
    const timer = setTimeout(() => {
      // Instant synchronous check
      const authResult = instantAuthCheck();
      console.log('🚀 InstantAuthGuard: Auth check result:', authResult);
      
      if (!authResult.isAuthenticated) {
        console.log('🚀 InstantAuthGuard: No authentication found, redirecting immediately');
        router.push(redirectTo);
        return;
      }
      
      console.log('🚀 InstantAuthGuard: User authenticated, proceeding');
    }, 100);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  // Use state to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const authResult = instantAuthCheck();
      console.log('🚀 InstantAuthGuard: Render check result:', authResult);
      setIsAuthenticated(authResult.isAuthenticated);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show fallback while checking authentication
  if (isAuthenticated === null) {
    console.log('🚀 InstantAuthGuard: Checking authentication...');
    return fallback as React.ReactElement;
  }

  if (!isAuthenticated) {
    console.log('🚀 InstantAuthGuard: Not authenticated, returning fallback');
    return fallback as React.ReactElement;
  }

  // User is authenticated, render children immediately
  return <>{children}</>;
}

/**
 * Higher-Order Component version of InstantAuthGuard
 */
export function withInstantAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
  }
) {
  const InstantlyAuthenticatedComponent = (props: P) => {
    return (
      <InstantAuthGuard fallback={options?.fallback} redirectTo={options?.redirectTo}>
        <Component {...props} />
      </InstantAuthGuard>
    );
  };

  InstantlyAuthenticatedComponent.displayName = `withInstantAuthGuard(${Component.displayName || Component.name})`;
  
  return InstantlyAuthenticatedComponent;
}