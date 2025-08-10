import React from 'react';
import dynamic from 'next/dynamic';
import { Users, Loader2, UserCheck, UserX } from 'lucide-react';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface UserActivityData {
  active: number;
  inactive: number;
  total: number;
  activePercentage: number;
  inactivePercentage: number;
}

interface UserActivityChartProps {
  data: UserActivityData;
  isLoading?: boolean;
  className?: string;
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({
  data,
  isLoading = false,
  className = ''
}) => {
  const chartData = [data.active, data.inactive];
  const labels = ['Active Users', 'Inactive Users'];

  const options = {
    chart: {
      type: 'bar' as const,
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
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#10B981', '#EF4444'],
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#304758']
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: labels,
      position: 'bottom',
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
      },
      crosshairs: {
        fill: {
          type: 'gradient',
          gradient: {
            colorFrom: '#D8E3F0',
            colorTo: '#BED1E6',
            stops: [0, 100],
            opacityFrom: 0.4,
            opacityTo: 0.5
          }
        }
      },
      tooltip: {
        enabled: true,
      }
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        }
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
          const percentage = dataPointIndex === 0 ? data.activePercentage : data.inactivePercentage;
          return `${value} users (${percentage}%)`;
        }
      }
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '70%'
            }
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
            User Activity Overview
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

  if (!data || data.total === 0) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Activity Overview
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No user data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Activity Overview
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.total} total users
        </div>
      </div>
      
      <div className="chart-container">
        <Chart
          options={options}
          series={[{
            name: 'Users',
            data: chartData
          }]}
          type="bar"
          height={300}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
            <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {data.active}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Active ({data.activePercentage}%)
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
            <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {data.inactive}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Inactive ({data.inactivePercentage}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 