import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface TenantReport {
  id: string;
  type: string;
  name: string;
  data: string;
  status?: string;
  tenantId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface TenantReportsOverview {
  totalReports: number;
  reportsThisMonth: number;
  statusCounts: {
    completed: number;
    generating: number;
    failed: number;
  };
  typeCounts: {
    user_activity: number;
    role_summary: number;
    login_history: number;
    audit_logs: number;
    system_health: number;
    other: number;
  };
  recentReports: TenantReport[];
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalAuditLogs: number;
  loginTrends: number;
  systemHealth: number;
}

export interface TenantReportsResponse {
  reports: TenantReport[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GenerateTenantReportData {
  reportType: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
}

export interface TenantReportsFilters {
  page?: number;
  limit?: number;
  search?: string;
  reportType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'type' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Fetch tenant reports overview
export const useTenantReportsOverview = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-reports-overview', tenantSlug],
    queryFn: async (): Promise<{ overview: TenantReportsOverview; tenantStats: TenantStats }> => {
      const response = await api.get(`/tenant/${tenantSlug}/reports/overview`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tenantSlug,
  });
};

// Fetch tenant reports list
export const useTenantReports = (tenantSlug: string, filters: TenantReportsFilters = {}) => {
  return useQuery({
    queryKey: ['tenant-reports', tenantSlug, filters],
    queryFn: async (): Promise<TenantReportsResponse> => {
      const params = new URLSearchParams();
      
      // Map filter names to API expected parameters
      const apiParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        reportType: filters.reportType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/reports?${params.toString()}`);
      
      const data = response.data.data;
      
      if (!data) {
        throw new Error('Invalid response structure from tenant reports API');
      }
      
      return {
        reports: data.reports || [],
        pagination: data.pagination || {
          page: 1,
          limit: 10,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!tenantSlug,
  });
};

// Generate new tenant report
export const useGenerateTenantReport = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateTenantReportData): Promise<{ report: TenantReport; message: string }> => {
      const response = await api.post(`/tenant/${tenantSlug}/reports`, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Report generation initiated successfully');
      // Invalidate reports cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['tenant-reports'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['tenant-reports-overview'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to generate report';
      toast.error(errorMessage);
    },
  });
};

// Download tenant report
export const useDownloadTenantReport = (tenantSlug: string) => {
  return useMutation({
    mutationFn: async (reportId: string): Promise<Blob> => {
      const response = await api.get(`/tenant/${tenantSlug}/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, reportId) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tenant-report-${reportId}.${data.type.includes('csv') ? 'csv' : 'json'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to download report';
      toast.error(errorMessage);
    },
  });
};

// Export tenant reports list
export const useExportTenantReports = (tenantSlug: string) => {
  return useMutation({
    mutationFn: async (filters: TenantReportsFilters & { format: 'csv' | 'excel' | 'pdf' }): Promise<Blob> => {
      const params = new URLSearchParams();
      
      const apiParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        reportType: filters.reportType,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        format: filters.format
      };
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, filters) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tenant-reports-export-${new Date().toISOString().split('T')[0]}.${filters.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Reports exported successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to export reports';
      toast.error(errorMessage);
    },
  });
};
