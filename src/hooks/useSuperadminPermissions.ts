import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface PermissionsResponse {
  permissions: Permission[];
}

// Fetch superadmin permissions (placeholder for now)
export const usePermissions = () => {
  return useQuery({
    queryKey: ['superadmin-permissions'],
    queryFn: async (): Promise<PermissionsResponse> => {
      // For now, return empty permissions to avoid errors
      return { permissions: [] };
    },
    retry: false,
  });
}; 
