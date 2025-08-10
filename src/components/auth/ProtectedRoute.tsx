"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo,
  fallback
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If auth is not required, allow access
      if (!requireAuth) {
        setIsChecking(false);
        return;
      }

      // Wait for auth to load
      if (isLoading) {
        return;
      }

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const loginUrl = redirectTo || getLoginUrl(pathname);
        router.push(loginUrl);
        return;
      }

      // Check role permissions if specified
      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // Redirect to unauthorized page or show error
        router.push('/unauthorized');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isLoading, isAuthenticated, user, requireAuth, allowedRoles, redirectTo, pathname, router]);

  // Show loading state
  if (isLoading || isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is not required or user is authenticated with proper role, render children
  if (!requireAuth || (isAuthenticated && user && (allowedRoles.length === 0 || allowedRoles.includes(user.role)))) {
    return <>{children}</>;
  }

  // This should not be reached, but just in case
  return null;
};

// Helper function to determine login URL based on current path
const getLoginUrl = (pathname: string): string => {
  if (pathname.startsWith('/superadmin')) {
    return '/superadmin/login';
  }
  
  // Extract tenant slug from path for tenant-specific login
  const pathParts = pathname.split('/');
  const tenantIndex = pathParts.findIndex(part => part && part !== 'tenant');
  if (tenantIndex !== -1 && pathParts[tenantIndex]) {
    return `/${pathParts[tenantIndex]}/login`;
  }
  
  return '/login';
};

export default ProtectedRoute; 