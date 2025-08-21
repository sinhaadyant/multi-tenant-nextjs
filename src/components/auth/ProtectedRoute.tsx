"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePermissions?: string[];
  requireRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requirePermissions = [],
  requireRoles = [],
  fallback,
  redirectTo
}) => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { 
    isLoggedIn, 
    isLoading, 
    user, 
    hasPermission, 
    hasRole,
    logout 
  } = useReduxAuth();

  useEffect(() => {
    // If still loading, don't do anything yet
    if (isLoading) {
      return;
    }

    // If authentication is required but user is not logged in
    if (requireAuth && !isLoggedIn) {
      console.log('🔒 Access denied: User not logged in');
      const loginPath = `/${tenantSlug}/login`;
      router.replace(loginPath);
      return;
    }

    // If user is logged in but we're on login page, redirect to dashboard
    if (isLoggedIn && window.location.pathname.includes('/login')) {
      console.log('🔒 User already logged in, redirecting to dashboard');
      const dashboardPath = `/${tenantSlug}/dashboard`;
      router.replace(dashboardPath);
      return;
    }

    // Check permissions if required
    if (requirePermissions.length > 0) {
      const hasAllPermissions = requirePermissions.every(permission => {
        const [module, action] = permission.split(':');
        return hasPermission(module, action);
      });

      if (!hasAllPermissions) {
        console.log('🔒 Access denied: Insufficient permissions', requirePermissions);
        if (redirectTo) {
          router.replace(redirectTo);
        } else {
          // Logout user if they don't have required permissions
          logout({ redirect: true, redirectTo: `/${tenantSlug}/login` });
        }
        return;
      }
    }

    // Check roles if required
    if (requireRoles.length > 0) {
      const hasRequiredRole = requireRoles.some(role => hasRole(role));
      
      if (!hasRequiredRole) {
        console.log('🔒 Access denied: Insufficient role', requireRoles);
        if (redirectTo) {
          router.replace(redirectTo);
        } else {
          // Logout user if they don't have required role
          logout({ redirect: true, redirectTo: `/${tenantSlug}/login` });
        }
        return;
      }
    }
  }, [
    isLoggedIn, 
    isLoading, 
    requireAuth, 
    requirePermissions, 
    requireRoles, 
    hasPermission, 
    hasRole, 
    router, 
    tenantSlug, 
    redirectTo, 
    logout
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied message
  if (requireAuth && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be logged in to access this page.
          </p>
          <button
            onClick={() => router.push(`/${tenantSlug}/login`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show insufficient permissions message
  if (requirePermissions.length > 0 && isLoggedIn) {
    const hasAllPermissions = requirePermissions.every(permission => {
      const [module, action] = permission.split(':');
      return hasPermission(module, action);
    });

    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Insufficient Permissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>Required permissions:</p>
              <ul className="mt-2 space-y-1">
                {requirePermissions.map((permission, index) => (
                  <li key={index} className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push(`/${tenantSlug}/dashboard`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Show insufficient role message
  if (requireRoles.length > 0 && isLoggedIn) {
    const hasRequiredRole = requireRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Insufficient Role
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have the required role to access this page.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>Required roles:</p>
              <ul className="mt-2 space-y-1">
                {requireRoles.map((role, index) => (
                  <li key={index} className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {role}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push(`/${tenantSlug}/dashboard`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute; 