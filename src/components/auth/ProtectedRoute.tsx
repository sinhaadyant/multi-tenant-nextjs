"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * ProtectedRoute - Comprehensive route protection with authentication validation
 * Handles Redux hydration, token validation, and automatic logout
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = '/superadmin/login',
  fallback = <div>Loading...</div>,
  requireSuperAdmin = true
}: ProtectedRouteProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isLoading, 
    isLoggedIn, 
    isHydrated, 
    isInitialized,
    user,
    logout,
    validateAuth
  } = useAuth();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Checking authentication...', {
      isAuthenticated,
      isLoading,
      isLoggedIn,
      isHydrated,
      isInitialized,
      userRole: user?.role
    });

    // Wait for Redux to hydrate and auth to initialize
    if (isLoading) {
      console.log('🛡️ ProtectedRoute: Still loading, waiting...');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('🛡️ ProtectedRoute: User not authenticated, redirecting to login');
      router.replace(redirectTo);
      return;
    }

    // Validate authentication
    const validation = validateAuth();
    if (!validation.isValid) {
      console.log('🛡️ ProtectedRoute: Authentication invalid, logging out');
      logout();
      router.replace(redirectTo);
      return;
    }

    // Check superadmin requirement
    if (requireSuperAdmin && user?.role !== 'superadmin') {
      console.log('🛡️ ProtectedRoute: User is not superadmin, redirecting');
      logout();
      router.replace(redirectTo);
      return;
    }

    console.log('🛡️ ProtectedRoute: Authentication valid, allowing access');
  }, [
    isAuthenticated, 
    isLoading, 
    isLoggedIn, 
    isHydrated, 
    isInitialized, 
    user, 
    router, 
    redirectTo, 
    requireSuperAdmin, 
    logout, 
    validateAuth
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    console.log('🛡️ ProtectedRoute: Showing loading fallback');
    return <>{fallback}</>;
  }

  // Show loading if not authenticated (will redirect)
  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Not authenticated, showing fallback');
    return <>{fallback}</>;
  }

  // Check superadmin requirement
  if (requireSuperAdmin && user?.role !== 'superadmin') {
    console.log('🛡️ ProtectedRoute: Not superadmin, showing fallback');
    return <>{fallback}</>;
  }

  // User is authenticated and authorized
  console.log('🛡️ ProtectedRoute: Rendering protected content');
  return <>{children}</>;
} 