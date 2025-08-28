"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { ChartCard } from './ChartCard';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Dynamically import chart components to avoid SSR issues
const DynamicChart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
    </div>
  )
});

export interface ChartConfig {
  id: string;
  title: string;
  subtitle?: string;
  endpoint: string;
  chartTypes: Array<'bar' | 'line' | 'pie' | 'donut'>;
  defaultChartType: 'bar' | 'line' | 'pie' | 'donut';
  dataTransform?: (data: any) => any[];
  height?: number;
  showLegend?: boolean;
  colors?: string[];
}

export interface ChartContainerProps {
  config: ChartConfig;
  className?: string;
  filters?: Record<string, any>;
  onExport?: (chartId: string, format: 'png' | 'pdf' | 'csv') => void;
  onFullscreen?: (chartId: string) => void;
  isFullscreen?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  className = '',
  filters = {},
  onExport,
  onFullscreen,
  isFullscreen = false
}) => {
  const { tenant } = useReduxAuth();
  const [currentChartType, setCurrentChartType] = useState(config.defaultChartType);

  // Fetch data using React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-chart', config.id, tenant?.slug, filters],
    queryFn: async () => {
      if (!tenant?.slug) {
        throw new Error('Tenant not available');
      }

      const response = await api.get(`/tenant/${tenant.slug}/analytics`, {
        params: { endpoint: config.endpoint, ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch chart data');
      }

      return response.data.data;
    },
    enabled: !!tenant?.slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    }
  });

  // Transform data if needed
  const chartData = useMemo(() => {
    if (!data) return [];
    return config?.dataTransform ? config.dataTransform(data) : data;
  }, [data, config?.dataTransform]);

  // Default colors
  const colors = config?.colors || [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  // Handle chart type change
  const handleChartTypeChange = (type: 'bar' | 'line' | 'pie' | 'donut') => {
    setCurrentChartType(type);
  };

  // Handle export
  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    onExport?.(config?.id, format);
    toast.success(`Exporting ${config?.title} as ${format.toUpperCase()}`);
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    onFullscreen?.(config?.id);
  };

  // Render chart based on type
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-sm font-medium mb-2">No data available</div>
            <div className="text-xs">Try adjusting your filters or date range</div>
          </div>
        </div>
      );
    }

    const height = config?.height || (isFullscreen ? 500 : 300);

    switch (currentChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {config?.showLegend && <Legend />}
              {Object.keys(chartData[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {config?.showLegend && <Legend />}
              {Object.keys(chartData[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Line 
                  key={key}
                  type="monotone"
                  dataKey={key} 
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={height / 3}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {config?.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={height / 6}
                outerRadius={height / 3}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {config?.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <ChartCard
      title={config?.title}
      subtitle={config?.subtitle}
      className={className}
      isLoading={isLoading}
      error={error?.message || null}
      chartTypes={config?.chartTypes}
      currentChartType={currentChartType}
      onChartTypeChange={handleChartTypeChange}
      onExport={handleExport}
      onFullscreen={handleFullscreen}
      isFullscreen={isFullscreen}
      showChartTypeSwitcher={config?.chartTypes?.length > 1}
    >
      {renderChart()}
    </ChartCard>
  );
};
