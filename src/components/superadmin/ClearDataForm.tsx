"use client";

import React, { useState } from 'react';
import { 
  Trash2, 
  Building2, 
  Users, 
  FileText,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react';
import { useClearData, useDataCounts } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { ClearDataParams } from '@/hooks/useDataManagement';

interface ClearDataFormProps {
  onSuccess?: () => void;
}

const ClearDataForm: React.FC<ClearDataFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const clearDataMutation = useClearData();
  const { data: dataCounts, isLoading: countsLoading } = useDataCounts();

  const [formData, setFormData] = useState<ClearDataParams>({
    clearTenants: false,
    clearUsers: false,
    clearAuditLogs: false,
    clearAll: false,
    preserveSystemData: true
  });

  const handleInputChange = (field: keyof ClearDataParams, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearAllChange = (checked: boolean) => {
    if (checked) {
      setFormData({
        clearTenants: false,
        clearUsers: false,
        clearAuditLogs: false,
        clearAll: true,
        preserveSystemData: true
      });
    } else {
      setFormData({
        clearTenants: false,
        clearUsers: false,
        clearAuditLogs: false,
        clearAll: false,
        preserveSystemData: true
      });
    }
  };

  const getSelectedDataTypes = () => {
    const types = [];
    if (formData.clearTenants) types.push('Tenants');
    if (formData.clearUsers) types.push('Users');
    if (formData.clearAuditLogs) types.push('Audit Logs');
    if (formData.clearAll) types.push('All Data');
    return types;
  };

  const getDataCounts = () => {
    if (!dataCounts?.data?.counts) return { tenants: 0, users: 0, auditLogs: 0 };
    return dataCounts.data.counts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTypes = getSelectedDataTypes();
    if (selectedTypes.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one data type to clear.',
        type: 'error'
      });
      return;
    }

    const counts = getDataCounts();
    const totalItems = formData.clearAll 
      ? counts.tenants + counts.users + counts.auditLogs
      : (formData.clearTenants ? counts.tenants : 0) + 
        (formData.clearUsers ? counts.users : 0) + 
        (formData.clearAuditLogs ? counts.auditLogs : 0);

    // Show confirmation modal
    const confirmed = await confirm({
      title: 'Confirm Data Deletion',
      message: `Are you sure you want to delete ${selectedTypes.join(', ')}? This action will permanently delete ${totalItems} items and cannot be undone.`,
      confirmText: 'Delete Data',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      const result = await clearDataMutation.mutateAsync(formData);
      
      // Show success toast with detailed information
      const deletedItems = [];
      if (result.data.summary.totalTenantsDeleted > 0) {
        deletedItems.push(`${result.data.summary.totalTenantsDeleted} tenants`);
      }
      if (result.data.summary.totalUsersDeleted > 0) {
        deletedItems.push(`${result.data.summary.totalUsersDeleted} users`);
      }
      if (result.data.summary.totalAuditLogsDeleted > 0) {
        deletedItems.push(`${result.data.summary.totalAuditLogsDeleted} audit logs`);
      }

      const description = deletedItems.length > 0 
        ? `Successfully deleted: ${deletedItems.join(', ')}`
        : 'No data was deleted';

      toast({
        title: 'Data Cleared Successfully',
        description: description,
        type: 'success'
      });

      // Refresh data counts
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      onSuccess?.();
    } catch (error: any) {
      console.error('Clear data error:', error);
      toast({
        title: 'Error Clearing Data',
        description: error.response?.data?.message || 'An error occurred while clearing data.',
        type: 'error'
      });
    }
  };

  const isSubmitting = clearDataMutation.isPending;
  const counts = getDataCounts();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Clear Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permanently delete data from the system
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Current Data Counts */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Current Data Counts
          </h3>
          {countsLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading counts...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tenants: <span className="font-medium text-gray-900 dark:text-white">{counts.tenants}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Users: <span className="font-medium text-gray-900 dark:text-white">{counts.users}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Audit Logs: <span className="font-medium text-gray-900 dark:text-white">{counts.auditLogs}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Data Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Select Data to Clear
          </h3>
          
          <div className="space-y-3">
            {/* Clear All Option */}
            <label className="relative flex items-start p-4 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20">
              <input
                type="checkbox"
                checked={formData.clearAll}
                onChange={(e) => handleClearAllChange(e.target.checked)}
                className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Clear All Data
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Delete all tenants, users, and audit logs. This is irreversible.
                </p>
              </div>
            </label>

            {/* Individual Options (disabled when clear all is selected) */}
            <div className={`space-y-3 ${formData.clearAll ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Tenants Option */}
              <label className="relative flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={formData.clearTenants}
                  onChange={(e) => handleInputChange('clearTenants', e.target.checked)}
                  disabled={formData.clearAll}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Clear Tenants
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delete all tenant organizations and their associated data
                  </p>
                </div>
              </label>

              {/* Users Option */}
              <label className="relative flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={formData.clearUsers}
                  onChange={(e) => handleInputChange('clearUsers', e.target.checked)}
                  disabled={formData.clearAll}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Clear Users
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delete all user accounts across all tenants
                  </p>
                </div>
              </label>

              {/* Audit Logs Option */}
              <label className="relative flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={formData.clearAuditLogs}
                  onChange={(e) => handleInputChange('clearAuditLogs', e.target.checked)}
                  disabled={formData.clearAll}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Clear Audit Logs
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delete all audit log entries and activity history
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        <div className="space-y-4">
          {/* Critical Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠️ Critical Warning
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This action will permanently delete the selected data. This operation cannot be undone.
                  Please ensure you have proper backups before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Important Information
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• Deleting tenants will also delete all associated users and data</li>
                  <li>• Deleting users will remove all user accounts but preserve tenant structure</li>
                  <li>• Audit logs provide important security and compliance records</li>
                  <li>• System configuration and admin accounts will be preserved</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || getSelectedDataTypes().length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Clearing Data...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Selected Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClearDataForm;
