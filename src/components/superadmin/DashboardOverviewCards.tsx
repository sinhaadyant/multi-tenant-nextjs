import React from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  growth?: number;
  growthLabel?: string;
  bgColor: string;
  iconColor: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  icon,
  growth,
  growthLabel,
  bgColor,
  iconColor
}) => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
    {growth !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        {growth >= 0 ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`ml-1 ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {growth >= 0 ? '+' : ''}{growth}%
        </span>
        {growthLabel && (
          <span className="ml-2 text-gray-500 dark:text-gray-400">
            {growthLabel}
          </span>
        )}
      </div>
    )}
  </div>
);

interface DashboardOverviewCardsProps {
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
  selectedRange?: string;
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({ summary, selectedRange = '7d' }) => {
  // Helper function to get growth label based on selected range
  const getGrowthLabel = (range: string): string => {
    switch (range) {
      case '1d': return 'from yesterday';
      case '7d': return 'from last week';
      case '30d': return 'from last month';
      case '60d': return 'from last 60 days';
      case '90d': return 'from last 90 days';
      case 'all': return 'from all time';
      default: return 'from last period';
    }
  };

  // Add null checks to prevent errors
  if (!summary) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
                <div className="h-6 bg-gray-200 rounded w-16 mt-2 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Tenants',
      value: summary.totalTenants || 0,
      icon: <Building2 className="w-6 h-6" />,
      growth: summary.growthMetrics?.tenantGrowth,
      growthLabel: getGrowthLabel(selectedRange),
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Users',
      value: summary.totalUsers || 0,
      icon: <Users className="w-6 h-6" />,
      growth: summary.growthMetrics?.userGrowth,
      growthLabel: getGrowthLabel(selectedRange),
      bgColor: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Super Admins',
      value: summary.totalSuperAdmins || 0,
      icon: <Shield className="w-6 h-6" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Active Tenants',
      value: summary.activeTenants || 0,
      icon: <Activity className="w-6 h-6" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <OverviewCard key={index} {...card} />
      ))}
    </div>
  );
}; 