import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  activeUsersChange: number;
  totalTickets: number;
  openTickets: number;
  systemHealth: string;
  totalRoles: number;
  systemHealthChange: number;
}

export interface DashboardActivity {
  id: string;
  description: string;
  timestamp: Date;
  type: string;
  userId?: string;
  userName?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: DashboardActivity[];
}

// API function
const fetchDashboardData = async (tenantSlug: string): Promise<DashboardData> => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard/stats`);
  return response.data;
};

// React Query hook
export const useTenantDashboard = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-dashboard', tenantSlug],
    queryFn: () => fetchDashboardData(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 0, // No caching
    gcTime: 0, // No caching
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}; 