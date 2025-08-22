import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface BackupOptions {
  includeTenants: boolean;
  includeUsers: boolean;
  includeNotifications: boolean;
  includeAuditLogs: boolean;
  includeSupportTickets: boolean;
  includeSystemSettings: boolean;
  excludeSensitiveData: boolean;
}

export interface ImportOptions {
  importTenants: boolean;
  importUsers: boolean;
  importNotifications: boolean;
  importSupportTickets: boolean;
  importSystemSettings: boolean;
  skipDuplicates: boolean;
  validateData: boolean;
}

export interface BackupHistoryItem {
  id: string;
  filename: string;
  status: 'completed' | 'failed' | 'processing';
  createdAt: string;
  fileSize: number;
  duration: number;
  description?: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

export interface BackupHistoryResponse {
  backups: BackupHistoryItem[];
  totalCount: number;
  lastBackupDate?: string;
  totalSize: number;
}

// Create backup
export const useBackupData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: BackupOptions): Promise<any> => {
      const response = await api.post('/superadmin/backup', options, {
        responseType: 'blob'
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 useBackupData: Backup created successfully, invalidating cache...');
      }
      
      // Create download link for the backup file
      const blob = new Blob([data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Backup created and downloaded successfully');
      // Invalidate backup history cache
      queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 useBackupData: Cache invalidation completed');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create backup';
      toast.error(errorMessage);
    },
  });
};

// Get backup history
export const useBackupHistory = () => {
  return useQuery({
    queryKey: ['backupHistory'],
    queryFn: async (): Promise<BackupHistoryResponse> => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 useBackupHistory: Making API call...');
        }
        
        const response = await api.get('/superadmin/backup/history');
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 useBackupHistory: API Response:', response.data);
        }
        
        // Check if response and response.data exist
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        
        // Check if it's an error response
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch backup history');
        }
        
        // Return the data property from the success response
        const result = response.data.data || response.data;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 useBackupHistory: Returning data:', result);
        }
        
        return result;
      } catch (error: any) {
        // Handle axios errors
        if (error.response) {
          const errorMessage = error.response.data?.message || 'Failed to fetch backup history';
          throw new Error(errorMessage);
        }
        
        // Handle network errors
        if (error.request) {
          throw new Error('Network error. Please check your connection.');
        }
        
        // Handle other errors
        throw new Error(error.message || 'An unexpected error occurred');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Import data
export const useImportData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, options }: { file: File; options: ImportOptions }): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const response = await api.post('/superadmin/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Data imported successfully');
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['tenants'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to import data';
      toast.error(errorMessage);
    },
  });
};

// Delete backup
export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backupId: string): Promise<any> => {
      const response = await api.delete(`/superadmin/backup/${backupId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Backup deleted successfully');
      // Invalidate backup history cache
      queryClient.invalidateQueries({ queryKey: ['backupHistory'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete backup';
      toast.error(errorMessage);
    },
  });
}; 