"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, 
  Activity, 
  CheckCircle, 
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { useTenantAuditLogs } from '@/hooks/useTenantAuditLogs';

import { CountCard } from '@/components/ui/CountCard';
import { QuickActionBar } from './QuickActionBar';
import { AuditLogList } from './AuditLogList';
import { WelcomeMessage } from './WelcomeMessage';
import { DashboardSkeleton } from './DashboardSkeleton';
import { ErrorComponent } from './ErrorComponent';
import toast from 'react-hot-toast';

interface TenantDashboardProps {
  className?: string;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ className = '' }) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const { user, permissions, hasPermission, hasRole, isLoading: permissionsLoading } = useReduxAuth();
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch } = useTenantDashboard(tenantSlug);
  const { auditLogs, loading: auditLoading } = useTenantAuditLogs();
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine user role and access level
  const isManager = hasRole('Tenant Admin') || hasRole('Tenant Manager') || hasPermission('dashboard', 'read');
  const isAdmin = hasRole('Tenant Admin');
  const hasDashboardAccess = isManager || isAdmin;

  // Update last updated time when data changes
  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        // Add other refetch calls here if needed
      ]);
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (permissionsLoading || dashboardLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (dashboardError) {
    return (
      <ErrorComponent 
        error={dashboardError.message || 'Failed to load dashboard data'} 
        onRetry={handleRefresh}
      />
    );
  }

  // Normal users without dashboard access
  if (!hasDashboardAccess) {
    return (
      <WelcomeMessage 
        userName={user?.name || 'User'}
        tenantName={user?.tenantSlug || 'Tenant'}
      />
    );
  }

  // Manager/Admin dashboard
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tenant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name}! Here&apos;s what&apos;s happening in {user?.tenantSlug}.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Count Cards */}
      {dashboardData?.summary && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <CountCard
            title="Total Users"
            count={dashboardData.summary.totalUsers}
            icon={<Users className="w-6 h-6" />}
            bgColor="bg-blue-100 dark:bg-blue-900"
            iconColor="text-blue-600 dark:text-blue-400"
            onClick={() => window.location.href = '/users'}
          />
          <CountCard
            title="Active Users"
            count={dashboardData.summary.activeUsers}
            icon={<UserCheck className="w-6 h-6" />}
            bgColor="bg-green-100 dark:bg-green-900"
            iconColor="text-green-600 dark:text-green-400"
            onClick={() => window.location.href = '/users?status=active'}
          />
          <CountCard
            title="Total Activities"
            count={dashboardData.summary.totalActivities}
            icon={<Activity className="w-6 h-6" />}
            bgColor="bg-purple-100 dark:bg-purple-900"
            iconColor="text-purple-600 dark:text-purple-400"
            onClick={() => window.location.href = '/audit'}
          />
          <CountCard
            title="System Health"
            count={dashboardData.summary.systemHealth}
            icon={<CheckCircle className="w-6 h-6" />}
            bgColor="bg-emerald-100 dark:bg-emerald-900"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Quick Actions */}
      <QuickActionBar 
        isAdmin={isAdmin}
        hasUserAccess={hasPermission('users', 'read')}
        hasRoleAccess={hasPermission('roles', 'read')}
      />

      {/* Charts Section - Temporarily disabled due to data structure mismatch */}
      {/* {dashboardData?.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserActivityChart 
            data={dashboardData.charts.userActivity}
            isLoading={chartsLoading}
          />
          <RoleDistributionChart 
            data={dashboardData.charts.systemUsage}
            isLoading={chartsLoading}
          />
        </div>
      )} */}

      {/* Recent Audit Logs */}
      {auditLogs && (
        <div className="grid grid-cols-1 gap-6">
          <AuditLogList 
            logs={auditLogs}
            isLoading={auditLoading}
            title="Recent Activity"
            showViewMore={true}
            viewMoreLink="/audit"
          />
        </div>
      )}
    </div>
  );
}; 