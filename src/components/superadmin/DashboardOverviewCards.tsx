import React from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { CountCard } from '@/components/ui/CountCard';
import { CountCardsGridSkeleton } from '@/components/ui/CountCardSkeleton';
import { useTranslation } from 'react-i18next';

interface DashboardData {
  summary?: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers?: number;
    totalSuperAdmins?: number;
    growthMetrics?: {
      tenantGrowth: number;
      userGrowth: number;
      revenueGrowth?: number;
    };
  };
}

interface StatsData {
  summary?: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers?: number;
    tenantGrowth?: number;
    userGrowth?: number;
  };
}

interface DashboardOverviewCardsProps {
  data?: DashboardData;
  stats?: StatsData;
  selectedRange?: string;
  isLoading?: boolean;
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({ 
  data, 
  stats,
  selectedRange = '7d',
  isLoading = false 
}) => {
  const { t } = useTranslation('superadmin');

  if (isLoading) {
    return <CountCardsGridSkeleton count={4} />;
  }

  // Extract summary data from either data or stats
  const summary = data?.summary || stats?.summary;
  
  // Get values with proper fallbacks
  const totalTenants = summary?.totalTenants || 0;
  const activeTenants = summary?.activeTenants || 0;
  const totalUsers = summary?.totalUsers || 0;
  const activeUsers = summary?.activeUsers || totalUsers; // Fallback to totalUsers if activeUsers not available
  const tenantGrowth = summary?.growthMetrics?.tenantGrowth || summary?.tenantGrowth || 0;
  const userGrowth = summary?.growthMetrics?.userGrowth || summary?.userGrowth || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CountCard
        title={t('dashboard.stats.totalTenants')}
        value={totalTenants}
        icon={Building2}
        growth={tenantGrowth}
        growthLabel="vs last month"
        bgColor="bg-blue-100 dark:bg-blue-900"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      
      <CountCard
        title={t('dashboard.stats.activeTenants')}
        value={activeTenants}
        icon={Shield}
        growth={tenantGrowth}
        growthLabel="vs last month"
        bgColor="bg-green-100 dark:bg-green-900"
        iconColor="text-green-600 dark:text-green-400"
      />
      
      <CountCard
        title={t('dashboard.stats.totalUsers')}
        value={totalUsers}
        icon={Users}
        growth={userGrowth}
        growthLabel="vs last month"
        bgColor="bg-purple-100 dark:bg-purple-900"
        iconColor="text-purple-600 dark:text-purple-400"
      />
      
      <CountCard
        title={t('dashboard.stats.activeUsers')}
        value={activeUsers}
        icon={Activity}
        growth={userGrowth}
        growthLabel="vs last month"
        bgColor="bg-orange-100 dark:bg-orange-900"
        iconColor="text-orange-600 dark:text-orange-400"
      />
    </div>
  );
}; 