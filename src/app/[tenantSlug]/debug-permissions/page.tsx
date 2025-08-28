"use client";

import React from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import PermissionDebug from '@/components/debug/PermissionDebug';

const DebugPermissionsPage: React.FC = () => {
  const { user, permissions, roles, hasPermission, hasAnyPermission, hasRole, isLoading } = useReduxAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Not Authenticated</h1>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view Information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Permission Debug Page</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This page shows real-time authentication and permission data from Redux state.
        </p>
      </div>

      {/* Raw Data Display */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Raw Redux State Data</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Data */}
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">User Data</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-600 p-2 rounded">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Permissions Data */}
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Permissions Data</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-600 p-2 rounded">
              {JSON.stringify(permissions, null, 2)}
            </pre>
          </div>

          {/* Roles Data */}
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Roles Data</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-600 p-2 rounded">
              {JSON.stringify(roles, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Permission Debug Component */}
      <PermissionDebug />
    </div>
  );
};

export default DebugPermissionsPage;
