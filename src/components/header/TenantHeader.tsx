"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import {
  Bell, Search, User, Settings, LogOut, ChevronDown,
  Building2, Shield, Activity
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { useSidebar } from '@/context/SidebarContext';

const TenantHeader: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, tenant, roles, hasRole, logout } = useReduxAuth();
  const { toggleMobileSidebar } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      console.log('🔍 Tenant logout initiated...');
      
      // Call server-side logout API if possible
      try {
        await axios.post(`/api/tenant/${tenantSlug}/logout`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
          },
          timeout: 3000 // 3 second timeout
        });
        console.log('✅ Server-side logout successful');
      } catch (logoutError) {
        console.warn('⚠️ Server-side logout failed, continuing with client-side cleanup:', logoutError);
      }
      
      // Clear all auth data from Redux
      logout();
      
      // Clear all tokens from storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_auth_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      
      // Clear any other tenant-specific data
      localStorage.removeItem('tenant_data');
      sessionStorage.removeItem('tenant_data');
      localStorage.removeItem('persist:tenantAuth-root');
      localStorage.removeItem('persist:permissions-root');
      
      // Clear any redirect paths
      sessionStorage.removeItem('redirectAfterLogin');
      
      console.log('✅ Tenant logout successful, redirecting to login...');
      
      // Show success message
      const { toast } = await import('react-hot-toast');
      toast.success('Logged out successfully');
      
      // Redirect to tenant login page
      router.push(`/${tenantSlug}/login`);
    } catch (error) {
      console.error('❌ Error during tenant logout:', error);
      
      // Show error message
      const { toast } = await import('react-hot-toast');
      toast.error('Error during logout, but you have been signed out');
      
      // Force redirect even if there's an error
      router.push(`/${tenantSlug}/login`);
    }
  };

  const getUserRoleDisplay = () => {
    if (!roles || roles.length === 0) return 'User';
    
    const roleNames = roles.map((role: any) => role.name);
    if (roleNames.includes('Admin')) return 'Admin';
    if (roleNames.includes('Manager')) return 'Manager';
    if (roleNames.includes('Tenant Admin')) return 'Tenant Admin';
    return roleNames[0] || 'User';
  };

  const getNotificationCount = () => {
    // This would be fetched from your notifications API
    return 3; // Mock count
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800 border-b border-gray-200">
      {/* Left side - Search and breadcrumb */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right side - User menu and notifications */}
      <div className="flex items-center space-x-4">
        {/* Tenant Info */}
        {tenant && (
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tenant.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {tenant.plan}
            </span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {getNotificationCount() > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {getNotificationCount()}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {/* Mock notifications */}
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-900 dark:text-white">
                    New user registration request
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    2 minutes ago
                  </p>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-900 dark:text-white">
                    System maintenance scheduled
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 hour ago
                  </p>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <p className="text-sm text-gray-900 dark:text-white">
                    Role permissions updated
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    3 hours ago
                  </p>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/${tenantSlug}/notifications`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggleButton />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getUserRoleDisplay()}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
                <div className="flex items-center mt-2">
                  <Shield className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getUserRoleDisplay()}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href={`/${tenantSlug}/profile`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </Link>
                
                {hasRole('admin') && (
                  <Link
                    href={`/${tenantSlug}/settings`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Link>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default TenantHeader;
