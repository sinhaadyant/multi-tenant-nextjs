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
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: 'Total Tenants',
      value: summary.totalTenants,
      icon: <Building2 className="w-6 h-6" />,
      growth: summary.growthMetrics?.tenantGrowth,
      growthLabel: 'from last month',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Users',
      value: summary.totalUsers,
      icon: <Users className="w-6 h-6" />,
      growth: summary.growthMetrics?.userGrowth,
      growthLabel: 'from last month',
      bgColor: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Super Admins',
      value: summary.totalSuperAdmins,
      icon: <Shield className="w-6 h-6" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Active Tenants',
      value: summary.activeTenants,
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