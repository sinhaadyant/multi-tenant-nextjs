import React from 'react';
import { 
  Users, 
  Settings, 
  FileText, 
  Shield, 
  Plus,
  ArrowRight,
  UserPlus,
  Cog,
  BarChart3,
  Bell,
  HelpCircle
} from 'lucide-react';

interface UserPermission {
  id: string;
  name: string;
  module: string;
  action: string;
}

interface Props {
  tenantSlug: string;
  userPermissions: UserPermission[];
}

export const QuickActions: React.FC<Props> = ({ tenantSlug, userPermissions }) => {
  const hasPermission = (module: string, action: string) => {
    return userPermissions.some(permission => 
      permission.module.toLowerCase() === module.toLowerCase() && 
      permission.action.toLowerCase() === action.toLowerCase()
    );
  };

  const actions = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'Add, edit, or remove users',
      icon: Users,
      color: 'bg-blue-500',
      href: `/${tenantSlug}/users`,
      requiresPermission: { module: 'users', action: 'view' }
    },
    {
      id: 'roles',
      title: 'Manage Roles',
      description: 'Configure user roles and permissions',
      icon: Shield,
      color: 'bg-green-500',
      href: `/${tenantSlug}/roles`,
      requiresPermission: { module: 'roles', action: 'view' }
    },
    {
      id: 'reports',
      title: 'Generate Reports',
      description: 'Create and download reports',
      icon: FileText,
      color: 'bg-purple-500',
      href: `/${tenantSlug}/reports`,
      requiresPermission: { module: 'reports', action: 'view' }
    },
    {
      id: 'settings',
      title: 'Tenant Settings',
      description: 'Configure tenant preferences',
      icon: Settings,
      color: 'bg-orange-500',
      href: `/${tenantSlug}/settings`,
      requiresPermission: { module: 'settings', action: 'view' }
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics and insights',
      icon: BarChart3,
      color: 'bg-indigo-500',
      href: `/${tenantSlug}/analytics`,
      requiresPermission: { module: 'analytics', action: 'view' }
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      color: 'bg-pink-500',
      href: `/${tenantSlug}/notifications`,
      requiresPermission: { module: 'notifications', action: 'view' }
    },
    {
      id: 'support',
      title: 'Support',
      description: 'Get help and contact support',
      icon: HelpCircle,
      color: 'bg-gray-500',
      href: `/${tenantSlug}/support`,
      requiresPermission: { module: 'support', action: 'view' }
    },
    {
      id: 'add-user',
      title: 'Add User',
      description: 'Invite a new user to the tenant',
      icon: UserPlus,
      color: 'bg-emerald-500',
      href: `/${tenantSlug}/users/new`,
      requiresPermission: { module: 'users', action: 'create' }
    }
  ];

  const filteredActions = actions.filter(action => {
    if (!action.requiresPermission) return true;
    return hasPermission(
      action.requiresPermission.module, 
      action.requiresPermission.action
    );
  });

  const handleActionClick = (href: string) => {
    window.location.href = href;
  };

  if (filteredActions.length === 0) {
    return (
      <div className="text-center py-8">
        <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No actions available
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Contact your administrator for access
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredActions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleActionClick(action.href)}
          className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
        >
          <div className={`p-2 rounded-lg ${action.color} bg-opacity-10 flex-shrink-0`}>
            <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {action.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {action.description}
            </p>
          </div>
          
          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
      ))}
      
      {/* Quick Stats */}
      <div className="col-span-full mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Quick Stats
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {userPermissions.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Permissions
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {filteredActions.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Available Actions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 