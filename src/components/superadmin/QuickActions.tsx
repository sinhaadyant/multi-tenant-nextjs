import React from 'react';
import { 
  Plus, 
  Users, 
  ClipboardList, 
  Building2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Create Tenant',
      description: 'Add a new tenant to the platform',
      icon: <Plus className="w-5 h-5" />,
      href: '/superadmin/tenants/new',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Manage Users',
      description: 'View and manage all platform users',
      icon: <Users className="w-5 h-5" />,
      href: '/superadmin/users',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Audit Logs',
      description: 'Review system activity and changes',
      icon: <ClipboardList className="w-5 h-5" />,
      href: '/superadmin/audit',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Tenant Management',
      description: 'Manage existing tenants and settings',
      icon: <Building2 className="w-5 h-5" />,
      href: '/superadmin/tenants',
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Common administrative tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1"
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 p-2 rounded-lg ${action.iconBg}`}>
                <div className={action.iconColor}>
                  {action.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {action.description}
                </p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-white/5 dark:to-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${action.color.replace('bg-', 'from-').replace('hover:bg-', 'to-')}`} />
          </Link>
        ))}
      </div>

      {/* Additional quick links */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Quick links:</span>
          <Link 
            href="/superadmin/roles"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Roles & Permissions
          </Link>
          <span className="text-gray-400">•</span>
          <Link 
            href="/superadmin/reports"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Reports
          </Link>
          <span className="text-gray-400">•</span>
          <Link 
            href="/superadmin/settings"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}; 