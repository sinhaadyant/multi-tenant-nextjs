import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Report {
  id: string;
  type: string;
  name: string;
  data: string;
  status?: string;
  tenantId?: string;
  superAdminId?: string;
  createdAt: string;
  updatedAt: string;
  superAdmin?: {
    name: string;
    email: string;
  };
}

export interface ReportsOverview {
  totalReports: number;
  reportsThisMonth: number;
  statusCounts: {
    completed: number;
    generating: number;
    failed: number;
  };
  typeCounts: {
    user_activity: number;
    tenant_summary: number;
    login_history: number;
    audit_logs: number;
    system_health: number;
    other: number;
  };
  recentReports: Report[];
}

export interface PlatformStats {
  totalUsers: number;
  activeTenants: number;
  totalNotifications: number;
  loginTrends: number;
  auditLogsCount: number;
}

export interface ReportsResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GenerateReportData {
  reportType: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  tenantId?: string;
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
}

export interface ReportsFilters {
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

// Fetch reports overview
export const useReportsOverview = () => {
  return useQuery({
    queryKey: ['reports-overview'],
    queryFn: async (): Promise<{ overview: ReportsOverview; platformStats: PlatformStats }> => {
      const response = await api.get('/superadmin/reports/overview');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch reports list
export const useReports = (filters: ReportsFilters = {}) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async (): Promise<ReportsResponse> => {
      const params = new URLSearchParams();
      
      // Map filter names to API expected parameters
      const apiParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        reportType: filters.reportType, // API expects reportType, not type
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

      const response = await api.get(`/superadmin/reports?${params.toString()}`);
      
      // The API returns data wrapped in createSuccessResponse format
      const data = response.data.data;
      
      if (!data) {
        throw new Error('Invalid response structure from reports API');
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
  });
};

// Generate new report
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateReportData): Promise<{ report: Report; message: string }> => {
      const response = await api.post('/superadmin/reports', data);
      return response.data.data;
    },
            onSuccess: (data) => {
          toast.success(data.message || 'Report generation initiated successfully');
          // Invalidate reports cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ['reports'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
        },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to generate report';
      toast.error(errorMessage);
    },
  });
};

// Download report
export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (reportId: string): Promise<Blob> => {
      const response = await api.get(`/superadmin/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, reportId) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.${data.type.includes('csv') ? 'csv' : 'json'}`);
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

// Export reports list
export const useExportReports = () => {
  return useMutation({
    mutationFn: async (filters: ReportsFilters & { format: 'csv' | 'excel' | 'pdf' }): Promise<Blob> => {
      const params = new URLSearchParams();
      
      // Map filter names to API expected parameters
      const apiParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        reportType: filters.reportType,
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

      const response = await api.get(`/superadmin/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, filters) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-export-${new Date().toISOString().split('T')[0]}.${filters.format}`);
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