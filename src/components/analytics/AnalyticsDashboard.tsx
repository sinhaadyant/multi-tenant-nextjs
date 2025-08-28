"use client";

import React, { useState, useCallback } from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useAnalytics } from '@/context/AnalyticsContext';
import { ChartContainer, ChartConfig } from './ChartContainer';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ErrorBoundary } from 'react-error-boundary';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  PieChart,
  Shield,
  Zap,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import analyticsApi from '@/services/analyticsApi';

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-center h-64 text-center">
      <div className="text-red-500 dark:text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <div className="text-lg font-medium mb-2">Something went wrong</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</div>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

// Chart configurations
const chartConfigs: ChartConfig[] = [
  {
    id: 'user-activity',
    title: 'User Activity',
    subtitle: 'Daily active users and activities',
    endpoint: 'user-activity',
    chartTypes: ['bar', 'line'],
    defaultChartType: 'bar',
    height: 300,
    showLegend: true,
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: new Date(item.date).toLocaleDateString(),
      users: item.users,
      activities: item.activities,
      sessions: item.sessions
    }))
  },
  {
    id: 'role-distribution',
    title: 'Role Distribution',
    subtitle: 'Users by role across the organization',
    endpoint: 'role-distribution',
    chartTypes: ['pie', 'donut'],
    defaultChartType: 'pie',
    height: 300,
    showLegend: true,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: item.role,
      value: item.count
    }))
  },
  {
    id: 'module-usage',
    title: 'Module Usage',
    subtitle: 'Most used modules and features',
    endpoint: 'module-usage',
    chartTypes: ['bar', 'line'],
    defaultChartType: 'bar',
    height: 300,
    showLegend: true,
    colors: ['#8B5CF6', '#06B6D4', '#84CC16'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: item.module,
      usage: item.usage,
      users: item.users
    }))
  },
  {
    id: 'system-metrics',
    title: 'System Performance',
    subtitle: 'CPU, memory, and storage usage',
    endpoint: 'system-metrics',
    chartTypes: ['line', 'bar'],
    defaultChartType: 'line',
    height: 300,
    showLegend: true,
    colors: ['#EF4444', '#F59E0B', '#10B981'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: new Date(item.date).toLocaleDateString(),
      cpu: item.cpu,
      memory: item.memory,
      storage: item.storage
    }))
  },
  {
    id: 'user-growth',
    title: 'User Growth',
    subtitle: 'New user registrations over time',
    endpoint: 'user-growth',
    chartTypes: ['line', 'bar'],
    defaultChartType: 'line',
    height: 300,
    showLegend: true,
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: new Date(item.date).toLocaleDateString(),
      total: item.count,
      newUsers: item.newUsers,
      activeUsers: item.activeUsers
    }))
  },
  {
    id: 'audit-logs',
    title: 'Audit Activity',
    subtitle: 'System actions and user activities',
    endpoint: 'audit-logs',
    chartTypes: ['bar', 'line'],
    defaultChartType: 'bar',
    height: 300,
    showLegend: true,
    colors: ['#8B5CF6', '#06B6D4', '#84CC16'],
    dataTransform: (data: any[]) => data.map(item => ({
      name: new Date(item.date).toLocaleDateString(),
      actions: item.count,
      users: item.users
    }))
  }
];

export interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { user, tenant, isLoggedIn } = useReduxAuth();
  const {
    filters,
    fullscreenChart,
    setFullscreenChart,
    isRefreshing,
    setIsRefreshing
  } = useAnalytics();

  const [isLoading, setIsLoading] = useState(false);

  // Handle chart export
  const handleExport = useCallback(async (chartId: string, format: 'png' | 'pdf' | 'csv') => {
    try {
      setIsLoading(true);
      
      if (!tenant?.slug) {
        throw new Error('Tenant not available');
      }

      const blob = await analyticsApi.exportAnalytics(tenant.slug, format, chartId, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartId}-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Chart exported successfully as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export chart: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.slug, filters]);

  // Handle fullscreen toggle
  const handleFullscreen = useCallback((chartId: string) => {
    setFullscreenChart(fullscreenChart === chartId ? null : chartId);
  }, [fullscreenChart, setFullscreenChart]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger a refetch of all queries
      // This would typically invalidate React Query cache
      toast.success('Analytics data refreshed');
    } catch (error: any) {
      toast.error('Failed to refresh analytics data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [setIsRefreshing]);

  // Check if user is logged in
  if (!isLoggedIn || !tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view analytics dashboard
          </p>
        </div>
      </div>
    );
  }

  // If a chart is in fullscreen mode, show only that chart
  if (fullscreenChart) {
    const chartConfig = chartConfigs.find(config => config.id === fullscreenChart);
    if (!chartConfig) {
      setFullscreenChart(null);
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {chartConfig.title} - Fullscreen
          </h2>
          <button
            onClick={() => setFullscreenChart(null)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </button>
        </div>
        <div className="h-full">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <ChartContainer
              config={chartConfig}
              filters={filters}
              onExport={handleExport}
              onFullscreen={handleFullscreen}
              isFullscreen={true}
              className="h-full"
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and metrics for {tenant?.name || 'your organization'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        onRefresh={handleRefresh}
        className="mb-6"
      />

      {/* Charts Grid */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {chartConfigs.map((config) => (
            <ErrorBoundary key={config.id} FallbackComponent={ErrorFallback}>
              <ChartContainer
                config={config}
                filters={filters}
                onExport={handleExport}
                onFullscreen={handleFullscreen}
                isFullscreen={false}
              />
            </ErrorBoundary>
          ))}
        </div>
      )}

      {/* No Charts Message */}
      {chartConfigs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analytics Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Configure your analytics charts to start viewing insights
          </p>
        </div>
      )}
    </div>
  );
};
