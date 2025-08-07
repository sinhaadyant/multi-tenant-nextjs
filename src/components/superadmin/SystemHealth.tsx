import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Activity,
  Calendar,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface DataInsightsProps {
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalSuperAdmins: number;
    growthMetrics?: {
      tenantGrowth: number;
      userGrowth: number;
      revenueGrowth: number;
    };
  };
}

interface InsightCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  trendLabel,
  icon, 
  color, 
  bgColor 
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <div className={color}>
              {icon}
            </div>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>
        
        <div className="mb-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {description}
        </p>
        
        {trend !== undefined && (
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend >= 0 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
            {trendLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const DataInsights: React.FC<DataInsightsProps> = ({ summary }) => {
  const utilizationRate = Math.round((summary.activeTenants / summary.totalTenants) * 100);
  const userPerTenant = Math.round(summary.totalUsers / summary.totalTenants);

  const insights = [
    {
      title: 'Tenant Utilization',
      value: `${utilizationRate}%`,
      description: `${summary.activeTenants} of ${summary.totalTenants} tenants active`,
      trend: summary.growthMetrics?.tenantGrowth,
      trendLabel: 'vs last month',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'User Growth',
      value: summary.totalUsers.toLocaleString(),
      description: `${userPerTenant} users per tenant on average`,
      trend: summary.growthMetrics?.userGrowth,
      trendLabel: 'vs last month',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Revenue Growth',
      value: summary.growthMetrics?.revenueGrowth ? `${summary.growthMetrics.revenueGrowth}%` : 'N/A',
      description: 'Monthly recurring revenue growth',
      trend: summary.growthMetrics?.revenueGrowth,
      trendLabel: 'vs last month',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'System Health',
      value: utilizationRate > 80 ? 'Excellent' : utilizationRate > 60 ? 'Good' : 'Needs Attention',
      description: 'Overall platform performance',
      icon: utilizationRate > 80 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />,
      color: utilizationRate > 80 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400',
      bgColor: utilizationRate > 80 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  const quickStats = [
    {
      label: 'Total Tenants',
      value: summary.totalTenants.toLocaleString(),
      icon: <Building2 className="w-4 h-4" />,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Active Tenants',
      value: summary.activeTenants.toLocaleString(),
      icon: <Target className="w-4 h-4" />,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Super Admins',
      value: summary.totalSuperAdmins.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Data Insights
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Key performance indicators and trends
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Live data</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-600 mb-2 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <InsightCard
            key={index}
            title={insight.title}
            value={insight.value}
            description={insight.description}
            trend={insight.trend}
            trendLabel={insight.trendLabel}
            icon={insight.icon}
            color={insight.color}
            bgColor={insight.bgColor}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Platform Summary
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {utilizationRate}% tenant utilization with {userPerTenant} average users per tenant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 