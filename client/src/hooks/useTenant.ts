import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCurrentTenant,
  setAvailableTenants,
  setTenantLoading,
  setTenantError,
  clearTenantError,
} from "@/store/slices/tenantSlice";
import api from "@/lib/axios";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  login_restrictions: {
    max_devices: number;
    allow_multiple_sessions: boolean;
    session_timeout: number;
  };
  created_at: string;
  updated_at: string;
}

interface TenantsResponse {
  success: boolean;
  message: string;
  data: Tenant[];
}

export const useTenant = () => {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(state => state.tenant);

  const fetchTenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      dispatch(setTenantLoading(true));
      try {
        const response = await api.get<TenantsResponse>("/tenants");
        if (response.data.success) {
          dispatch(setAvailableTenants(response.data.data));
          return response.data.data;
        } else {
          throw new Error(response.data.message);
        }
      } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        dispatch(setTenantError(message));
        throw error;
      } finally {
        dispatch(setTenantLoading(false));
      }
    },
    enabled: false, // Don't auto-fetch, call manually
  });

  const setCurrentTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data;
    },
    onSuccess: data => {
      if (data.success) {
        dispatch(setCurrentTenant(data.data));
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      dispatch(setTenantError(message));
    },
  });

  const clearCurrentTenantMutation = useMutation({
    mutationFn: async () => {
      // Clear current tenant
      dispatch(setCurrentTenant(null));
    },
  });

  return {
    // State
    currentTenant: tenant.currentTenant,
    availableTenants: tenant.availableTenants,
    isLoading: tenant.isLoading,
    error: tenant.error,

    // Actions
    fetchTenants: fetchTenantsQuery.refetch,
    setCurrentTenant: setCurrentTenantMutation.mutate,
    clearCurrentTenant: clearCurrentTenantMutation.mutate,
    clearError: () => dispatch(clearTenantError()),

    // Loading states
    isFetchingTenants: fetchTenantsQuery.isFetching,
    isSettingTenant: setCurrentTenantMutation.isPending,
  };
};
