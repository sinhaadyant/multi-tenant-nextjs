import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

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
  permissions: Permission[];
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

export interface Permission {
  id: string;
  name: string;
  description?: string;
  moduleKey: string;
  action: string;
  resource?: string;
  isActive: boolean;
}

export interface ModulePermissions {
  canViewModules: boolean;
  canEnableDisableModules: boolean;
  canManageVersions: boolean;
  canViewAnalytics: boolean;
}

export interface ModuleManagementState {
  modules: Module[];
  permissions: ModulePermissions;
  loading: boolean;
  error: string | null;
  selectedModules: string[];
  searchTerm: string;
  filterEnabled: boolean | null;
  includeAnalytics: boolean;
}

export interface ModuleAction {
  action: 'enable' | 'disable' | 'update_settings' | 'update_version';
  moduleKey: string;
  settings?: any;
  version?: string;
}

export const useModuleManagement = (tenantSlug: string) => {
  const [state, setState] = useState<ModuleManagementState>({
    modules: [],
    permissions: {
      canViewModules: false,
      canEnableDisableModules: false,
      canManageVersions: false,
      canViewAnalytics: false
    },
    loading: false,
    error: null,
    selectedModules: [],
    searchTerm: '',
    filterEnabled: null,
    includeAnalytics: false
  });

  // Fetch modules with permission checks
  const fetchModules = useCallback(async (includeAnalytics = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams();
      if (includeAnalytics) {
        params.append('includeAnalytics', 'true');
      }

      const response = await api.get(`/tenant/${tenantSlug}/modules?${params.toString()}`);
      
      if (response.data?.success) {
        setState(prev => ({
          ...prev,
          modules: response.data.modules,
          permissions: response.data.permissions,
          loading: false,
          includeAnalytics
        }));
      } else {
        throw new Error(response.data?.message || 'Failed to fetch modules');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch modules',
        loading: false
      }));
    }
  }, [tenantSlug]);

  // Perform module actions (enable/disable/update)
  const performModuleAction = useCallback(async (action: ModuleAction) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.post(`/tenant/${tenantSlug}/modules`, action);
      
      if (response.data?.success) {
        // Refresh modules to get updated state
        await fetchModules(state.includeAnalytics);
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to perform module action');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to perform module action',
        loading: false
      }));
      throw error;
    }
  }, [tenantSlug, fetchModules, state.includeAnalytics]);

  // Enable a module
  const enableModule = useCallback(async (moduleKey: string) => {
    return await performModuleAction({
      action: 'enable',
      moduleKey
    });
  }, [performModuleAction]);

  // Disable a module
  const disableModule = useCallback(async (moduleKey: string) => {
    return await performModuleAction({
      action: 'disable',
      moduleKey
    });
  }, [performModuleAction]);

  // Update module settings
  const updateModuleSettings = useCallback(async (moduleKey: string, settings: any) => {
    return await performModuleAction({
      action: 'update_settings',
      moduleKey,
      settings
    });
  }, [performModuleAction]);

  // Update module version
  const updateModuleVersion = useCallback(async (moduleKey: string, version: string) => {
    return await performModuleAction({
      action: 'update_version',
      moduleKey,
      version
    });
  }, [performModuleAction]);

  // Toggle module enabled state
  const toggleModule = useCallback(async (moduleKey: string) => {
    const module = state.modules.find(m => m.moduleKey === moduleKey);
    if (!module) return;

    if (module.isEnabled) {
      return await disableModule(moduleKey);
    } else {
      return await enableModule(moduleKey);
    }
  }, [state.modules, enableModule, disableModule]);

  // Bulk enable modules
  const bulkEnableModules = useCallback(async (moduleKeys: string[]) => {
    const results = [];
    for (const moduleKey of moduleKeys) {
      try {
        const result = await enableModule(moduleKey);
        results.push({ moduleKey, success: true, data: result });
      } catch (error: any) {
        results.push({ moduleKey, success: false, error: error.message });
      }
    }
    return results;
  }, [enableModule]);

  // Bulk disable modules
  const bulkDisableModules = useCallback(async (moduleKeys: string[]) => {
    const results = [];
    for (const moduleKey of moduleKeys) {
      try {
        const result = await disableModule(moduleKey);
        results.push({ moduleKey, success: true, data: result });
      } catch (error: any) {
        results.push({ moduleKey, success: false, error: error.message });
      }
    }
    return results;
  }, [disableModule]);

  // Filter modules based on search and filter criteria
  const filteredModules = useCallback(() => {
    let filtered = state.modules;

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(module =>
        module.moduleName.toLowerCase().includes(searchLower) ||
        module.description?.toLowerCase().includes(searchLower) ||
        module.moduleKey.toLowerCase().includes(searchLower)
      );
    }

    // Apply enabled/disabled filter
    if (state.filterEnabled !== null) {
      filtered = filtered.filter(module => module.isEnabled === state.filterEnabled);
    }

    return filtered;
  }, [state.modules, state.searchTerm, state.filterEnabled]);

  // Toggle module selection
  const toggleModuleSelection = useCallback((moduleKey: string) => {
    setState(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleKey)
        ? prev.selectedModules.filter(key => key !== moduleKey)
        : [...prev.selectedModules, moduleKey]
    }));
  }, []);

  // Select all modules
  const selectAllModules = useCallback(() => {
    const visibleModules = filteredModules();
    setState(prev => ({
      ...prev,
      selectedModules: visibleModules.map(m => m.moduleKey)
    }));
  }, [filteredModules]);

  // Clear module selection
  const clearModuleSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedModules: [] }));
  }, []);

  // Set search term
  const setSearchTerm = useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  }, []);

  // Set filter enabled state
  const setFilterEnabled = useCallback((filterEnabled: boolean | null) => {
    setState(prev => ({ ...prev, filterEnabled }));
  }, []);

  // Toggle analytics inclusion
  const toggleAnalytics = useCallback(async () => {
    const newIncludeAnalytics = !state.includeAnalytics;
    await fetchModules(newIncludeAnalytics);
  }, [state.includeAnalytics, fetchModules]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial load
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    // State
    ...state,
    filteredModules: filteredModules(),
    
    // Actions
    fetchModules,
    enableModule,
    disableModule,
    toggleModule,
    updateModuleSettings,
    updateModuleVersion,
    bulkEnableModules,
    bulkDisableModules,
    
    // UI Actions
    toggleModuleSelection,
    selectAllModules,
    clearModuleSelection,
    setSearchTerm,
    setFilterEnabled,
    toggleAnalytics,
    clearError
  };
}; 