import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface RoleData {
  role: string;
  count: number;
  percentage: number;
}

export interface UserActivityData {
  active: number;
  inactive: number;
  total: number;
  activePercentage: number;
  inactivePercentage: number;
}

export interface LoginTrendData {
  month: string;
  logins: number;
  uniqueUsers: number;
}

export interface TenantChartsData {
  roleDistribution: RoleData[];
  userActivity: UserActivityData;
  loginTrends: LoginTrendData[];
}

// API function
const fetchChartsData = async (tenantSlug: string): Promise<TenantChartsData> => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard/charts`);
  return response.data;
};

// React Query hook
export const useTenantCharts = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-charts', tenantSlug],
    queryFn: () => fetchChartsData(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}; 