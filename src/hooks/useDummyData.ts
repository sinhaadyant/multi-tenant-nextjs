import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface DummyDataStatus {
  currentData: {
    users: number;
    tickets: number;
    auditLogs: number;
    notifications: number;
  };
}

export interface GenerateDummyDataParams {
  dataRange: '7' | '30' | '90';
  userCount: number;
  tenantCount?: number;
  includeSupportTickets: boolean;
}

export interface GeneratedData {
  users: number;
  auditLogs: number;
  notifications: number;
  tickets: number;
}

export interface ClearedData {
  users: number;
  tickets: number;
  auditLogs: number;
  notifications: number;
}

// Fetch dummy data status
export const useDummyDataStatus = () => {
  return useQuery({
    queryKey: ['dummy-data-status'],
    queryFn: async (): Promise<DummyDataStatus> => {
      const response = await api.get('/tenant/dummy-data');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Generate dummy data
export const useGenerateDummyData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateDummyDataParams): Promise<{ message: string; generated: GeneratedData }> => {
      const response = await api.post('/tenant/dummy-data', params);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate status cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['dummy-data-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to generate dummy data';
      toast.error(errorMessage);
    },
  });
};

// Clear all data
export const useClearAllData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ message: string; cleared: ClearedData }> => {
      const response = await api.delete('/tenant/dummy-data', {
        data: { confirm: true }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate status cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['dummy-data-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to clear data';
      toast.error(errorMessage);
    },
  });
};

// Download database backup
export const useDownloadBackup = () => {
  return useMutation({
    mutationFn: async (excludeAuditLogs: boolean = false): Promise<Blob> => {
      const response = await api.post('/tenant/backup', { excludeAuditLogs }, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, excludeAuditLogs) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `tenant_backup_${timestamp}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Database backup downloaded successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to download backup';
      toast.error(errorMessage);
    },
  });
}; 