import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Loader2, Calendar } from 'lucide-react';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LoginTrendData {
  month: string;
  logins: number;
  uniqueUsers: number;
}

interface LoginTrendsChartProps {
  data: LoginTrendData[];
  isLoading?: boolean;
  className?: string;
}

export const LoginTrendsChart: React.FC<LoginTrendsChartProps> = ({
  data,
  isLoading = false,
  className = ''
}) => {
  const months = data.map(item => item.month);
  const loginCounts = data.map(item => item.logins);
  const uniqueUserCounts = data.map(item => item.uniqueUsers);

  const options = {
    chart: {
      type: 'line' as const,
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
    stroke: {
      curve: 'smooth',
      width: [3, 2]
    },
    colors: ['#3B82F6', '#10B981'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: ['#3B82F6', '#10B981'],
        inverseColors: false,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    markers: {
      size: 6,
      colors: ['#3B82F6', '#10B981'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },
    xaxis: {
      categories: months,
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        }
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      markers: {
        width: 12,
        height: 12,
        radius: 6
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function(value: number, { series, seriesIndex, dataPointIndex, w }: any) {
          if (seriesIndex === 0) {
            return `${value} total logins`;
          } else {
            return `${value} unique users`;
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Login Trends
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
            Monthly Login Trends
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No login data available</p>
          </div>
        </div>
      </div>
    );
  }

  const totalLogins = loginCounts.reduce((sum, count) => sum + count, 0);
  const totalUniqueUsers = uniqueUserCounts.reduce((sum, count) => sum + count, 0);
  const avgLoginsPerMonth = Math.round(totalLogins / data.length);

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Login Trends
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} months
        </div>
      </div>
      
      <div className="chart-container">
        <Chart
          options={options}
          series={[
            {
              name: 'Total Logins',
              data: loginCounts
            },
            {
              name: 'Unique Users',
              data: uniqueUserCounts
            }
          ]}
          type="line"
          height={300}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalLogins.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Logins</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalUniqueUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Users</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgLoginsPerMonth.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg/Month</div>
        </div>
      </div>

      {/* Trend Indicator */}
      {data.length >= 2 && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {data.length >= 2 ? (
                loginCounts[loginCounts.length - 1] > loginCounts[loginCounts.length - 2] ? 
                'Trending up' : 'Trending down'
              ) : 'Stable'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 