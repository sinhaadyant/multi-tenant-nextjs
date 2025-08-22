"use client";

import React from 'react';
import { useTenantModulesAPI, Module } from '@/hooks/useTenantModulesAPI';
import { useParams } from 'next/navigation';

export default function TenantModulesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const { 
    modules, 
    modulesLoading: loading, 
    modulesError: error, 
    refetchModules: onRefresh 
  } = useTenantModulesAPI();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Module Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and configure modules for your tenant
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading modules...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading modules: {error.message}</p>
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid gap-4">
              {modules.map((module: Module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {module.moduleName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          module.isEnabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {module.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Version: {module.version}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No modules found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 