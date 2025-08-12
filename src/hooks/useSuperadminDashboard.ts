import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';


interface DashboardData {
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
  charts: {
    userSignups: Array<{ date: string; count: number }>;
    tenantActivity: Array<{ date: string; count: number }>;
    roleDistribution: Array<{ role: string; count: number }>;
    tenantPlanDistribution: Array<{ plan: string; count: number }>;
  };
  systemHealth: {
    databaseConnections: number;
    activeSessions: number;
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
  recentActivity: {
    auditLogs: Array<{
      id: string;
      action: string;
      createdAt: string;
      tenant?: { name: string; slug: string } | null;
      user?: { email: string; name: string } | null;
      superAdmin?: { email: string; name: string } | null;
    }>;
  };
  topTenants: Array<{
    id: string;
    name: string;
    slug: string;
    userCount: number;
    plan: string;
  }>;
}

interface UseSuperadminDashboardReturn {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedRange: string;
  setSelectedRange: (range: string) => void;
  refetch: () => void;
  forceRefresh: () => void;
}

const fetchDashboardData = async (range: string): Promise<DashboardData> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Fetching dashboard data for range:', range);
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    const response = await api.get(`/superadmin/dashboard?range=${range}&_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.data.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Dashboard data fetched successfully');
      }
      

      
      return response.data?.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch dashboard data');
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Dashboard data fetch error:', error);
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to view this data.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
};

export const useSuperadminDashboard = (): UseSuperadminDashboardReturn => {
  const [selectedRange, setSelectedRange] = useState('7d');
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['superadmin-dashboard', selectedRange],
    queryFn: () => fetchDashboardData(selectedRange),
    staleTime: 30 * 1000, // 30 seconds - much shorter to ensure fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication required')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Add a small delay to allow auth state to settle after login
    enabled: true,
  });

  const handleRangeChange = useCallback((range: string) => {
    setSelectedRange(range);
  }, []);

  const forceRefresh = useCallback(() => {
    // Invalidate and refetch to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['superadmin-dashboard'] });
    refetch();
  }, [queryClient, refetch]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    selectedRange,
    setSelectedRange: handleRangeChange,
    refetch,
    forceRefresh
  };
}; 