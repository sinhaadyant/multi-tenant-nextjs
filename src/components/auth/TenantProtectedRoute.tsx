"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTenantAuth } from '@/context/TenantAuthContext';
import { Loader2 } from 'lucide-react';

interface TenantProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const TenantProtectedRoute: React.FC<TenantProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo,
  fallback
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isLoading, error, hasRole } = useTenantAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔒 TenantProtectedRoute - Checking auth:', {
        requireAuth,
        isLoading,
        hasUser: !!user,
        pathname,
        tenantSlug
      });

      // If auth is not required, allow access
      if (!requireAuth) {
        console.log('🔒 Auth not required, allowing access');
        setIsChecking(false);
        return;
      }

      // Wait for auth to load
      if (isLoading) {
        console.log('🔒 Still loading auth, waiting...');
        return;
      }

      // If not authenticated (no user), redirect to login
      if (!user) {
        console.log('🔒 User not authenticated, redirecting to login');
        if (!redirectAttempted) {
          setRedirectAttempted(true);
          const loginUrl = redirectTo || `/${tenantSlug}/login`;
          console.log('🔒 Redirecting to:', loginUrl);
          router.push(loginUrl);
        }
        return;
      }

      // Check role permissions if specified
      if (allowedRoles.length > 0) {
        console.log('🔒 Checking role permissions:', allowedRoles);
        const hasRequiredRole = allowedRoles.some(role => hasRole(role));
        
        if (!hasRequiredRole) {
          console.log('🔒 User does not have required role, redirecting to unauthorized');
          if (!redirectAttempted) {
            setRedirectAttempted(true);
            router.push(`/${tenantSlug}/unauthorized`);
          }
          return;
        }
      }

      console.log('🔒 Auth check passed, allowing access');
      setIsChecking(false);
    };

    checkAuth();
  }, [isLoading, user, requireAuth, allowedRoles, redirectTo, pathname, router, tenantSlug, hasRole, redirectAttempted]);

  // Show loading state
  if (isLoading || isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading authentication...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // If auth is not required or user is authenticated with proper role, render children
  if (!requireAuth || (user && (allowedRoles.length === 0 || allowedRoles.some(role => hasRole(role))))) {
    return <>{children}</>;
  }

  // This should not be reached, but just in case
  return null;
};

export default TenantProtectedRoute;
