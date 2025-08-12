"use client";

import React from 'react';
import { Settings, CheckCircle, XCircle } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

interface UserModulesTabProps {
  user: any;
  permissions: any[];
}

const UserModulesTab: React.FC<UserModulesTabProps> = ({ user, permissions }) => {
  // Get user's accessible modules from permissions
  const userPermissions = permissions.filter(p => 
    user.role?.permissions?.some((rp: any) => rp.id === p.id)
  );

  const accessibleModules = Array.from(
    new Set(userPermissions.map(p => p.module))
  ).map(moduleName => ({
    name: moduleName,
    permissions: userPermissions.filter(p => p.module === moduleName),
    icon: getModuleIcon(moduleName),
  }));

  function getModuleIcon(moduleName: string) {
    const iconMap: Record<string, string> = {
      'dashboard': '📊',
      'users': '👥',
      'roles': '🛡️',
      'permissions': '🔐',
      'tenants': '🏢',
      'audit': '📝',
      'reports': '📈',
      'notifications': '🔔',
      'settings': '⚙️',
      'backup': '💾',
      'import': '📥',
      'support': '🆘',
    };
    return iconMap[moduleName.toLowerCase()] || '📁';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Accessible Modules
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Modules and features this user can access based on their role permissions
        </p>
      </div>

      {/* Module Access Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Module Access Summary
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {accessibleModules.length} modules accessible • {userPermissions.length} total permissions
            </p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      {accessibleModules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => (
            <div
              key={module.name}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{module.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {module.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {module.permissions.length} permissions
                  </p>
                </div>
              </div>

              {/* Permissions List */}
              <div className="space-y-2">
                {module.permissions.slice(0, 3).map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {permission.action}
                    </span>
                  </div>
                ))}
                {module.permissions.length > 3 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    +{module.permissions.length - 3} more permissions
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No modules accessible
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This user doesn't have access to any modules. Assign a role with permissions to grant access.
          </p>
        </div>
      )}

      {/* Detailed Permissions Table */}
      {userPermissions.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Detailed Permissions
          </h4>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userPermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {permission.module}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {permission.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {permission.description || 'No description available'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="light" color="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Granted
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserModulesTab;

