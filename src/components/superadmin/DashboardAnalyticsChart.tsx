import React from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Loader2 } from 'lucide-react';

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
  userSignups: Array<{ date: string; count: number }>;
  tenantActivity: Array<{ date: string; count: number }>;
  roleDistribution: Array<{ role: string; count: number }>;
  tenantPlanDistribution: Array<{ plan: string; count: number }>;
}

interface DashboardAnalyticsChartProps {
  chartData: ChartData;
}

// Utility function to format dates for charts
const formatChartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (diffDays <= 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
};

// Utility function to limit data points for better performance
const limitDataPoints = (data: Array<{ date: string; count: number }>, maxPoints: number = 30) => {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

export const DashboardAnalyticsChart: React.FC<DashboardAnalyticsChartProps> = ({ chartData }) => {
  // Limit data points for better performance
  const limitedUserSignups = limitDataPoints(chartData.userSignups, 25);
  const limitedTenantActivity = limitDataPoints(chartData.tenantActivity, 25);

  // Check if we have data
  const hasUserSignups = limitedUserSignups.length > 0 && limitedUserSignups.some(item => item.count > 0);
  const hasTenantActivity = limitedTenantActivity.length > 0 && limitedTenantActivity.some(item => item.count > 0);
  const hasRoleDistribution = chartData.roleDistribution.length > 0;
  const hasPlanDistribution = chartData.tenantPlanDistribution.length > 0;

  // User Signups Line Chart
  const userSignupsOptions = {
    chart: {
      type: 'line' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    series: [{
      name: 'User Signups',
      data: limitedUserSignups.map(item => item.count)
    }],
    xaxis: {
      categories: limitedUserSignups.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    colors: ['#3B82F6'],
    stroke: {
      curve: 'smooth' as const,
      width: 3
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
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#1F2937']
      },
      formatter: function(val: any) {
        return val > 0 ? val : '';
      }
    },
    markers: {
      size: 4,
      colors: ['#3B82F6'],
      strokeColors: '#ffffff',
      strokeWidth: 2
    }
  };

  // Tenant Activity Bar Chart
  const tenantActivityOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: {
        show: false
      }
    },
    series: [{
      name: 'Tenant Activity',
      data: limitedTenantActivity.map(item => item.count)
    }],
    xaxis: {
      categories: limitedTenantActivity.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        dataLabels: {
          position: 'top'
        }
      }
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
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#1F2937']
      },
      formatter: function(val: any) {
        return val > 0 ? val : '';
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
    series: chartData.roleDistribution.map(item => item.count),
    labels: chartData.roleDistribution.map(item => item.role),
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

  // Tenant Plan Distribution Donut Chart
  const tenantPlanOptions = {
    chart: {
      type: 'donut' as const,
      toolbar: {
        show: false
      }
    },
    series: chartData.tenantPlanDistribution.map(item => item.count),
    labels: chartData.tenantPlanDistribution.map(item => 
      item.plan.charAt(0).toUpperCase() + item.plan.slice(1)
    ),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Signups Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Signups Over Time
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {limitedUserSignups.length} data points
            </span>
          </div>
        </div>
        {hasUserSignups ? (
          typeof window !== 'undefined' && (
            <Chart
              options={userSignupsOptions}
              series={userSignupsOptions.series}
              type="line"
              height={300}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No user signup data available</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different date range</p>
            </div>
          </div>
        )}
      </div>

      {/* Tenant Activity Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tenant Activity
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {limitedTenantActivity.length} data points
            </span>
          </div>
        </div>
        {hasTenantActivity ? (
          typeof window !== 'undefined' && (
            <Chart
              options={tenantActivityOptions}
              series={tenantActivityOptions.series}
              type="bar"
              height={300}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🏢</div>
              <p>No tenant activity data available</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different date range</p>
            </div>
          </div>
        )}
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

      {/* Tenant Plan Distribution */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tenant Plan Distribution
          </h3>
        </div>
        {hasPlanDistribution ? (
          typeof window !== 'undefined' && (
            <Chart
              options={tenantPlanOptions}
              series={tenantPlanOptions.series}
              type="donut"
              height={250}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <p>No plan distribution data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 