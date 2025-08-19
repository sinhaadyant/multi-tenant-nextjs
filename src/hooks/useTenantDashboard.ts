import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

// Types
export interface DashboardStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalRoles: number;
    totalAuditEvents: number;
    totalReports: number;
    totalNotifications: number;
    userGrowth: number;
    auditGrowth: number;
  };
  charts?: {
    userActivity?: Array<{ date: string; users: number; activities: number }>;
    systemUsage?: Array<{ date: string; cpu: number; memory: number; storage: number }>;
    roleDistribution?: Array<{ role: string; count: number }>;
    userGrowth?: Array<{ date: string; count: number }>;
  };
  systemHealth: {
    overall: {
      score: number;
      status: 'healthy' | 'degraded' | 'critical';
      lastChecked: string;
    };
    metrics: {
      activeSessions: number;
      databaseConnections: number;
      recentErrors: number;
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
    };
    uptime: {
      uptime: number;
      lastRestart: string;
    };
    services: Array<{
      name: string;
      status: 'operational' | 'degraded' | 'down';
      responseTime: number;
      uptime: number;
    }>;
  };
  recentActivity: Array<{
    id: string;
    type: 'audit' | 'user' | 'system';
    action: string;
    description: string;
    timestamp: string;
    user: string;
    severity: 'error' | 'warning' | 'info';
    metadata?: any;
  }>;
  permissions: {
    canViewUsers: boolean;
    canViewRoles: boolean;
    canViewAudit: boolean;
    canViewReports: boolean;
    canViewNotifications: boolean;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'audit' | 'user' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user: string;
  severity: 'error' | 'warning' | 'info';
  metadata?: any;
}

export interface DashboardData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
  };
  stats: DashboardStats;
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
}

// API functions
const fetchDashboardStats = async (tenantSlug: string, range: string = '7d'): Promise<DashboardStats> => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard/stats?range=${range}`);
  return response.data.data;
};

const fetchSystemHealth = async (tenantSlug: string) => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard/system-health`);
  return response.data.data;
};

const fetchRecentActivity = async (tenantSlug: string, limit: number = 10, type: string = 'all') => {
  const response = await api.get(`/tenant/${tenantSlug}/dashboard/activity?limit=${limit}&type=${type}`);
  return response.data.data;
};

// React Query hooks
export const useTenantDashboardStats = (tenantSlug: string, range: string = '7d') => {
  return useQuery({
    queryKey: ['tenant-dashboard-stats', tenantSlug, range],
    queryFn: () => fetchDashboardStats(tenantSlug, range),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useTenantSystemHealth = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-system-health', tenantSlug],
    queryFn: () => fetchSystemHealth(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useTenantRecentActivity = (tenantSlug: string, limit: number = 10, type: string = 'all') => {
  return useQuery({
    queryKey: ['tenant-recent-activity', tenantSlug, limit, type],
    queryFn: () => fetchRecentActivity(tenantSlug, limit, type),
    enabled: !!tenantSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Main dashboard hook that combines all data
export const useTenantDashboard = (range: string = '7d') => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = useState(range);

  // Fetch all dashboard data
  const statsQuery = useTenantDashboardStats(tenantSlug, selectedRange);
  const systemHealthQuery = useTenantSystemHealth(tenantSlug);
  const activityQuery = useTenantRecentActivity(tenantSlug, 10, 'all');

  // Refresh function
  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard-stats', tenantSlug] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-system-health', tenantSlug] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-recent-activity', tenantSlug] })
    ]);
  };

  // Auto-refresh system health every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['tenant-system-health', tenantSlug] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient, tenantSlug]);

  // Combine loading states
  const isLoading = statsQuery.isLoading || systemHealthQuery.isLoading || activityQuery.isLoading;
  const isError = statsQuery.isError || systemHealthQuery.isError || activityQuery.isError;
  const error = statsQuery.error || systemHealthQuery.error || activityQuery.error;

  // Combine data
  const data = {
    stats: statsQuery.data,
    systemHealth: systemHealthQuery.data,
    recentActivity: activityQuery.data,
    isLoading,
    isError,
    error,
    selectedRange,
    setSelectedRange,
    refreshDashboard
  };

  return data;
};

// Legacy hook for backward compatibility
export const useTenantDashboardLegacy = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-dashboard', tenantSlug],
    queryFn: async () => {
      const [stats, systemHealth, activity] = await Promise.all([
        fetchDashboardStats(tenantSlug),
        fetchSystemHealth(tenantSlug),
        fetchRecentActivity(tenantSlug)
      ]);

      return {
        stats,
        systemHealth,
        recentActivity: activity
      };
    },
    enabled: !!tenantSlug,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}; 