"use client";

import React from 'react';
import { Shield, Users, Edit, Trash2, Copy, Star, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Role } from '@/hooks/useTenantRoles';

interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onClone?: (role: Role) => void;
  onViewPermissions?: (role: Role) => void;
  onViewUsers?: (role: Role) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canClone?: boolean;
  canViewPermissions?: boolean;
  canViewUsers?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onEdit,
  onDelete,
  onClone,
  onViewPermissions,
  onViewUsers,
  canEdit = true,
  canDelete = true,
  canClone = true,
  canViewPermissions = true,
  canViewUsers = true,
}) => {
  const getRoleStatusColor = (role: Role) => {
    if (!role.isActive) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    if (role.isSystem) return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
    if (role.isDefault) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
  };

  const getRoleStatusText = (role: Role) => {
    if (!role.isActive) return 'Inactive';
    if (role.isSystem) return 'System';
    if (role.isDefault) return 'Default';
    return 'Active';
  };

  const getRoleStatusIcon = (role: Role) => {
    if (!role.isActive) return <XCircle className="w-4 h-4" />;
    if (role.isSystem) return <Shield className="w-4 h-4" />;
    if (role.isDefault) return <Star className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {role.name}
                </h3>
                {role.isDefault && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </span>
                )}
              </div>
              {role.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {role.description}
                </p>
              )}
            </div>
          </div>
          
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleStatusColor(role)}`}>
            {getRoleStatusIcon(role)}
            <span className="ml-1">{getRoleStatusText(role)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {role.permissions.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Permissions
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {role.userCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Users
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {canViewUsers && (
              <button
                onClick={() => onViewUsers?.(role)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Users className="w-4 h-4 mr-1" />
                Users
              </button>
            )}
            
            {canViewPermissions && (
              <button
                onClick={() => onViewPermissions?.(role)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                Permissions
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {canEdit && !role.isSystem && (
              <button
                onClick={() => onEdit?.(role)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Edit Role"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {canClone && !role.isSystem && (
              <button
                onClick={() => onClone?.(role)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Clone Role"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            
            {canDelete && !role.isSystem && role.userCount === 0 && (
              <button
                onClick={() => onDelete?.(role)}
                className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                title="Delete Role"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleCard; 