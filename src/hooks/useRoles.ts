import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
    module: string;
    action: string;
  }>;
}

export interface RolesResponse {
  roles: Role[];
}

// Fetch all roles
export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<RolesResponse> => {
      const response = await api.get('/superadmin/roles');
      return response.data.data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
