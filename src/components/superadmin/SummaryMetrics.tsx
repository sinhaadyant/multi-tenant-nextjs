"use client";

import React from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { SummaryMetrics as SummaryMetricsType } from '@/hooks/useSuperadminOverview';

interface SummaryMetricsProps {
  data: SummaryMetricsType;
  isLoading?: boolean;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Tenants',
      value: data.totalTenants,
      icon: <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      trend: '+12%',
      trendDirection: 'up' as const,
    },
    {
      label: 'Active Tenants',
      value: data.activeTenants,
      icon: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
      bgColor: 'bg-green-100 dark:bg-green-900',
      trend: '+8%',
      trendDirection: 'up' as const,
    },
    {
      label: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      trend: '+15%',
      trendDirection: 'up' as const,
    },
    {
      label: 'Active Users',
      value: data.activeUsers.toLocaleString(),
      icon: <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      trend: '+10%',
      trendDirection: 'up' as const,
    },
    {
      label: 'System Health',
      value: `${data.systemHealth}%`,
      icon: <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      trend: '+2.5%',
      trendDirection: 'up' as const,
    },
    {
      label: 'Alerts',
      value: data.alertCount,
      icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
      bgColor: 'bg-red-100 dark:bg-red-900',
      trend: '-2',
      trendDirection: 'down' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
      {metrics.map((metric, index) => (
        <div key={index} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              {metric.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {metric.trendDirection === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`ml-1 ${
              metric.trendDirection === 'up' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {metric.trend}
            </span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              from last month
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryMetrics; 