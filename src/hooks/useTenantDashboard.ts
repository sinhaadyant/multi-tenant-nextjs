import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers?: number;
  activeUsersChange?: number;
  totalTickets?: number;
  openTickets?: number;
  systemHealth: string;
  totalRoles?: number;
  systemHealthChange?: number;
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
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalActivities: number;
    systemHealth: string;
  };
  charts: {
    userActivity: Array<{
      date: string;
      users: number;
      activities: number;
    }>;
    systemUsage: Array<{
      date: string;
      cpu: number;
      memory: number;
      storage: number;
    }>;
  };
  recentActivity: DashboardActivity[];
  userPermissions: Array<{
    id: string;
    name: string;
    action: string;
  }>;
  systemHealth: {
    uptime: number;
    activeSessions: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

// API function
const fetchDashboardData = async (tenantSlug: string): Promise<DashboardData> => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard`);
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