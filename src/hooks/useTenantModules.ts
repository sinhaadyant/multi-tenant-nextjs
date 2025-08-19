import { useState, useEffect } from 'react';
import { useReduxAuth } from './useReduxAuth';

export interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  path?: string;
  icon?: string;
  description?: string;
  version?: string;
  minVersion?: string;
  maxVersion?: string;
  releaseNotes?: string;
  isVisible: boolean;
  orderIndex: number;
  permissions: any[];
  childModules: Module[];
  // Tenant-specific settings
  isEnabled: boolean;
  isVisibleInTenant: boolean;
  tenantVersion?: string;
  tenantSettings?: any;
  enabledAt?: string;
  disabledAt?: string;
  enabledBy?: string;
  disabledBy?: string;
  analytics?: {
    lastAccessedAt?: string;
    accessCount: number;
  };
}

export interface ModulePermissions {
  canViewModules: boolean;
  canEnableDisableModules: boolean;
  canManageVersions: boolean;
  canViewAnalytics: boolean;
}

export interface ModulesResponse {
  success: boolean;
  data: {
    modules: Module[];
    permissions: ModulePermissions;
  };
}

export const useTenantModules = (tenantSlug: string) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<ModulePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useReduxAuth();

  useEffect(() => {
    const fetchModules = async () => {
      if (!tenantSlug || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tenant/${tenantSlug}/modules`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch modules: ${response.status}`);
        }

        const data: ModulesResponse = await response.json();
        
        if (data.success) {
          setModules(data.data.modules);
          setPermissions(data.data.permissions);
        } else {
          throw new Error('Failed to fetch modules');
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [tenantSlug, token]);

  return {
    modules,
    permissions,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Trigger refetch by updating dependencies
    }
  };
};
