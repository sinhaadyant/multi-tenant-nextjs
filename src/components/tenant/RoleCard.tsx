"use client";

import React from 'react';
import { 
  Shield, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Star,
  Palette,
  Clock,
  UserCheck
} from 'lucide-react';
import { Role } from '@/hooks/useTenantRoles';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { formatDistanceToNow } from 'date-fns';

interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onClone?: (role: Role) => void;
  onViewUsers?: (role: Role) => void;
  onManagePermissions?: (role: Role) => void;
  onToggleStatus?: (role: Role) => void;
  onSelect?: (roleId: string, selected: boolean) => void;
  isSelected?: boolean;
  showSelection?: boolean;
  viewMode?: 'grid' | 'list';
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onEdit,
  onDelete,
  onClone,
  onViewUsers,
  onManagePermissions,
  onToggleStatus,
  onSelect,
  isSelected = false,
  showSelection = false,
  viewMode = 'grid'
}) => {
  const { hasPermission } = useReduxAuth();

  const canEdit = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');
  const canAssign = hasPermission('roles', 'assign');
  const canViewUsers = hasPermission('users', 'read');

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  const getRoleTypeIcon = () => {
    if (role.isSystem) return <Shield className="w-4 h-4 text-blue-600" />;
    if (role.isTemplate) return <Copy className="w-4 h-4 text-purple-600" />;
    if (role.isDefault) return <Star className="w-4 h-4 text-yellow-600" />;
    return <Settings className="w-4 h-4 text-gray-600" />;
  };

  const getRoleTypeLabel = () => {
    if (role.isSystem) return 'System';
    if (role.isTemplate) return 'Template';
    if (role.isDefault) return 'Default';
    return 'Custom';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (priority >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (priority >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const cardClasses = viewMode === 'grid' 
    ? 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200'
    : 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200';

  const contentClasses = viewMode === 'grid' 
    ? 'space-y-4'
    : 'flex items-center justify-between';

  return (
    <div className={`${cardClasses} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {showSelection && (
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(role.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      )}

      <div className={contentClasses}>
        {viewMode === 'grid' ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: role.color || '#6B7280' }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {role.name}
                    {getRoleTypeIcon()}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(role.priority)}`}>
                      Priority: {role.priority}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}>
                      {getRoleTypeLabel()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(role.isActive)}`}>
                  {getStatusIcon(role.isActive)}
                  <span className="ml-1">{role.isActive ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
            </div>

            {/* Description */}
            {role.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {role.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {role.userCount} users
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {role.permissions.length} permissions
                </span>
              </div>
            </div>

            {/* Created info */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Created {formatDistanceToNow(new Date(role.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {canViewUsers && (
                  <button
                    onClick={() => onViewUsers?.(role)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View assigned users"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Users</span>
                  </button>
                )}
                {canAssign && (
                  <button
                    onClick={() => onManagePermissions?.(role)}
                    className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    title={t('tables:filters.managePermissions')}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Permissions</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {canEdit && (
                  <button
                    onClick={() => onEdit?.(role)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title={t('tables:filters.editRole')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => onClone?.(role)}
                    className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                    title={t('tables:filters.cloneRole')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {canDelete && !role.isSystem && (
                  <button
                    onClick={() => onDelete?.(role)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title={t('tables:filters.deleteRole')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          // List view
          <>
            <div className="flex items-center space-x-4 flex-1">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: role.color || '#6B7280' }}
              >
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {getRoleTypeIcon()}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(role.priority)}`}>
                    Priority: {role.priority}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(role.isActive)}`}>
                    {getStatusIcon(role.isActive)}
                    <span className="ml-1">{role.isActive ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>
                {role.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {role.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{role.userCount} users</span>
              <span>{role.permissions.length} permissions</span>
              <span>{formatDistanceToNow(new Date(role.createdAt), { addSuffix: true })}</span>
            </div>

            <div className="flex items-center space-x-1">
              {canViewUsers && (
                <button
                  onClick={() => onViewUsers?.(role)}
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title="View assigned users"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              )}
              {canAssign && (
                <button
                  onClick={() => onManagePermissions?.(role)}
                  className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                  title={t('tables:filters.managePermissions')}
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onEdit?.(role)}
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title={t('tables:filters.editRole')}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onClone?.(role)}
                  className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                  title={t('tables:filters.cloneRole')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {canDelete && !role.isSystem && (
                <button
                  onClick={() => onDelete?.(role)}
                  className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Delete role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleCard; 