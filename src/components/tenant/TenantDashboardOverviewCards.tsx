import React from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Clock,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface SummaryData {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  systemHealth: string;
}

interface StatsData {
  users?: {
    total: number;
    active24h: number;
    active7d: number;
    new24h: number;
    new7d: number;
    growth24h: number;
    growth7d: number;
  };
  activities?: {
    total24h: number;
    total7d: number;
    growth24h: number;
  };
  system?: {
    uptime: number;
    activeSessions: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface Props {
  summary: SummaryData;
  stats?: StatsData;
  loading?: boolean;
}

export const TenantDashboardOverviewCards: React.FC<Props> = ({ 
  summary, 
  stats, 
  loading = false 
}) => {
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <TrendingUp className="h-4 w-4 text-gray-400" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const cards = [
    {
      title: 'Total Users',
      value: summary.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: stats?.users?.growth7d || 0,
      changeLabel: 'vs last week',
      loading: loading
    },
    {
      title: 'Active Users',
      value: summary.activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      change: stats?.users?.growth24h || 0,
      changeLabel: 'vs yesterday',
      loading: loading
    },
    {
      title: 'New Users',
      value: stats?.users?.new7d || 0,
      icon: UserPlus,
      color: 'bg-purple-500',
      change: stats?.users?.growth7d || 0,
      changeLabel: 'vs last week',
      loading: loading
    },
    {
      title: 'Total Activities',
      value: summary.totalActivities,
      icon: Activity,
      color: 'bg-orange-500',
      change: stats?.activities?.growth24h || 0,
      changeLabel: 'vs yesterday',
      loading: loading
    },
    {
      title: 'System Health',
      value: summary.systemHealth,
      icon: Shield,
      color: 'bg-emerald-500',
      change: 0,
      changeLabel: 'status',
      loading: loading,
      isText: true
    },
    {
      title: 'Active Sessions',
      value: stats?.system?.activeSessions || 0,
      icon: Clock,
      color: 'bg-indigo-500',
      change: 0,
      changeLabel: 'current',
      loading: loading
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <div className="mt-2 flex items-baseline">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <>
                    <p className={`text-2xl font-semibold text-gray-900 dark:text-white ${
                      card.isText ? 'text-sm' : ''
                    }`}>
                      {card.isText ? card.value : card.value.toLocaleString()}
                    </p>
                    {card.change !== 0 && (
                      <div className="ml-2 flex items-center">
                        {getGrowthIcon(card.change)}
                        <span className={`ml-1 text-sm font-medium ${getGrowthColor(card.change)}`}>
                          {Math.abs(card.change).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {!loading && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {card.changeLabel}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
              <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 