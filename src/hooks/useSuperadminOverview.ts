import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface SummaryMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  systemHealth: number;
  alertCount: number;
}

export interface TrendData {
  date: string;
  tenants: number;
  users: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  owner: { name: string; email: string };
  userCount: number;
}

export interface UserActivity {
  id: string;
  actor: { name: string; email: string };
  action: string;
  affectedTenant: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TopTenant {
  id: string;
  name: string;
  activity: number;
  userCount: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

export interface SuperadminOverview {
  summary: SummaryMetrics;
  trends: TrendData[];
  recentTenants: Tenant[];
  recentActivity: UserActivity[];
  topTenants: TopTenant[];
  roleDistribution: RoleDistribution[];
  lastUpdated: string;
}

export const useSuperadminOverview = () => {
  const [data, setData] = useState<SuperadminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/superadmin/dashboard/overview');
      
      if (response.data.success) {
        setData(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch overview data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}; 