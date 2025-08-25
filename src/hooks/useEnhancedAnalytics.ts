import { useState, useEffect } from 'react';
import { useReduxAuth } from './useReduxAuth';
import api from '@/lib/api';

interface EnhancedChartData {
  userGrowth?: Array<{ date: string; count: number; active: number; new: number }>;
  roleDistribution?: Array<{ role: string; count: number }>;
  systemPerformance?: Array<{ date: string; responseTime: number; uptime: number; errors: number }>;
  securityEvents?: Array<{ date: string; failedLogins: number; suspiciousActivity: number; blockedAttempts: number }>;
}

interface UseEnhancedAnalyticsReturn {
  data: EnhancedChartData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useEnhancedAnalytics = (selectedRange: string = '7d'): UseEnhancedAnalyticsReturn => {
  const { tenant, isLoggedIn } = useReduxAuth();
  const [data, setData] = useState<EnhancedChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!tenant?.slug || !isLoggedIn) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/tenant/${tenant.slug}/dashboard/enhanced-analytics?range=${selectedRange}`);
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch enhanced analytics');
      }
    } catch (err: any) {
      console.error('Enhanced Analytics fetch error:', err);
      setError(err as Error);
      
      // Set fallback data if API fails
      setData({
        userGrowth: [],
        roleDistribution: [],
        systemPerformance: [],
        securityEvents: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.slug, isLoggedIn, selectedRange]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
