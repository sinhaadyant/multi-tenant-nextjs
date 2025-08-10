"use client";

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  Settings, 
  MessageSquare, 
  BarChart3,
  Activity,
  TrendingUp,
  UserCheck,
  Clock,
  Shield,
  Cog,
  FileText
} from 'lucide-react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useUserNotifications } from '@/hooks/useTenantNotifications';
import { useTenantAuth } from '@/context/TenantAuthContext';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const AppSidebar = () => {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, user } = useTenantAuth();
  
  // Fetch tenant-specific data
  const { data: dashboardData, isLoading: dashboardLoading } = useTenantDashboard(tenantSlug);
  const { users: usersData, isLoading: usersLoading } = useTenantUsers(tenantSlug, {
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch user notifications for unread count
  const { notifications } = useUserNotifications(tenantSlug, {
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const unreadNotificationsCount = notifications?.filter(n => n.status === 'unread').length || 0;

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: `/${tenantSlug}/dashboard`,
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'User Management',
      href: `/${tenantSlug}/users`,
      icon: Users,
      badge: dashboardData?.summary?.totalUsers || null
    },
    {
      name: 'Roles & Permissions',
      href: `/${tenantSlug}/roles`,
      icon: Shield,
      badge: null
    },
    {
      name: 'Module Management',
      href: `/${tenantSlug}/modules`,
      icon: Cog,
      badge: null
    },
    {
      name: 'Audit Logs',
      href: `/${tenantSlug}/audit`,
      icon: Activity,
      badge: null
    },
    {
      name: 'Support',
      href: `/${tenantSlug}/support`,
      icon: MessageSquare,
      badge: null
    },
    {
      name: 'Content Management',
      href: `/${tenantSlug}/content`,
      icon: FileText,
      badge: null
    },
    {
      name: 'Notifications',
      href: `/${tenantSlug}/notifications`,
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null
    },
    {
      name: 'Settings',
      href: `/${tenantSlug}/settings`,
      icon: Settings,
      badge: null
    }
  ];

  // Quick stats for the sidebar
  const quickStats = [
    {
      label: 'Active Users',
      value: dashboardData?.summary?.activeUsers || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'System Health',
      value: dashboardData?.summary?.systemHealth || 'Good',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <ErrorBoundary>
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              {/* Tenant Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 
                   tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'T'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tenant?.name || (tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) : 'Admin')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles && user.roles.length > 0 
                    ? user.roles[0].name 
                    : 'User'}
                </p>
              </div>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.roles && user.roles.length > 0 
                        ? user.roles[0].name 
                        : 'User'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {!dashboardLoading && dashboardData && (
            <div className="mb-6 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quick Stats
              </h3>
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className={`p-3 rounded-lg ${stat.bgColor} dark:bg-gray-700`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className={`text-sm font-semibold ${stat.color} dark:text-white`}>
                          {stat.value}
                        </p>
                      </div>
                      <Icon className={`h-4 w-4 ${stat.color} dark:text-gray-300`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
              Navigation
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isItemActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 ${
                      isItemActive 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Recent Activity */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {dashboardData.recentActivity.slice(0, 3).map((activity: any, index: number) => (
                  <div key={index} className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-start space-x-2">
                      <Activity className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{activity.description}</p>
                        <p className="text-gray-400 dark:text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
              Quick Actions
            </h3>
            <div className="space-y-1">
              <Link
                href={`/${tenantSlug}/users/create`}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                Add User
              </Link>
              <Link
                href={`/${tenantSlug}/roles/create`}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <Shield className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                Create Role
              </Link>
              <Link
                href={`/${tenantSlug}/content/create`}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                Create Content
              </Link>
              <Link
                href={`/${tenantSlug}/support/create`}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <MessageSquare className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                Create Ticket
              </Link>
            </div>
          </div>

          {/* System Status */}
          {dashboardData?.systemHealth?.uptime && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    dashboardData.systemHealth.uptime > 99 ? 'bg-green-500' : 
                    dashboardData.systemHealth.uptime > 95 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">System Status</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {dashboardData.systemHealth.uptime.toFixed(1)}% uptime
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </ErrorBoundary>
  );
};

export default AppSidebar;
