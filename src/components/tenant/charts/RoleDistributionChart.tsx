import React from 'react';
import dynamic from 'next/dynamic';
import { Users, Loader2 } from 'lucide-react';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RoleData {
  role: string;
  count: number;
  percentage: number;
}

interface RoleDistributionChartProps {
  data: RoleData[];
  isLoading?: boolean;
  className?: string;
}

export const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({
  data,
  isLoading = false,
  className = ''
}) => {
  // Prepare chart data
  const chartData = data.map(item => item.count);
  const labels = data.map(item => item.role);

  const options = {
    chart: {
      type: 'donut' as const,
      toolbar: {
        show: false
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
    labels,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#374151'
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#111827',
              formatter: function (val: any) {
                return val;
              }
            },
            total: {
              show: true,
              label: 'Total Users',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#374151',
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      position: 'bottom' as const,
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      markers: {
        width: 12,
        height: 12,
        radius: 6
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function(value: number, { series, seriesIndex, dataPointIndex, w }: any) {
          const percentage = data[dataPointIndex]?.percentage || 0;
          return `${value} users (${percentage}%)`;
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Role Distribution
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Role Distribution
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No role data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Role Distribution
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} roles
        </div>
      </div>
      
      <div className="chart-container">
        <Chart
          options={options}
          series={chartData}
          type="donut"
          height={300}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Roles</div>
        </div>
      </div>
    </div>
  );
}; 