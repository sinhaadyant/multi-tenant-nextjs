import React from 'react';
import { 
  Plus, 
  Activity, 
  BarChart3, 
  Shield,
  Users,
  Settings,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';

interface Permissions {
  canCreateUsers: boolean;
  canViewAudit: boolean;
  canCreateReports: boolean;
  canUpdateRoles: boolean;
}

interface TenantQuickActionsProps {
  permissions: Permissions;
  tenantSlug?: string;
}

export const TenantQuickActions: React.FC<TenantQuickActionsProps> = ({ permissions, tenantSlug }) => {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Add New User',
      description: 'Create a new user account',
      icon: Plus,
      action: 'Create User',
      permission: permissions.canCreateUsers,
      href: `/${tenantSlug}/users/create`,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
    },
    {
      title: 'View Audit Logs',
      description: 'Check recent system activities',
      icon: Activity,
      action: 'View Logs',
      permission: permissions.canViewAudit,
      href: `/${tenantSlug}/audit`,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
    },
    {
      title: 'Generate Report',
      description: 'Create a new analytics report',
      icon: BarChart3,
      action: 'Create Report',
      permission: permissions.canCreateReports,
      href: `/${tenantSlug}/reports/create`,
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
    },
    {
      title: 'Manage Roles',
      description: 'Configure user roles and permissions',
      icon: Shield,
      action: 'Manage Roles',
      permission: permissions.canUpdateRoles,
      href: `/${tenantSlug}/roles`,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
    },
    {
      title: 'View Users',
      description: 'Browse and manage user accounts',
      icon: Users,
      action: 'View Users',
      permission: true, // Always allow viewing users
      href: `/${tenantSlug}/users`,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      action: 'Settings',
      permission: true, // Always allow settings
      href: `/${tenantSlug}/settings`,
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg border-gray-200 dark:border-gray-700 ${
              !action.permission ? 'opacity-50 bg-gray-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!action.permission}
              onClick={() => action.permission && action.href && router.push(action.href)}
            >
              {action.action}
            </Button>
            {!action.permission && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                Permission required
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
