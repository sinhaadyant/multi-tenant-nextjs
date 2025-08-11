"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useDynamicPermissions } from '@/context/DynamicPermissionsContext';
import { useTenantAuth } from '@/context/TenantAuthContext';

const DebugPermissionsPage = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { hasPermission, isLoading, error, userPermissions } = useDynamicPermissions();
  const { user } = useTenantAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Permissions Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Debug Permissions - {tenantSlug}
          </h1>

          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Active:</strong> {user?.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Roles:</strong> {user?.roles?.map(role => role.name).join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissions Summary</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p><strong>Total Permissions:</strong> {userPermissions?.permissions?.length || 0}</p>
              <p><strong>Accessible Modules:</strong> {userPermissions?.accessibleModules?.length || 0}</p>
              <p><strong>Has Access:</strong> {userPermissions?.hasAccess ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Specific Permission Checks */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Users Module</h3>
                <p>users:view - {hasPermission('users', 'view') ? '✅' : '❌'}</p>
                <p>users:create - {hasPermission('users', 'create') ? '✅' : '❌'}</p>
                <p>users:edit - {hasPermission('users', 'edit') ? '✅' : '❌'}</p>
                <p>users:delete - {hasPermission('users', 'delete') ? '✅' : '❌'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dashboard Module</h3>
                <p>dashboard:view - {hasPermission('dashboard', 'view') ? '✅' : '❌'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Roles Module</h3>
                <p>roles:view - {hasPermission('roles', 'view') ? '✅' : '❌'}</p>
                <p>roles:create - {hasPermission('roles', 'create') ? '✅' : '❌'}</p>
                <p>roles:edit - {hasPermission('roles', 'edit') ? '✅' : '❌'}</p>
                <p>roles:delete - {hasPermission('roles', 'delete') ? '✅' : '❌'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Support Module</h3>
                <p>support:view - {hasPermission('support', 'view') ? '✅' : '❌'}</p>
                <p>support:create - {hasPermission('support', 'create') ? '✅' : '❌'}</p>
                <p>support:edit - {hasPermission('support', 'edit') ? '✅' : '❌'}</p>
              </div>
            </div>
          </div>

          {/* All Permissions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Permissions</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {userPermissions?.permissions?.map((permission, index) => (
                  <div key={index} className="bg-white dark:bg-gray-600 rounded px-2 py-1 text-sm">
                    {permission}
                  </div>
                ))}
              </div>
              {(!userPermissions?.permissions || userPermissions.permissions.length === 0) && (
                <p className="text-gray-500">No permissions found</p>
              )}
            </div>
          </div>

          {/* Module Permissions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Module Permissions</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {userPermissions?.modulePermissions && Object.entries(userPermissions.modulePermissions).map(([module, actions]) => (
                <div key={module} className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{module}</h3>
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action, index) => (
                      <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {(!userPermissions?.modulePermissions || Object.keys(userPermissions.modulePermissions).length === 0) && (
                <p className="text-gray-500">No module permissions found</p>
              )}
            </div>
          </div>

          {/* Raw Data */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Raw Permissions Data</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(userPermissions, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPermissionsPage; 