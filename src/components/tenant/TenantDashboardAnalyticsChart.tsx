import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )
});

interface ChartData {
  userActivity?: Array<{ date: string; users: number; activities: number }>;
  systemUsage?: Array<{ date: string; cpu: number; memory: number; storage: number }>;
  roleDistribution?: Array<{ role: string; count: number }>;
  userGrowth?: Array<{ date: string; count: number }>;
}

interface TenantDashboardAnalyticsChartProps {
  chartData: ChartData;
  tenantSlug?: string;
}

// Utility function to format dates for charts
const formatChartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Format based on how recent the date is
  if (diffDays <= 1) {
    // For today/yesterday, show time
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffDays <= 7) {
    // For this week, show day name
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (diffDays <= 30) {
    // For this month, show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } else if (diffDays <= 90) {
    // For this quarter, show month and day
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } else {
    // For longer periods, show month and year
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    });
  }
};

// Utility function to limit data points for better performance
const limitDataPoints = (data: Array<{ date: string; count: number }>, maxPoints: number = 30) => {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

export const TenantDashboardAnalyticsChart: React.FC<TenantDashboardAnalyticsChartProps> = React.memo(({ chartData, tenantSlug }) => {
  // Add null checks to prevent errors
  if (!chartData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-64 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  // Limit data points for better performance and ensure we have data
  const limitedUserGrowth = limitDataPoints(chartData.userGrowth || [], 25);
  const limitedUserActivity = limitDataPoints(chartData.userActivity?.map(item => ({ date: item.date, count: item.activities })) || [], 25);

  // Check if we have meaningful data (not just zeros)
  const hasUserGrowth = limitedUserGrowth.length > 0 && limitedUserGrowth.some(item => item.count > 0);
  const hasUserActivity = limitedUserActivity.length > 0 && limitedUserActivity.some(item => item.count > 0);
  const hasRoleDistribution = (chartData.roleDistribution || []).length > 0;
  const hasSystemUsage = (chartData.systemUsage || []).length > 0;

  // Generate fallback data for empty charts to show structure
  const generateFallbackData = (days: number) => {
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        count: 0
      });
    }
    return data;
  };

  // Use fallback data if no real data exists
  const userGrowthData = hasUserGrowth ? limitedUserGrowth : generateFallbackData(7);
  const userActivityData = hasUserActivity ? limitedUserActivity : generateFallbackData(7);

  // User Growth Line Chart
  const userGrowthOptions = {
    chart: {
      type: 'line' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
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
    series: [{
      name: 'User Growth',
      data: userGrowthData.map(item => item.count)
    }],
    xaxis: {
      categories: userGrowthData.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      tickAmount: Math.min(userGrowthData.length, 10)
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#3B82F6'],
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    theme: {
      mode: 'light' as const
    },
    tooltip: {
      x: {
        format: 'MMM dd, yyyy'
      },
      y: {
        formatter: (val: number) => `${val} users`
      }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 4,
      colors: ['#3B82F6'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    },
    noData: {
      text: 'No user growth data available',
      align: 'center' as const,
      verticalAlign: 'middle' as const,
      style: {
        color: '#6B7280',
        fontSize: '14px'
      }
    }
  };

  // User Activity Bar Chart
  const userActivityOptions = {
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
    series: [{
      name: 'User Activity',
      data: userActivityData.map(item => item.count)
    }],
    xaxis: {
      categories: userActivityData.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      tickAmount: Math.min(userActivityData.length, 10)
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        dataLabels: {
          position: 'top'
        },
        columnWidth: '70%'
      }
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    theme: {
      mode: 'light' as const
    },
    tooltip: {
      x: {
        format: 'MMM dd, yyyy'
      },
      y: {
        formatter: (val: number) => `${val} activities`
      }
    },
    dataLabels: {
      enabled: false
    },
    noData: {
      text: 'No user activity data available',
      align: 'center' as const,
      verticalAlign: 'middle' as const,
      style: {
        color: '#6B7280',
        fontSize: '14px'
      }
    }
  };

  // Role Distribution Pie Chart
  const roleDistributionOptions = {
    chart: {
      type: 'pie' as const,
      toolbar: {
        show: false
      }
    },
    series: (chartData.roleDistribution || []).map(item => item.count),
    labels: (chartData.roleDistribution || []).map(item => item.role),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    legend: {
      position: 'bottom' as const,
      labels: {
        colors: '#6B7280'
      }
    },
    theme: {
      mode: 'light' as const
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: any, opts: any) {
        return opts.w.globals.seriesTotals[opts.seriesIndex] > 0 ? val.toFixed(1) + '%' : '';
      },
      style: {
        colors: ['#ffffff'],
        fontSize: '12px',
        fontWeight: 'bold'
      }
    }
  };

  // System Usage Line Chart
  const systemUsageOptions = {
    chart: {
      type: 'line' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    series: [
      {
        name: 'CPU Usage',
        data: (chartData.systemUsage || []).map(item => item.cpu)
      },
      {
        name: 'Memory Usage',
        data: (chartData.systemUsage || []).map(item => item.memory)
      }
    ],
    xaxis: {
      categories: (chartData.systemUsage || []).map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      },
      min: 0,
      max: 100
    },
    colors: ['#EF4444', '#3B82F6'],
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5
    },
    theme: {
      mode: 'light' as const
    },
    tooltip: {
      x: {
        format: 'MMM dd, yyyy'
      },
      y: {
        formatter: (val: number) => `${val}%`
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Growth Over Time
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {userGrowthData.length} data points
            </span>
            {!hasUserGrowth && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                No data
              </span>
            )}
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          {typeof window !== 'undefined' ? (
            <Chart
              options={userGrowthOptions}
              series={userGrowthOptions.series}
              type="line"
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Loading chart...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Activity
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {userActivityData.length} data points
            </span>
            {!hasUserActivity && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                No data
              </span>
            )}
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          {typeof window !== 'undefined' ? (
            <Chart
              options={userActivityOptions}
              series={userActivityOptions.series}
              type="bar"
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p>Loading chart...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Distribution */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Role Distribution
          </h3>
        </div>
        {hasRoleDistribution ? (
          typeof window !== 'undefined' && (
            <Chart
              options={roleDistributionOptions}
              series={roleDistributionOptions.series}
              type="pie"
              height={250}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <p>No role distribution data available</p>
            </div>
          </div>
        )}
      </div>

      {/* System Usage */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Usage
          </h3>
        </div>
        {hasSystemUsage ? (
          typeof window !== 'undefined' && (
            <Chart
              options={systemUsageOptions}
              series={systemUsageOptions.series}
              type="line"
              height={250}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No system usage data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 