"use client";

import React from 'react';
import { X, Shield, Users, Calendar } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: Array<{
    id: string;
    moduleKey: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ViewRoleModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewRoleModal: React.FC<ViewRoleModalProps> = ({
  role,
  isOpen,
  onClose
}) => {
  if (!isOpen || !role) return null;

  const getModuleName = (moduleKey: string) => {
    const moduleNames: Record<string, string> = {
      users: 'Users',
      roles: 'Roles',
      audit: 'Audit Logs',
      reports: 'Reports',
      notifications: 'Notifications',
      support: 'Support Tickets',
      backup: 'Backup & Import',
      menu: 'Menu Management'
    };
    return moduleNames[moduleKey] || moduleKey;
  };

  const getPermissionLabel = (permission: string) => {
    return permission.replace('can', '').charAt(0).toUpperCase() + permission.replace('can', '').slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color || '#3B82F6' }}
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {role.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {role.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: role.color || '#3B82F6' }}
                    />
                    <span className="text-gray-900 dark:text-white">
                      {role.color || '#3B82F6'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usage Statistics
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned Users
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {role.userCount || 0} users
                  </p>
                </div>
                {role.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(role.createdAt)}
                    </p>
                  </div>
                )}
                {role.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Updated
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(role.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Permissions
            </h4>
            <div className="space-y-4">
              {role.permissions.length > 0 ? (
                role.permissions.map((permission) => (
                  <div key={permission.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      {getModuleName(permission.moduleKey)}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'canRead', label: 'Read', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                        { key: 'canCreate', label: 'Create', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                        { key: 'canUpdate', label: 'Update', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
                        { key: 'canDelete', label: 'Delete', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
                      ].map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${permission[key as keyof typeof permission] ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`px-2 py-1 text-xs font-medium rounded ${permission[key as keyof typeof permission] ? color : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No permissions assigned to this role
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRoleModal;
