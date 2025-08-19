"use client";

import React, { useEffect, useState } from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { useDataPermissions } from '@/hooks/usePermissionBasedData';
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
  Bug
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { TenantDashboardOverviewCards } from './TenantDashboardOverviewCards';
import { TenantDashboardAnalyticsChart } from './TenantDashboardAnalyticsChart';
import { TenantRecentActivity } from './TenantRecentActivity';
import { TenantQuickActions } from './TenantQuickActions';
import { TenantDashboardSkeleton } from './TenantDashboardSkeleton';
import { TenantErrorComponent, TenantNoDataComponent } from './TenantErrorComponent';
import DateFilterDropdown from '../superadmin/DateFilterDropdown';
import api, { debugToken } from '@/lib/api';

// Real-time stats hook for tenant
const useTenantRealTimeStats = (tenantSlug: string) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tenant/${tenantSlug}/dashboard/stats`);
      if (response.data.success) {
        setStats(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch stats');
      }
    } catch (err: any) {
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
  const { user, tenant } = useReduxAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Use the tenant dashboard hook
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

  // Real-time stats
  const { stats: realTimeStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useTenantRealTimeStats(tenant?.slug || '');

  const usersPermissions = useDataPermissions('users');
  const rolesPermissions = useDataPermissions('roles');
  const auditPermissions = useDataPermissions('audit');
  const reportsPermissions = useDataPermissions('reports');

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
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle authentication errors
  useEffect(() => {
    if (error && error.message?.includes('Authentication required')) {
      toast.error('Please log in to access the dashboard');
      router.push(`/${tenant?.slug}/login`);
    }
  }, [error, router, tenant?.slug]);

  // Loading state
  if (isLoading) {
    return <TenantDashboardSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tenant?.name || 'Tenant'} Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your organization data and monitor activities
            </p>
          </div>
        </div>
        
        <TenantErrorComponent 
          error={error?.message || 'Unknown error'} 
          onRetry={() => {
            if (error?.message?.includes('Authentication required')) {
              router.push(`/${tenant?.slug}/login`);
            } else {
              refreshDashboard();
            }
          }}
        />
      </div>
    );
  }

  // No data state
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tenant?.name || 'Tenant'} Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your organization data and monitor activities
            </p>
          </div>
        </div>
        
        <TenantNoDataComponent 
          title="No Dashboard Data"
          message="Unable to load dashboard data. Please try again or contact support."
        />
      </div>
    );
  }

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
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <DateFilterDropdown 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                debugToken();
                toast.success('Token debug info logged to console');
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug Token
            </button>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      {/* Overview Cards */}
      <TenantDashboardOverviewCards 
        summary={{
          totalUsers: stats?.summary?.totalUsers || 0,
          activeUsers: stats?.summary?.activeUsers || 0,
          totalRoles: stats?.summary?.totalRoles || 0,
          totalAuditEvents: stats?.summary?.totalAuditEvents || 0,
          userGrowth: stats?.summary?.userGrowth || 0,
          auditGrowth: stats?.summary?.auditGrowth || 0
        }} 
        selectedRange={selectedRange} 
        isLoading={isLoading}
        permissions={{
          canViewUsers: usersPermissions.canView,
          canViewRoles: rolesPermissions.canView,
          canViewAudit: auditPermissions.canView,
          canViewReports: reportsPermissions.canView
        }}
      />

      {/* Quick Actions */}
      <TenantQuickActions 
        permissions={{
          canCreateUsers: usersPermissions.canCreate,
          canViewAudit: auditPermissions.canView,
          canCreateReports: reportsPermissions.canCreate,
          canUpdateRoles: rolesPermissions.canUpdate
        }}
        tenantSlug={tenant?.slug}
      />

      {/* Charts Section */}
      {stats?.charts && (
        <TenantDashboardAnalyticsChart 
          chartData={stats.charts}
          tenantSlug={tenant?.slug}
        />
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-1">
        {recentActivity?.activities && (
          <TenantRecentActivity 
            activities={recentActivity.activities} 
            tenantSlug={tenant?.slug}
          />
        )}
      </div>
    </div>
  );
};

export default TenantDashboardClient; 