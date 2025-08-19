"use client";

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Shield, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Settings,
  RefreshCw,
  Eye,
  TrendingDown,
  Bug
} from 'lucide-react';

import { DashboardOverviewCards } from './DashboardOverviewCards';
import { DashboardAnalyticsChart } from './DashboardAnalyticsChart';
import { RecentActivity } from './RecentActivity';
import { RecentTenants } from './RecentTenants';
import { QuickActions } from './QuickActions';
import { ErrorComponent, NoDataComponent } from './ErrorComponent';
import { DashboardSkeleton } from './DashboardSkeleton';
import DateFilterDropdown from './DateFilterDropdown';
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { debugToken } from '@/lib/api';

// Real-time stats hook
const useRealTimeStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/dashboard/stats');
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
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

export const DashboardClient: React.FC = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data,
    isLoading,
    error,
    selectedRange,
    setSelectedRange,
    refetch,
    forceRefresh
  } = useSuperadminDashboard();

  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useRealTimeStats();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 DashboardClient Debug:', {
      data: data,
      isLoading,
      error,
      selectedRange
    });
  }

  // Update last updated time when data changes
  useEffect(() => {
    if (data || stats) {
      setLastUpdated(new Date());
    }
  }, [data, stats]);

  // Periodic refresh every 2 minutes to ensure data stays fresh
  useEffect(() => {
    const interval = setInterval(() => {
      forceRefresh();
      refetchStats();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [forceRefresh, refetchStats]);

  // Handle authentication errors
  useEffect(() => {
    if (error && error.message.includes('Authentication required')) {
      toast.error('Please log in to access the dashboard');
      router.push('/superadmin/login');
    }
  }, [error, router]);

  // Handle loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              SuperAdmin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your multi-tenant application from a central location
            </p>
          </div>
        </div>
        
        <ErrorComponent 
          error={error.message} 
          onRetry={() => {
            if (error.message.includes('Authentication required')) {
              router.push('/superadmin/login');
            } else {
              refetch();
            }
          }}
        />
      </div>
    );
  }

  // Handle no data state
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              SuperAdmin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your multi-tenant application from a central location
            </p>
          </div>
        </div>
        
        <NoDataComponent 
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
            SuperAdmin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your multi-tenant application from a central location
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
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await Promise.all([forceRefresh(), refetchStats()]);
                toast.success('Dashboard data refreshed successfully!');
              } catch (error) {
                toast.error('Failed to refresh dashboard data');
              } finally {
                setIsRefreshing(false);
              }
            }}
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
      <DashboardOverviewCards 
        summary={{
          totalTenants: data.summary?.totalTenants || 0,
          activeTenants: data.summary?.activeTenants || 0,
          totalUsers: data.summary?.totalUsers || 0,
          activeUsers: (data.summary as any)?.activeUsers || data.summary?.totalUsers || 0,
          tenantGrowth: data.summary?.growthMetrics?.tenantGrowth,
          userGrowth: data.summary?.growthMetrics?.userGrowth
        }} 
        selectedRange={selectedRange} 
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts Section */}
      {data.charts && (
        <DashboardAnalyticsChart 
          chartData={data.charts}
        />
      )}

      {/* Recent Tenants and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {data.topTenants && (
          <RecentTenants tenants={data.topTenants} />
        )}
        {data.recentActivity?.auditLogs && (
          <RecentActivity auditLogs={data.recentActivity.auditLogs} />
        )}
      </div>
    </div>
  );
}; 