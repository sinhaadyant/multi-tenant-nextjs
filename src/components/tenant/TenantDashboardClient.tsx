"use client";

import React, { useEffect, useState } from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';
import PermissionBasedBlock from './PermissionBasedBlock';
import {
  Users,
  Shield,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Building2,
  Eye,
  UserPlus
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { TenantDashboardOverviewCards } from './TenantDashboardOverviewCards';
import { TenantDashboardAnalyticsChart } from './TenantDashboardAnalyticsChart';
import { DynamicAnalyticsCharts } from './DynamicAnalyticsCharts';
import { TenantRecentActivity } from './TenantRecentActivity';
import { TenantQuickActions } from './TenantQuickActions';
import { TenantDashboardSkeleton } from './TenantDashboardSkeleton';
import { TenantErrorComponent, TenantNoDataComponent } from './TenantErrorComponent';
import DateFilterDropdown from '../superadmin/DateFilterDropdown';
import TenantSearch from './TenantSearch';
import api from '@/lib/api';

// Real-time stats hook for tenant
const useTenantRealTimeStats = (tenantSlug: string) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/${tenantSlug}/dashboard/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch stats');
      }
    } catch (err: any) {
      console.error('Error fetching tenant dashboard stats:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [tenantSlug]);

  return { stats, loading, error, refetch: fetchStats };
};

const TenantDashboardClient: React.FC = () => {
  const { user, tenant, isLoggedIn } = useReduxAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Check if user is logged in and has tenant access
  useEffect(() => {
    if (!isLoggedIn || !tenant) {
      console.log('🔍 User not logged in or no tenant, redirecting to login...');
      router.push(`/${tenantSlug}/login`);
      return;
    }
  }, [isLoggedIn, tenant, router, tenantSlug]);

  // Use the tenant dashboard hook with better error handling
  const {
    stats,
    systemHealth,
    recentActivity,
    isLoading,
    isError,
    error,
    selectedRange,
    setSelectedRange,
    refreshDashboard
  } = useTenantDashboard();



  // Real-time stats with better error handling
  const { stats: realTimeStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useTenantRealTimeStats(tenant?.slug || '');

  const {
    canViewUsers,
    canViewRoles,
    canViewAudit,
    canViewReports,
    canViewAnalytics,
    canCreateUsers,
    canCreateReports,
    canManageRoles,
    permissionObjects,
    modules
  } = useDashboardPermissions();

  // Debug permissions in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard Permissions Debug:', {
      canViewUsers,
      canViewRoles,
      canViewAudit,
      canViewReports,
      canViewAnalytics,
      modulesCount: modules?.length || 0
    });
  }

  // Use actual permissions from the API
  const actualPermissions = {
    canViewUsers: canViewUsers,
    canViewRoles: canViewRoles,
    canViewAudit: canViewAudit,
    canViewReports: canViewReports,
    canViewAnalytics: canViewAnalytics
  };

  // Handle dashboard errors
  useEffect(() => {
    if (error || statsError) {
      const errorMessage = error?.message || statsError?.message || 'Unknown error';
      setDashboardError(errorMessage);
      console.error('Dashboard error:', errorMessage);
    } else {
      setDashboardError(null);
    }
  }, [error, statsError]);

  // Update last updated time when data changes
  useEffect(() => {
    if (stats || realTimeStats) {
      setLastUpdated(new Date());
    }
  }, [stats, realTimeStats]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshDashboard(), refetchStats()]);
      toast.success('Dashboard refreshed successfully!');
    } catch (error: any) {
      console.error('Dashboard refresh error:', error);
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        router.push(`/${tenant?.slug}/login`);
      } else {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle authentication errors
  useEffect(() => {
    if (error && (error.message?.includes('Authentication required') || error.message?.includes('expired'))) {
      toast.error('Session expired. Please log in again.');
      router.push(`/${tenant?.slug}/login`);
    }
  }, [error, router, tenant?.slug]);

  // Show loading skeleton only on initial load
  if (isLoading && !stats) {
    return <TenantDashboardSkeleton />;
  }

  // Create fallback stats if data is not available
  const fallbackStats = {
    summary: {
      totalUsers: 0,
      activeUsers: 0,
      totalRoles: 0,
      totalAuditEvents: 0,
      userGrowth: 0,
      auditGrowth: 0
    },
    permissions: {
      canViewUsers: false,
      canViewRoles: false,
      canViewAudit: false,
      canViewReports: false,
      canViewNotifications: false
    },
    charts: undefined,
    recentActivity: []
  };

  const displayStats = stats || fallbackStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tenant?.name || 'Tenant'} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name || 'User'}! Here's what's happening with {tenant?.name || 'your organization'} today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <TenantSearch tenantSlug={tenantSlug} className="w-64" />
          {selectedRange && setSelectedRange && (
            <DateFilterDropdown 
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>



      {/* Overview Cards - Only show if user has any relevant permissions */}
      {(actualPermissions.canViewUsers || actualPermissions.canViewRoles || actualPermissions.canViewAudit || actualPermissions.canViewReports) && (
        <TenantDashboardOverviewCards 
          summary={{
            totalUsers: displayStats?.summary?.totalUsers || 0,
            activeUsers: displayStats?.summary?.activeUsers || 0,
            totalRoles: displayStats?.summary?.totalRoles || 0,
            totalAuditEvents: displayStats?.summary?.totalAuditEvents || 0,
            userGrowth: displayStats?.summary?.userGrowth || 0,
            auditGrowth: displayStats?.summary?.auditGrowth || 0
          }} 
          selectedRange={selectedRange || '7d'} 
          isLoading={isLoading}
          permissions={{
            canViewUsers: actualPermissions.canViewUsers,
            canViewRoles: actualPermissions.canViewRoles,
            canViewAudit: actualPermissions.canViewAudit,
            canViewReports: actualPermissions.canViewReports
          }}
        />
      )}

      {/* Show error message if there's an error but still show the dashboard */}
      {isError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-800 dark:text-yellow-200">
              Some dashboard data couldn't be loaded. {error?.message}
              {error?.message?.includes('expired') && (
                <span className="block mt-1 text-sm">
                  Your session may have expired. Try refreshing the page or logging in again.
                </span>
              )}
            </span>
            <div className="ml-auto flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    router.push(`/${tenant?.slug}/login`);
                  }}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm"
                >
                  Clear & Relogin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Debugger - Only show in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ApiDebugger />
      )} */}

      {/* Quick Actions - Only show if user has any relevant permissions */}
      {(canCreateUsers || canViewAudit || canCreateReports || canManageRoles) ? (
        <div>
          {TenantQuickActions ? (
            <TenantQuickActions 
              permissions={{
                canCreateUsers: canCreateUsers,
                canViewAudit: canViewAudit,
                canCreateReports: canCreateReports,
                canUpdateRoles: canManageRoles
              }}
              tenantSlug={tenant?.slug}
            />
          ) : (
        /* Fallback Quick Actions */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {canCreateUsers && (
              <button
                onClick={() => router.push(`/${tenantSlug}/users`)}
                className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Add User</span>
              </button>
            )}
            {canViewAudit && (
              <button
                onClick={() => router.push(`/${tenantSlug}/audit`)}
                className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">View Audit</span>
              </button>
            )}
            {canManageRoles && (
              <button
                onClick={() => router.push(`/${tenantSlug}/roles`)}
                className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Manage Roles</span>
              </button>
            )}
            <button
              onClick={() => router.push(`/${tenantSlug}/profile`)}
              className="flex items-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Settings</span>
            </button>
          </div>
          {/* Show message if no actions are available */}
          {!canCreateUsers && !canViewAudit && !canManageRoles && (
            <div className="text-center mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No quick actions available. Contact your administrator for permissions.
              </p>
            </div>
          )}
        </div>
        )}
        </div>
      ) : (
        /* No permissions for quick actions */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Quick Actions Restricted
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to access quick actions. Contact your administrator for access.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Section - Only show if user has analytics permission */}
      {canViewAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h3>
            <button
              onClick={() => router.push(`/${tenantSlug}/analytics`)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Full Analytics
            </button>
          </div>
          <DynamicAnalyticsCharts tenantSlug={tenantSlug} />
        </div>
      )}

      {/* Recent Activity - Only show if user has audit permission */}
      {canViewAudit && (
        <div className="grid gap-6 lg:grid-cols-1">
          {(recentActivity?.activities || displayStats?.recentActivity) ? (
            <TenantRecentActivity 
              activities={recentActivity?.activities || displayStats?.recentActivity || []} 
              tenantSlug={tenant?.slug}
            />
          ) : (
            /* Fallback Recent Activity */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {(recentActivity?.activities || displayStats?.recentActivity || []).length > 0 ? (
                  (recentActivity?.activities || displayStats?.recentActivity || []).slice(0, 5).map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description || activity.action || 'Activity'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.user || 'Unknown User'} • {new Date(activity.timestamp || activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantDashboardClient; 