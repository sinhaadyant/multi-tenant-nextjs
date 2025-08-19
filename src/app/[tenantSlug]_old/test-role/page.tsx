"use client";

import React from 'react';
import { useTenantAuth } from '@/context/TenantAuthContext';
import RoleBadge from '@/components/ui/RoleBadge';

const TestRolePage = () => {
  const { user, tenant, isLoading, error } = useTenantAuth();
  
  // Debug logging
  console.log('🔍 TestRolePage Debug:', {
    isLoading,
    error,
    hasUser: !!user,
    userData: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      rolesCount: user.roles?.length || 0,
      roles: user.roles?.map(r => r.name) || []
    } : null,
    tenant: tenant ? {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    } : null
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
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
            Role Display Test
          </h1>

          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p><strong>Name:</strong> {user?.name || 'Not loaded'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not loaded'}</p>
              <p><strong>Active:</strong> {user?.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Tenant:</strong> {tenant?.name || 'Not loaded'}</p>
            </div>
          </div>

          {/* Roles Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roles Information</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p><strong>Roles Array:</strong> {user?.roles ? JSON.stringify(user.roles, null, 2) : 'No roles'}</p>
              <p><strong>Roles Length:</strong> {user?.roles?.length || 0}</p>
              <p><strong>First Role:</strong> {user?.roles?.[0]?.name || 'No first role'}</p>
            </div>
          </div>

          {/* Role Badge Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role Badge Test</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conditional Role Badge:</p>
                  {user?.roles && user.roles.length > 0 ? (
                    <RoleBadge 
                      role={user.roles[0].name} 
                      size="md" 
                    />
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      No Role
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direct Role Badge:</p>
                  <RoleBadge 
                    role={user?.roles?.[0]?.name || 'User'} 
                    size="md" 
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">All Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles?.map((role, index) => (
                      <RoleBadge 
                        key={index}
                        role={role.name} 
                        size="sm" 
                      />
                    )) || (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        No roles found
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Raw User Data</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRolePage; 