"use client";

import React from 'react';
import { Shield, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

interface UserRolesTabProps {
  user: any;
  roles: any[];
}

const UserRolesTab: React.FC<UserRolesTabProps> = ({ user, roles }) => {
  const currentRole = user.role;
  const allRoles = roles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Role Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current role assignment and available roles
        </p>
      </div>

      {/* Current Role Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Role
          </h4>
          {currentRole && (
            <Badge
              variant="light"
              color={currentRole.isActive ? 'success' : 'error'}
            >
              {currentRole.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>

        {currentRole ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentRole.name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentRole.description || 'No description available'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Users with this role
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {currentRole.userCount || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Permissions
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {currentRole.permissions?.length || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Date(currentRole.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Role Permissions Summary */}
            {currentRole.permissions && currentRole.permissions.length > 0 && (
              <div className="mt-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Role Permissions
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {currentRole.permissions.slice(0, 6).map((permission: any) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {permission.action}
                      </span>
                    </div>
                  ))}
                  {currentRole.permissions.length > 6 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      +{currentRole.permissions.length - 6} more permissions
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No role assigned
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This user doesn't have a role assigned. Assign a role to grant permissions.
            </p>
          </div>
        )}
      </div>

      {/* Available Roles */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Available Roles
        </h4>
        
        {allRoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoles.map((role) => (
              <div
                key={role.id}
                className={`border rounded-lg p-4 transition-colors ${
                  currentRole?.id === role.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </h5>
                  {currentRole?.id === role.id && (
                    <Badge variant="light" color="primary" size="sm">
                      Current
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {role.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {role.permissions?.length || 0} permissions
                  </span>
                  <Badge
                    variant="light"
                    color={role.isActive ? 'success' : 'error'}
                    size="sm"
                  >
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No roles available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No roles have been created yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRolesTab;
