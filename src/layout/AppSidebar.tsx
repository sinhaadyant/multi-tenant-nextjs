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
  BarChart3
} from 'lucide-react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useUserNotifications } from '@/hooks/useTenantNotifications';

const AppSidebar = () => {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = params.tenantSlug as string;

  // Fetch user notifications for unread count
  const { notifications } = useUserNotifications(tenantSlug, {
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const unreadNotificationsCount = notifications?.filter(n => !n.isRead).length || 0;

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
      name: 'Users',
      href: `/${tenantSlug}/users`,
      icon: Users,
      badge: null
    },
    {
      name: 'Notifications',
      href: `/${tenantSlug}/notifications`,
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null
    },
    {
      name: 'Support',
      href: `/${tenantSlug}/support`,
      icon: MessageSquare,
      badge: null
    },
    {
      name: 'Reports',
      href: `/${tenantSlug}/reports`,
      icon: BarChart3,
      badge: null
    },
    {
      name: 'Settings',
      href: `/${tenantSlug}/settings`,
      icon: Settings,
      badge: null
    }
  ];

  return (
    <ErrorBoundary>
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) : 'Admin'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tenant Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
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

          {/* Quick Actions */}
          <div className="mt-8">
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
                href={`/${tenantSlug}/notifications/create`}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <Bell className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                Send Notification
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </ErrorBoundary>
  );
};

export default AppSidebar;
