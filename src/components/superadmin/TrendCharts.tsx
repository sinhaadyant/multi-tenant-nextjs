"use client";

import React, { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import the ReactApexChart component with loading fallback
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface TrendChartsProps {
  data: Array<{
    month: string;
    tenants: number;
    users: number;
  }>;
  isLoading?: boolean;
}

// Memoized chart options hook for better performance
const useChartOptions = (data: TrendChartsProps['data']): ApexOptions => useMemo(() => {
  const maxTenants = Math.max(...data.map(d => d.tenants));
  const maxUsers = Math.max(...data.map(d => d.users));

  return {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#3B82F6', '#10B981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
    },
    xaxis: {
      categories: data.map(d => d.month),
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: [
      {
        title: {
          text: 'Tenants',
          style: {
            color: '#3B82F6',
            fontSize: '14px',
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
        },
        max: maxTenants * 1.2,
      },
      {
        opposite: true,
        title: {
          text: 'Users',
          style: {
            color: '#10B981',
            fontSize: '14px',
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
        },
        max: maxUsers * 1.2,
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '14px',
      markers: {
        radius: 12,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => value.toLocaleString(),
      },
    },
  };
}, [data]);

// Memoized chart series hook
const useChartSeries = (data: TrendChartsProps['data']) => useMemo(() => [
  {
    name: 'Tenants',
    type: 'line',
    data: data.map(d => d.tenants),
  },
  {
    name: 'Users',
    type: 'line',
    data: data.map(d => d.users),
  },
], [data]);

// Memoized loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const TrendCharts: React.FC<TrendChartsProps> = memo(({ data, isLoading = false }) => {
  const options = useChartOptions(data);
  const series = useChartSeries(data);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Growth Trends
        </h3>
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height={300}
        />
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Statistics
        </h3>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.month}
              </span>
              <div className="flex space-x-4">
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {item.tenants} tenants
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {item.users} users
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

TrendCharts.displayName = 'TrendCharts';

export default TrendCharts; 