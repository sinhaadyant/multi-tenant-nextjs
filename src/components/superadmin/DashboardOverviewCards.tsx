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

interface DashboardOverviewCardsProps {
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue?: number;
    monthlyGrowth?: number;
    userGrowth?: number;
    tenantGrowth?: number;
  };
  selectedRange?: string;
  isLoading?: boolean;
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({ 
  summary, 
  selectedRange = '7d',
  isLoading = false 
}) => {
  if (isLoading) {
    return <CountCardsGridSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CountCard
        title="Total Tenants"
        value={summary.totalTenants}
        icon={Building2}
        growth={summary.tenantGrowth}
        growthLabel="vs last month"
        bgColor="bg-blue-100 dark:bg-blue-900"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      
      <CountCard
        title="Active Tenants"
        value={summary.activeTenants}
        icon={Shield}
        growth={summary.tenantGrowth}
        growthLabel="vs last month"
        bgColor="bg-green-100 dark:bg-green-900"
        iconColor="text-green-600 dark:text-green-400"
      />
      
      <CountCard
        title="Total Users"
        value={summary.totalUsers}
        icon={Users}
        growth={summary.userGrowth}
        growthLabel="vs last month"
        bgColor="bg-purple-100 dark:bg-purple-900"
        iconColor="text-purple-600 dark:text-purple-400"
      />
      
      <CountCard
        title="Active Users"
        value={summary.activeUsers}
        icon={Activity}
        growth={summary.userGrowth}
        growthLabel="vs last month"
        bgColor="bg-orange-100 dark:bg-orange-900"
        iconColor="text-orange-600 dark:text-orange-400"
      />
    </div>
  );
}; 