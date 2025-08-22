import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface InsertSampleDataParams {
  insertTenants?: boolean;
  insertUsers?: boolean;
  tenantsCount?: number;
  usersPerTenant?: number;
  timeRange?: 'today' | 'last15days' | 'last30days' | 'last90days';
  backfillDays?: number;
}

export interface ClearDataParams {
  clearTenants?: boolean;
  clearUsers?: boolean;
  clearAuditLogs?: boolean;
  clearAll?: boolean;
  preserveSystemData?: boolean;
}

export interface DataCounts {
  tenants: number;
  users: number;
  auditLogs: number;
}

export interface InsertSampleDataResult {
  results: {
    tenants: { created: number; errors: number };
    users: { created: number; errors: number };
  };
  summary: {
    totalTenantsCreated: number;
    totalUsersCreated: number;
    totalErrors: number;
    timeRange: string;
    backfillDays: number;
  };
}

export interface ClearDataResult {
  results: {
    tenants: { deleted: number; errors: number };
    users: { deleted: number; errors: number };
    auditLogs: { deleted: number; errors: number };
  };
  summary: {
    totalTenantsDeleted: number;
    totalUsersDeleted: number;
    totalAuditLogsDeleted: number;
    totalErrors: number;
    countsBefore: DataCounts;
    countsAfter: DataCounts;
  };
}

// Hook to get data counts
export const useDataCounts = () => {
  return useQuery({
    queryKey: ['data-counts'],
    queryFn: async (): Promise<{ data: { counts: DataCounts } }> => {
      const response = await api.get('/superadmin/data-management/clear');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

// Hook to insert sample data
export const useInsertSampleData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InsertSampleDataParams): Promise<{ data: InsertSampleDataResult }> => {
      const response = await api.post('/superadmin/data-management/insert', params);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['tenants'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['data-counts'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'], exact: false });
    },
  });
};

// Hook to clear data
export const useClearData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ClearDataParams): Promise<{ data: ClearDataResult }> => {
      const response = await api.post('/superadmin/data-management/clear', params);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['tenants'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['data-counts'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'], exact: false });
    },
  });
};
