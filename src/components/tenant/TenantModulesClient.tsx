"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Download,
  Upload,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { useToast } from '@/context/ToastContext';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

interface Module {
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

interface TenantModulesClientProps {
  modules: Module[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

const TenantModulesClient: React.FC<TenantModulesClientProps> = ({
  modules,
  loading,
  error,
  onRefresh
}) => {
  const { tenantSlug } = useParams();
  const { showToast } = useToast();
  const { user } = useTenantAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      showToast('Modules refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh modules', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleModule = async (module: Module, action: 'enable' | 'disable') => {
    try {
      const response = await api.post(`/tenant/${tenantSlug}/modules`, {
        action,
        moduleKey: module.moduleKey
      });

      if (response.data.success) {
        showToast(`Module ${action}d successfully`, 'success');
        onRefresh();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${action} module`, 'error');
    }
  };

  const handleUpdateVersion = async (module: Module, version: string) => {
    try {
      const response = await api.post(`/tenant/${tenantSlug}/modules`, {
        action: 'update_version',
        moduleKey: module.moduleKey,
        version
      });

      if (response.data.success) {
        showToast('Module version updated successfully', 'success');
        onRefresh();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update module version', 'error');
    }
  };

  const handleUpdateSettings = async (module: Module, settings: any) => {
    try {
      const response = await api.post(`/tenant/${tenantSlug}/modules`, {
        action: 'update_settings',
        moduleKey: module.moduleKey,
        settings
      });

      if (response.data.success) {
        showToast('Module settings updated successfully', 'success');
        onRefresh();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update module settings', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-t-lg"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 border-b"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading modules</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
          <div className="mt-6">
            <Button onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const enabledModules = modules.filter(m => m.isEnabled);
  const disabledModules = modules.filter(m => !m.isEnabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Module Management</h2>
              <p className="text-sm text-gray-600">
                Manage and configure modules for your tenant
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{modules.length}</div>
              <div className="text-sm text-gray-600">Total Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enabledModules.length}</div>
              <div className="text-sm text-gray-600">Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{disabledModules.length}</div>
              <div className="text-sm text-gray-600">Disabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {modules.filter(m => m.analytics?.accessCount > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enabled Modules */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            Enabled Modules ({enabledModules.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {enabledModules.map((module) => (
            <div key={module.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{module.moduleName}</h4>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="success">Enabled</Badge>
                      <span className="text-xs text-gray-400">v{module.tenantVersion || module.version}</span>
                      {module.analytics?.accessCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {module.analytics.accessCount} accesses
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedModule(module)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleModule(module, 'disable')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disabled Modules */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            Disabled Modules ({disabledModules.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {disabledModules.map((module) => (
            <div key={module.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{module.moduleName}</h4>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="danger">Disabled</Badge>
                      <span className="text-xs text-gray-400">v{module.version}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedModule(module)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleModule(module, 'enable')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module Details Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedModule.moduleName}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModule(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">{selectedModule.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Version</h4>
                  <p className="text-sm text-gray-600">{selectedModule.tenantVersion || selectedModule.version}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <Badge variant={selectedModule.isEnabled ? 'success' : 'danger'}>
                    {selectedModule.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              {selectedModule.analytics && (
                <div>
                  <h4 className="font-medium text-gray-900">Analytics</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-sm text-gray-600">Access Count:</span>
                      <p className="text-sm font-medium">{selectedModule.analytics.accessCount}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Last Accessed:</span>
                      <p className="text-sm font-medium">
                        {selectedModule.analytics.lastAccessedAt 
                          ? new Date(selectedModule.analytics.lastAccessedAt).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedModule.releaseNotes && (
                <div>
                  <h4 className="font-medium text-gray-900">Release Notes</h4>
                  <p className="text-sm text-gray-600">{selectedModule.releaseNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantModulesClient;
