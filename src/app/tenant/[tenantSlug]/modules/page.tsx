"use client";

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useModuleManagement } from '@/hooks/useModuleManagement';
import { Module, ModulePermissions } from '@/hooks/useModuleManagement';
import { 
  CheckCircle, 
  XCircle, 
  Settings, 
  Eye, 
  EyeOff, 
  Search, 
  Filter,
  RefreshCw,
  BarChart3,
  Package,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { toast } from 'react-hot-toast';

// Module Card Component
const ModuleCard: React.FC<{
  module: Module;
  permissions: ModulePermissions;
  onToggle: (moduleKey: string) => Promise<void>;
  onUpdateSettings: (moduleKey: string, settings: any) => Promise<void>;
  onUpdateVersion: (moduleKey: string, version: string) => Promise<void>;
  isSelected: boolean;
  onToggleSelection: (moduleKey: string) => void;
}> = ({ 
  module, 
  permissions, 
  onToggle, 
  onUpdateSettings, 
  onUpdateVersion, 
  isSelected, 
  onToggleSelection 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!permissions.canEnableDisableModules) {
      toast.error('You do not have permission to enable/disable modules');
      return;
    }

    setIsLoading(true);
    try {
      await onToggle(module.moduleKey);
      toast.success(`Module ${module.isEnabled ? 'disabled' : 'enabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle module');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-700'
    } shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(module.moduleKey)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {module.moduleName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {module.moduleKey}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              module.isEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {module.isEnabled ? 'Enabled' : 'Disabled'}
            </span>

            {/* Toggle Button */}
            {permissions.canEnableDisableModules && (
              <Button
                onClick={handleToggle}
                disabled={isLoading}
                variant={module.isEnabled ? 'outline' : 'default'}
                size="sm"
                className="flex items-center space-x-1"
              >
                {isLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : module.isEnabled ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>Disable</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Enable</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {module.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {module.description}
          </p>
        )}

        {/* Version Info */}
        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {module.version && (
            <span>Version: {module.version}</span>
          )}
          {module.tenantVersion && module.tenantVersion !== module.version && (
            <span className="text-orange-600 dark:text-orange-400">
              Tenant Version: {module.tenantVersion}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Page Component
const ModuleManagementPage: React.FC = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const {
    modules,
    permissions,
    loading,
    error,
    selectedModules,
    searchTerm,
    filterEnabled,
    includeAnalytics,
    filteredModules,
    toggleModule,
    updateModuleSettings,
    updateModuleVersion,
    bulkEnableModules,
    bulkDisableModules,
    toggleModuleSelection,
    selectAllModules,
    clearModuleSelection,
    setSearchTerm,
    setFilterEnabled,
    toggleAnalytics,
    clearError
  } = useModuleManagement(tenantSlug);

  const { showConfirmModal } = useConfirmModalContext();

  // Permission check
  if (!permissions.canViewModules) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You do not have permission to view module management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Module Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Manage which modules are enabled and configured for your tenant
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Analytics Toggle */}
              {permissions.canViewAnalytics && (
                <Button
                  onClick={toggleAnalytics}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{includeAnalytics ? 'Hide' : 'Show'} Analytics</span>
                </Button>
              )}

              {/* Refresh Button */}
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterEnabled === null ? 'all' : filterEnabled.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterEnabled(value === 'all' ? null : value === 'true');
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Modules</option>
                  <option value="true">Enabled Only</option>
                  <option value="false">Disabled Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading modules...</span>
          </div>
        )}

        {/* Modules Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredModules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                permissions={permissions}
                onToggle={toggleModule}
                onUpdateSettings={updateModuleSettings}
                onUpdateVersion={updateModuleVersion}
                isSelected={selectedModules.includes(module.moduleKey)}
                onToggleSelection={toggleModuleSelection}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredModules.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No modules found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || filterEnabled !== null
                ? 'Try adjusting your search or filter criteria.'
                : 'No modules are available for this tenant.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleManagementPage; 