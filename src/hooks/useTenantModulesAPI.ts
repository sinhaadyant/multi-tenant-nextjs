import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  path: string;
  icon: string;
  description: string;
  version: string;
  minVersion: string;
  maxVersion: string;
  releaseNotes: string;
  isVisible: boolean;
  orderIndex: number;
  permissions: any[];
  childModules: any[];
  // Tenant-specific settings
  isEnabled: boolean;
  isVisibleInTenant: boolean;
  tenantVersion: string | null;
  tenantSettings: any;
  enabledAt: string | null;
  disabledAt: string | null;
  enabledBy: string | null;
  disabledBy: string | null;
  analytics?: {
    lastAccessedAt: string | null;
    accessCount: number;
  };
}

export interface ModuleAction {
  action: 'enable' | 'disable' | 'update_settings' | 'update_version';
  moduleKey: string;
  settings?: any;
  version?: string;
}

export const useTenantModulesAPI = () => {
  const { tenantSlug } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get modules list
  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
    refetch: refetchModules
  } = useQuery({
    queryKey: ['tenant-modules', tenantSlug],
    queryFn: async () => {
      const response = await api.get(`/tenant/${tenantSlug}/modules`);
      return response.data;
    },
    enabled: !!tenantSlug
  });

  // Manage modules (enable/disable/update)
  const manageModuleMutation = useMutation({
    mutationFn: async (actionData: ModuleAction) => {
      const response = await api.post(`/tenant/${tenantSlug}/modules`, actionData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const action = variables.action;
      let message = '';
      
      switch (action) {
        case 'enable':
          message = 'Module enabled successfully';
          break;
        case 'disable':
          message = 'Module disabled successfully';
          break;
        case 'update_settings':
          message = 'Module settings updated successfully';
          break;
        case 'update_version':
          message = 'Module version updated successfully';
          break;
        default:
          message = 'Module updated successfully';
      }
      
      showToast(message, 'success');
      queryClient.invalidateQueries({ queryKey: ['tenant-modules', tenantSlug] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to manage module', 'error');
    }
  });

  // Enable module
  const enableModule = (moduleKey: string) => {
    return manageModuleMutation.mutate({
      action: 'enable',
      moduleKey
    });
  };

  // Disable module
  const disableModule = (moduleKey: string) => {
    return manageModuleMutation.mutate({
      action: 'disable',
      moduleKey
    });
  };

  // Update module settings
  const updateModuleSettings = (moduleKey: string, settings: any) => {
    return manageModuleMutation.mutate({
      action: 'update_settings',
      moduleKey,
      settings
    });
  };

  // Update module version
  const updateModuleVersion = (moduleKey: string, version: string) => {
    return manageModuleMutation.mutate({
      action: 'update_version',
      moduleKey,
      version
    });
  };

  return {
    // Data
    modules: modulesData?.modules || [],
    permissions: modulesData?.permissions,
    
    // Loading states
    modulesLoading,
    manageModuleLoading: manageModuleMutation.isPending,
    
    // Error states
    modulesError,
    manageModuleError: manageModuleMutation.error,
    
    // Actions
    enableModule,
    disableModule,
    updateModuleSettings,
    updateModuleVersion,
    refetchModules,
    
    // Computed values
    enabledModules: modulesData?.modules?.filter((m: Module) => m.isEnabled) || [],
    disabledModules: modulesData?.modules?.filter((m: Module) => !m.isEnabled) || [],
    totalModules: modulesData?.modules?.length || 0,
    activeModules: modulesData?.modules?.filter((m: Module) => m.analytics?.accessCount > 0).length || 0
  };
};
