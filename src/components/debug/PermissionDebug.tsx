"use client";

import React from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useSelector, useDispatch } from 'react-redux';
import { selectPermissions } from '@/store/slices/permissionsSlice';
import Button from '@/components/ui/button/Button';

const PermissionDebug: React.FC = () => {
  const { user, permissions, roles, hasPermission, hasAnyPermission, hasRole, refreshUser } = useReduxAuth();
  const permissionsState = useSelector(selectPermissions);
  const dispatch = useDispatch();

  const testPermissions = [
    { module: 'dashboard', action: 'read' },
    { module: 'users', action: 'read' },
    { module: 'users', action: 'create' },
    { module: 'roles', action: 'read' },
    { module: 'audit', action: 'read' },
    { module: 'reports', action: 'read' },
    { module: 'notifications', action: 'read' },
    { module: 'support', action: 'read' },
    { module: 'settings', action: 'read' },
    { module: 'data', action: 'read' },
    { module: 'utilities', action: 'read' },
  ];

  const testModules = ['dashboard', 'users', 'roles', 'audit', 'reports', 'notifications', 'support', 'settings', 'data', 'utilities'];
  const testRoles = ['Tenant Admin', 'admin', 'user', 'superadmin'];

  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing user profile...');
    await refreshUser();
  };

  const handleClearPermissions = () => {
    console.log('🧹 Clearing permissions...');
    // This will trigger a re-fetch
    window.location.reload();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Permission Debug Panel</h2>
        <div className="flex gap-2">
          <Button onClick={handleForceRefresh} variant="outline" size="sm">
            🔄 Force Refresh
          </Button>
          <Button onClick={handleClearPermissions} variant="outline" size="sm">
            🧹 Clear & Reload
          </Button>
        </div>
      </div>

      {/* Redux State Overview */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">Redux State Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Is Loading:</strong> {permissionsState.isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Is Initialized:</strong> {permissionsState.isInitialized ? 'Yes' : 'No'}</p>
            <p><strong>Has Error:</strong> {permissionsState.error ? 'Yes' : 'No'}</p>
            <p><strong>Last Fetched:</strong> {permissionsState.lastFetched ? new Date(permissionsState.lastFetched).toLocaleString() : 'Never'}</p>
          </div>
          <div>
            <p><strong>Tenant Slug:</strong> {permissionsState.tenantSlug || 'Not set'}</p>
            <p><strong>User Permissions:</strong> {permissionsState.userPermissions ? 'Loaded' : 'Not loaded'}</p>
            <p><strong>Permissions Count:</strong> {permissionsState.userPermissions?.permissions?.length || 0}</p>
            <p><strong>Accessible Modules:</strong> {permissionsState.userPermissions?.accessibleModules?.length || 0}</p>
          </div>
        </div>
        {permissionsState.error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300">
            <strong>Error:</strong> {permissionsState.error}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">User Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {user?.name || 'Not loaded'}</p>
            <p><strong>Email:</strong> {user?.email || 'Not loaded'}</p>
            <p><strong>ID:</strong> {user?.id || 'Not loaded'}</p>
          </div>
          <div>
            <p><strong>Tenant:</strong> {user?.tenantSlug || 'Not loaded'}</p>
            <p><strong>Role:</strong> {user?.role || 'Not loaded'}</p>
            <p><strong>Avatar:</strong> {user?.avatar ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Roles ({roles?.length || 0})</h3>
        {roles && roles.length > 0 ? (
          <div className="space-y-2">
            {roles.map((role, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-600 rounded border">
                <p><strong>Name:</strong> {role.name}</p>
                <p><strong>Description:</strong> {role.description}</p>
                <p><strong>Default:</strong> {role.isDefault ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No roles loaded</p>
        )}
      </div>

      {/* Permissions */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Raw Permissions ({permissions?.length || 0})</h3>
        {permissions && permissions.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {permissions.map((permission, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-600 rounded border text-sm">
                <p><strong>Module:</strong> {permission.moduleKey} ({permission.moduleName})</p>
                <p><strong>Permissions:</strong> Read: {permission.canRead ? '✅' : '❌'}, Create: {permission.canCreate ? '✅' : '❌'}, Update: {permission.canUpdate ? '✅' : '❌'}, Delete: {permission.canDelete ? '✅' : '❌'}, ViewAll: {permission.canViewAll ? '✅' : '❌'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No permissions loaded</p>
        )}
      </div>

      {/* Permission Tests */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Permission Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testPermissions.map((test, index) => (
            <div key={index} className="p-2 bg-white dark:bg-gray-600 rounded border">
              <p><strong>{test.module}:{test.action}</strong></p>
              <p>Result: {hasPermission(test.module, test.action) ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module Access Tests */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Module Access Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {testModules.map((module, index) => (
            <div key={index} className="p-2 bg-white dark:bg-gray-600 rounded border text-center">
              <p className="font-medium">{module}</p>
              <p>{hasAnyPermission(module) ? '✅' : '❌'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role Tests */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Role Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {testRoles.map((role, index) => (
            <div key={index} className="p-2 bg-white dark:bg-gray-600 rounded border text-center">
              <p className="font-medium">{role}</p>
              <p>{hasRole(role) ? '✅' : '❌'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Redux State */}
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-yellow-900 dark:text-yellow-100">Raw Redux State</h3>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Click to expand Redux state</summary>
          <pre className="mt-2 p-2 bg-white dark:bg-gray-600 rounded border overflow-auto max-h-40 text-xs">
            {JSON.stringify(permissionsState, null, 2)}
          </pre>
        </details>
      </div>

      {/* Real-time Updates */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">Real-time State</h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          This panel updates in real-time as the authentication state changes.
          Check the browser console for detailed permission checking logs.
        </p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          <strong>Debug Tips:</strong>
        </p>
        <ul className="text-sm text-green-600 dark:text-green-400 mt-1 list-disc list-inside">
          <li>Check browser console for Redux action logs</li>
          <li>Use "Force Refresh" to re-fetch user profile</li>
          <li>Use "Clear & Reload" to reset everything</li>
          <li>Look for permission count in Redux State Overview</li>
        </ul>
      </div>
    </div>
  );
};

export default PermissionDebug;
