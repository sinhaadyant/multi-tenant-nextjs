import React from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SummaryData {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalAuditEvents: number;
  userGrowth: number;
  auditGrowth: number;
}

interface Permissions {
  canViewUsers: boolean;
  canViewRoles: boolean;
  canViewAudit: boolean;
  canViewReports: boolean;
}

interface TenantDashboardOverviewCardsProps {
  summary: SummaryData;
  selectedRange: string;
  isLoading: boolean;
  permissions: Permissions;
}

// Format number with commas
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

// Format percentage
const formatPercentage = (num: number) => {
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
};

export const TenantDashboardOverviewCards: React.FC<TenantDashboardOverviewCardsProps> = ({ 
  summary, 
  selectedRange, 
  isLoading,
  permissions 
}) => {
  const router = useRouter();

  const statsCards = [
    {
      title: 'Total Users',
      value: summary.totalUsers,
      change: summary.userGrowth,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      permission: permissions.canViewUsers,
      href: '/users'
    },
    {
      title: 'Active Users',
      value: summary.activeUsers,
      change: 0, // No growth metric for active users
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      permission: permissions.canViewUsers,
      href: '/users'
    },
    {
      title: 'Total Roles',
      value: summary.totalRoles,
      change: 0, // No growth metric for roles
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      permission: permissions.canViewRoles,
      href: '/roles'
    },
    {
      title: 'Audit Events',
      value: summary.totalAuditEvents,
      change: summary.auditGrowth,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      permission: permissions.canViewAudit,
      href: '/audit'
    },
  ];

  // Debug permissions in development
  if (process.env.NODE_ENV === 'development') {
    console.log('TenantDashboardOverviewCards - Permissions received:', permissions);
    console.log('TenantDashboardOverviewCards - Stats cards:', statsCards.map(card => ({
      title: card.title,
      permission: card.permission
    })));
  }

  // Filter cards based on permissions
  const visibleCards = statsCards.filter(stat => stat.permission);

  // If no cards are visible, show a message
  if (visibleCards.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Dashboard Access
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to view any dashboard statistics. Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {visibleCards.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => stat.href && router.push(stat.href)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{stat.title}</h3>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(stat.value || 0)}
          </div>
          {stat.change !== 0 && (
            <div className="flex items-center mt-2">
              {stat.change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(stat.change)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 