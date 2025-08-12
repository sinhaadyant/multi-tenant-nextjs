import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export interface AuditLog {
  id: string;
  action: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
  superAdmin?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userEmail?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogStats {
  total: number;
  actionBreakdown: Array<{
    action: string;
    count: number;
  }>;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  stats: AuditLogStats;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export const useTenantAuditLogs = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalPages: 1,
    totalRecords: 0
  });

  const fetchAuditLogs = useCallback(async (newFilters?: Partial<AuditLogFilters>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedFilters = { ...filters, ...newFilters };
      const searchParams = new URLSearchParams();

      // Add filters to search params
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Fetching tenant audit logs with filters:', updatedFilters);
      }

      const response = await api.get(`/tenant/${tenantSlug}/audit-logs?${searchParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch audit logs');
      }

      const data: AuditLogsResponse = response.data;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Tenant audit logs fetched successfully:', data.auditLogs.length, 'logs');
      }
      
      setAuditLogs(data.auditLogs);
      setStats(data.stats);
      setPagination(data.pagination);
      setFilters(updatedFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching tenant audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, tenantSlug]);

  const updateFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to first page when filters change
  }, []);

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const exportLogs = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      searchParams.append('format', format);

      const response = await api.get(`/tenant/${tenantSlug}/audit-logs/export?${searchParams.toString()}`, {
        responseType: 'blob'
      });

      if (!response.data) {
        throw new Error('Failed to export audit logs');
      }

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${tenantSlug}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
      console.error('Error exporting tenant audit logs:', err);
    }
  }, [filters, tenantSlug]);

  // Real-time updates using polling
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if we're on the first page and no filters are applied
      if (filters.page === 1 && !filters.userEmail && !filters.actionType) {
        fetchAuditLogs();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchAuditLogs, filters]);

  // Initial fetch
  useEffect(() => {
    if (tenantSlug) {
      fetchAuditLogs();
    }
  }, [tenantSlug]);

  return {
    auditLogs,
    stats,
    loading,
    error,
    filters,
    pagination,
    fetchAuditLogs,
    updateFilters,
    goToPage,
    exportLogs,
  };
}; 