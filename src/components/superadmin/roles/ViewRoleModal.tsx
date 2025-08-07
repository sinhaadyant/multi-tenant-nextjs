"use client";

import React from 'react';
import { X, Shield, Users, Calendar, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { Role } from '@/hooks/useRolesAPI';

interface ViewRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

const ViewRoleModal: React.FC<ViewRoleModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  if (!isOpen) return null;

  // Group permissions by module
  const permissionGroups = role.permissions.reduce((groups: any[], permission) => {
    const existingGroup = groups.find(g => g.module === permission.module);
    if (existingGroup) {
      existingGroup.permissions.push(permission);
    } else {
      groups.push({
        module: permission.module,
        permissions: [permission]
      });
    }
    return groups;
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg">
              <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Role Details: {role.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View role information and assigned permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {role.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Badge variant={role.isActive ? 'default' : 'secondary'}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge variant={role.isGlobal ? 'default' : 'secondary'}>
                      {role.isGlobal ? 'Global' : 'Tenant-specific'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Users
                  </label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {role.userCount} users
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(role.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {role.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {role.description}
                  </p>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Assigned Permissions
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {role.permissions.length} permissions
                </div>
              </div>

              {role.permissions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No permissions assigned to this role
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {permissionGroups.map((group) => (
                    <div key={group.module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize mb-3">
                        {group.module}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.permissions.map((permission: any) => (
                          <div
                            key={permission.id}
                            className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {permission.name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewRoleModal; 