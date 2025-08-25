"use client";

import React, { useState, useEffect } from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';
import { useRouter, useParams } from 'next/navigation';
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import toast from 'react-hot-toast';
import DateFilterDropdown from '../superadmin/DateFilterDropdown';
import { useTenantAnalytics } from '@/hooks/useTenantAnalytics';

// Chart type options
const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  LINE: 'line',
  AREA: 'area',
  DONUT: 'donut'
} as const;

type ChartType = typeof CHART_TYPES[keyof typeof CHART_TYPES];

// Analytics sections
const ANALYTICS_SECTIONS = {
  USER_ANALYTICS: 'user-analytics',
  DEVICE_ANALYTICS: 'device-analytics',
  LOGIN_MATRIX: 'login-matrix',
  ACTIVITY_LOG: 'activity-log',
  SUPPORT_TICKETS: 'support-tickets',
  NOTIFICATIONS: 'notifications'
} as const;

type AnalyticsSection = typeof ANALYTICS_SECTIONS[keyof typeof ANALYTICS_SECTIONS];

const TenantAnalyticsClient: React.FC = () => {
  const { user, tenant, isLoggedIn } = useReduxAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [selectedRange, setSelectedRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [visibleSections, setVisibleSections] = useState<Record<AnalyticsSection, boolean>>({
    'user-analytics': true,
    'device-analytics': true,
    'login-matrix': true,
    'activity-log': true,
    'support-tickets': true,
    'notifications': true
  });
  const [chartTypes, setChartTypes] = useState<Record<AnalyticsSection, ChartType>>({
    'user-analytics': 'bar',
    'device-analytics': 'pie',
    'login-matrix': 'line',
    'activity-log': 'area',
    'support-tickets': 'donut',
    'notifications': 'bar'
  });

  const {
    canViewUsers,
    canViewAnalytics,
    canViewAudit,
    canViewReports,
    canViewNotifications
  } = useDashboardPermissions();

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch
  } = useTenantAnalytics(selectedRange);

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn || !tenant) {
      router.push(`/${tenantSlug}/login`);
      return;
    }
  }, [isLoggedIn, tenant, router, tenantSlug]);

  // Update last updated time when data changes
  useEffect(() => {
    if (analyticsData) {
      setLastUpdated(new Date());
    }
  }, [analyticsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Analytics refreshed successfully!');
    } catch (error: any) {
      console.error('Analytics refresh error:', error);
      toast.error('Failed to refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSection = (section: AnalyticsSection) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const changeChartType = (section: AnalyticsSection, chartType: ChartType) => {
    setChartTypes(prev => ({
      ...prev,
      [section]: chartType
    }));
  };

  const exportChart = (section: string) => {
    toast.success(`${section} chart exported successfully!`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('loading:specific.loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common:failedToLoadAnalytics')}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into your organization's performance and activity
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateFilterDropdown 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Section Visibility Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Section Visibility
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(ANALYTICS_SECTIONS).map(([key, section]) => (
            <button
              key={section}
              onClick={() => toggleSection(section)}
              className={`p-3 rounded-lg border transition-colors ${
                visibleSections[section]
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                  : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {visibleSections[section] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </div>
              <span className="text-xs font-medium capitalize">
                {key.replace('_', ' ').toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Analytics */}
        {canViewUsers && visibleSections['user-analytics'] && (
          <AnalyticsCard
            title={t('tables:filters.userAnalytics')}
            icon={Users}
            chartType={chartTypes['user-analytics']}
            onChartTypeChange={(type) => changeChartType('user-analytics', type)}
            onExport={() => exportChart('User Analytics')}
            data={analyticsData?.userAnalytics}
            color="blue"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analyticsData?.userAnalytics?.totalUsers || 0}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Users</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData?.userAnalytics?.activeUsers || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Active Users</div>
              </div>
            </div>
          </AnalyticsCard>
        )}

        {/* Device Analytics */}
        {canViewAnalytics && visibleSections['device-analytics'] && (
          <AnalyticsCard
            title={t('tables:filters.deviceAnalytics')}
            icon={Smartphone}
            chartType={chartTypes['device-analytics']}
            onChartTypeChange={(type) => changeChartType('device-analytics', type)}
            onExport={() => exportChart('Device Analytics')}
            data={analyticsData?.deviceAnalytics}
            color="purple"
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {analyticsData?.deviceAnalytics?.mobile || 0}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Mobile</div>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {analyticsData?.deviceAnalytics?.desktop || 0}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Desktop</div>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Tablet className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {analyticsData?.deviceAnalytics?.tablet || 0}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Tablet</div>
              </div>
            </div>
          </AnalyticsCard>
        )}

        {/* Login Matrix */}
        {canViewAnalytics && visibleSections['login-matrix'] && (
          <AnalyticsCard
            title={t('tables:filters.loginMatrix')}
            icon={Activity}
            chartType={chartTypes['login-matrix']}
            onChartTypeChange={(type) => changeChartType('login-matrix', type)}
            onExport={() => exportChart('Login Matrix')}
            data={analyticsData?.loginMatrix}
            color="green"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData?.loginMatrix?.successfulLogins || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analyticsData?.loginMatrix?.failedLogins || 0}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              </div>
            </div>
          </AnalyticsCard>
        )}

        {/* Activity Log */}
        {canViewAudit && visibleSections['activity-log'] && (
          <AnalyticsCard
            title={t('tables:filters.activityLog')}
            icon={Clock}
            chartType={chartTypes['activity-log']}
            onChartTypeChange={(type) => changeChartType('activity-log', type)}
            onExport={() => exportChart('Activity Log')}
            data={analyticsData?.activityLog}
            color="orange"
          >
            <div className="space-y-2 mb-4">
              {analyticsData?.activityLog?.recentActivities?.slice(0, 3).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                    <span className="text-sm text-orange-600 dark:text-orange-400">
                      {activity.action}
                    </span>
                  </div>
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </AnalyticsCard>
        )}

        {/* Support Tickets */}
        {canViewReports && visibleSections['support-tickets'] && (
          <AnalyticsCard
            title={t('tables:filters.supportTickets')}
            icon={Shield}
            chartType={chartTypes['support-tickets']}
            onChartTypeChange={(type) => changeChartType('support-tickets', type)}
            onExport={() => exportChart('Support Tickets')}
            data={analyticsData?.supportTickets}
            color="indigo"
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {analyticsData?.supportTickets?.resolved || 0}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Resolved</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {analyticsData?.supportTickets?.pending || 0}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Pending</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {analyticsData?.supportTickets?.closed || 0}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">Closed</div>
              </div>
            </div>
          </AnalyticsCard>
        )}

        {/* Notifications */}
        {canViewNotifications && visibleSections['notifications'] && (
          <AnalyticsCard
            title={t('tables:filters.notificationStatus')}
            icon={Bell}
            chartType={chartTypes['notifications']}
            onChartTypeChange={(type) => changeChartType('notifications', type)}
            onExport={() => exportChart('Notification Status')}
            data={analyticsData?.notifications}
            color="pink"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData?.notifications?.sent || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Sent</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analyticsData?.notifications?.read || 0}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Read</div>
              </div>
            </div>
          </AnalyticsCard>
        )}
      </div>

      {/* No Sections Visible */}
      {Object.values(visibleSections).every(visible => !visible) && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analytics Sections Visible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Use the section visibility controls above to show analytics sections you have permission to view.
          </p>
        </div>
      )}
    </div>
  );
};

// Analytics Card Component
interface AnalyticsCardProps {
  title: string;
  icon: React.ComponentType<any>;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  onExport: () => void;
  data: any;
  color: string;
  children?: React.ReactNode;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  icon: Icon,
  chartType,
  onChartTypeChange,
  onExport,
  data,
  color,
  children
}) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    pink: 'text-pink-600 dark:text-pink-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart Type Dropdown */}
          <select
            value={chartType}
            onChange={(e) => onChartTypeChange(e.target.value as ChartType)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="donut">Donut</option>
          </select>
          
          {/* Export Button */}
          <button
            onClick={onExport}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t('tables:filters.exportChart')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {children}

      {/* Chart Placeholder */}
      <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {data ? `${Object.keys(data).length} data points` : 'No data available'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantAnalyticsClient;
