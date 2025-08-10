"use client";

import React, { ReactNode } from 'react';
import { useDynamicPermissions } from '@/context/DynamicPermissionsContext';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
  requiredPermission?: string; // Format: "moduleKey:action"
  requiredModule?: string; // Just check if user can access the module
  requiredRole?: string; // Check if user has specific role
  fallback?: ReactNode;
  showLoading?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredPermission,
  requiredModule,
  requiredRole,
  fallback,
  showLoading = true
}) => {
  const { 
    isLoading, 
    error, 
    hasPermission, 
    canAccessModule, 
    hasRole, 
    isInitialized 
  } = useDynamicPermissions();

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Permission Error
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Wait for initialization
  if (!isInitialized) {
    return null;
  }

  // Check required permission
  if (requiredPermission) {
    const [moduleKey, action] = requiredPermission.split(':');
    if (!hasPermission(moduleKey, action)) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You don't have permission to access this resource.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Required: {requiredPermission}
            </p>
          </div>
        </div>
      );
    }
  }

  // Check required module access
  if (requiredModule && !canAccessModule(requiredModule)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Module Access Denied
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have access to the {requiredModule} module.
          </p>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Role Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You need the {requiredRole} role to access this resource.
          </p>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default PrivateRoute; 