"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
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
  Bug,
  Building2
} from 'lucide-react';

import { TenantDashboardOverviewCards } from './TenantDashboardOverviewCards';
import { TenantDashboardAnalyticsChart } from './TenantDashboardAnalyticsChart';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { ErrorComponent, NoDataComponent } from './ErrorComponent';
import { TenantDashboardSkeleton } from './TenantDashboardSkeleton';
import DateFilterDropdown from './DateFilterDropdown';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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
  }, [tenantSlug]);

  return { stats, loading, error, refetch: fetchStats };
};

export const TenantDashboardClient: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const {
    data,
    isLoading,
    error,
    selectedRange,
    setSelectedRange,
    refetch
  } = useTenantDashboard(tenantSlug);

  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useTenantRealTimeStats(tenantSlug);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 TenantDashboardClient Debug:', {
      tenantSlug,
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

  // Handle authentication errors
  useEffect(() => {
    if (error && error.message.includes('Authentication required')) {
      toast.error('Please log in to access the dashboard');
      router.push(`/${tenantSlug}/login`);
    }
  }, [error, router, tenantSlug]);

  // Handle loading state
  if (isLoading) {
    return <TenantDashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tenant Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your tenant-specific data and operations
            </p>
          </div>
        </div>
        
        <ErrorComponent 
          error={error.message} 
          onRetry={() => {
            if (error.message.includes('Authentication required')) {
              router.push(`/${tenantSlug}/login`);
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
              Tenant Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your tenant-specific data and operations
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
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.tenant?.name || 'Tenant'} Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening in your tenant.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateFilterDropdown 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <TenantDashboardOverviewCards 
        summary={data.summary}
        stats={stats}
        loading={statsLoading}
      />

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Activity Overview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            User activity and system usage over time
          </p>
        </div>
        <div className="p-6">
          <TenantDashboardAnalyticsChart 
            charts={data.charts}
            selectedRange={selectedRange}
          />
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Latest activities in your tenant
            </p>
          </div>
          <div className="p-6">
            <RecentActivity 
              activities={data.recentActivity}
              tenantSlug={tenantSlug}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Common tasks and shortcuts
            </p>
          </div>
          <div className="p-6">
            <QuickActions 
              tenantSlug={tenantSlug}
              userPermissions={data.userPermissions}
            />
          </div>
        </div>
      </div>

      {/* System Health */}
      {data.systemHealth && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              System Health
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current system status and performance
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.systemHealth.uptime}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.systemHealth.activeSessions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {data.systemHealth.cpuUsage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.systemHealth.memoryUsage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}; 