import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

const DashboardAnalyticsChartComponent: React.FC<DashboardAnalyticsChartProps> = ({ chartData }) => {
  const { t } = useTranslation('superadmin');
  
    // Add null checks to prevent errors
  if (!chartData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('charts.title')}
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
  const limitedUserSignups = limitDataPoints(chartData.userSignups || [], 25);
  const limitedTenantActivity = limitDataPoints(chartData.tenantActivity || [], 25);

  // Check if we have meaningful data (not just zeros)
  const hasUserSignups = limitedUserSignups.length > 0 && limitedUserSignups.some(item => item.count > 0);
  const hasTenantActivity = limitedTenantActivity.length > 0 && limitedTenantActivity.some(item => item.count > 0);
  const hasRoleDistribution = (chartData.roleDistribution || []).length > 0;
  const hasPlanDistribution = (chartData.tenantPlanDistribution || []).length > 0;

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
  const userSignupsData = hasUserSignups ? limitedUserSignups : generateFallbackData(7);
  const tenantActivityData = hasTenantActivity ? limitedTenantActivity : generateFallbackData(7);

  // User Signups Line Chart
  const userSignupsOptions = {
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
      name: 'User Signups',
      data: userSignupsData.map(item => item.count)
    }],
    xaxis: {
      categories: userSignupsData.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      tickAmount: Math.min(userSignupsData.length, 10) // Limit tick amount for better readability
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
        formatter: (val: number) => `${val} signups`
      }
    },
    dataLabels: {
      enabled: false // Disable data labels for cleaner look
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
      text: 'No user signup data available',
      align: 'center' as const,
      verticalAlign: 'middle' as const,
      style: {
        color: '#6B7280',
        fontSize: '14px'
      }
    }
  };

  // Tenant Activity Bar Chart
  const tenantActivityOptions = {
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
      name: 'Tenant Activity',
      data: tenantActivityData.map(item => item.count)
    }],
    xaxis: {
      categories: tenantActivityData.map(item => formatChartDate(item.date)),
      labels: {
        style: {
          colors: '#6B7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      tickAmount: Math.min(tenantActivityData.length, 10)
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
      text: 'No tenant activity data available',
      align: 'center' as const,
      verticalAlign: 'middle' as const,
      style: {
        color: '#6B7280',
        fontSize: '14px'
      }
    }
  };

  // Role Distribution - Improved with better visualization
  const roleDistributionData = (chartData.roleDistribution || []).slice(0, 5); // Limit to top 5 roles
  const roleDistributionOptions = {
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
    series: roleDistributionData.map(item => item.count),
    labels: roleDistributionData.map(item => {
      // Clean up role names for better display
      const roleName = item.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return roleName.length > 15 ? roleName.substring(0, 15) + '...' : roleName;
    }),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'],
    legend: {
      position: 'bottom' as const,
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      labels: {
        colors: '#6B7280'
      },
      markers: {
        size: 12
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
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
    theme: {
      mode: 'light' as const
    },
    dataLabels: {
      enabled: false // Disable data labels for cleaner look
    },
    tooltip: {
      y: {
        formatter: function(val: number, opts: any) {
          const total = opts.w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          return `${val} users (${percentage}%)`;
        }
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
    series: (chartData.tenantPlanDistribution || []).map(item => item.count),
    labels: (chartData.tenantPlanDistribution || []).map(item => 
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
            {t('charts.userSignups.title')}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {userSignupsData.length} {t('charts.userSignups.dataPoints')}
            </span>
            {!hasUserSignups && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                {t('charts.userSignups.noDataLabel')}
              </span>
            )}
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          {typeof window !== 'undefined' ? (
            <Chart
              options={userSignupsOptions}
              series={userSignupsOptions.series}
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

      {/* Tenant Activity Chart */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('charts.tenantActivity.title')}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tenantActivityData.length} {t('charts.tenantActivity.dataPoints')}
            </span>
            {!hasTenantActivity && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                {t('charts.tenantActivity.noDataLabel')}
              </span>
            )}
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          {typeof window !== 'undefined' ? (
            <Chart
              options={tenantActivityOptions}
              series={tenantActivityOptions.series}
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
            {t('charts.roleDistribution.title')}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {roleDistributionData.length} {t('charts.roleDistribution.roles')}
            </span>
            {roleDistributionData.length > 5 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {t('charts.roleDistribution.top5Shown')}
              </span>
            )}
          </div>
        </div>
        {hasRoleDistribution ? (
          typeof window !== 'undefined' && (
            <Chart
              options={roleDistributionOptions}
              series={roleDistributionOptions.series}
              type="donut"
              height={300}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">{t('charts.roleDistribution.noData')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('charts.roleDistribution.noDataDesc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tenant Plan Distribution */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('charts.planDistribution.title')}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {chartData.tenantPlanDistribution?.length || 0} {t('charts.planDistribution.plans')}
            </span>
          </div>
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
              <p>{t('charts.planDistribution.noData')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardAnalyticsChart = React.memo(DashboardAnalyticsChartComponent); 