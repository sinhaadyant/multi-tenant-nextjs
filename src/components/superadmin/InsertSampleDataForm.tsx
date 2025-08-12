"use client";

import React, { useState } from 'react';
import { 
  Database, 
  Users, 
  Building2, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useInsertSampleData } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/useToast';
import { InsertSampleDataParams } from '@/hooks/useDataManagement';

interface InsertSampleDataFormProps {
  onSuccess?: () => void;
}

const InsertSampleDataForm: React.FC<InsertSampleDataFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const insertSampleDataMutation = useInsertSampleData();

  const [formData, setFormData] = useState<InsertSampleDataParams>({
    insertTenants: false,
    insertUsers: false,
    tenantsCount: 5,
    usersPerTenant: 10,
    timeRange: 'today',
    backfillDays: 0
  });

  const timeRangeOptions = [
    { value: 'today', label: 'Today', description: 'Data created today' },
    { value: 'last15days', label: 'Last 15 Days', description: 'Data created in the last 15 days' },
    { value: 'last30days', label: 'Last 30 Days', description: 'Data created in the last 30 days' },
    { value: 'last90days', label: 'Last 90 Days', description: 'Data created in the last 90 days' }
  ];

  const handleInputChange = (field: keyof InsertSampleDataParams, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.insertTenants && !formData.insertUsers) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one data type to insert.',
        type: 'error'
      });
      return;
    }

    try {
      const result = await insertSampleDataMutation.mutateAsync(formData);
      
      // Show success toast with detailed information
      const createdItems = [];
      if (result.data.summary.totalTenantsCreated > 0) {
        createdItems.push(`${result.data.summary.totalTenantsCreated} tenants`);
      }
      if (result.data.summary.totalUsersCreated > 0) {
        createdItems.push(`${result.data.summary.totalUsersCreated} users`);
      }

      const description = createdItems.length > 0 
        ? `Successfully created: ${createdItems.join(', ')}`
        : 'No data was created';

      toast({
        title: 'Sample Data Inserted Successfully',
        description: description,
        type: 'success'
      });

      // Refresh data counts
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      onSuccess?.();
    } catch (error: any) {
      console.error('Insert sample data error:', error);
      toast({
        title: 'Error Inserting Sample Data',
        description: error.response?.data?.message || 'An error occurred while inserting sample data.',
        type: 'error'
      });
    }
  };

  const isSubmitting = insertSampleDataMutation.isPending;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Insert Sample Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate sample tenants and users for testing purposes
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Data Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Data Types
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tenants Option */}
            <label className="relative flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.insertTenants}
                onChange={(e) => handleInputChange('insertTenants', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Insert Sample Tenants
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create sample tenant organizations
                </p>
              </div>
            </label>

            {/* Users Option */}
            <label className="relative flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.insertUsers}
                onChange={(e) => handleInputChange('insertUsers', e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Insert Sample Users
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create sample users for each tenant
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Configuration Options */}
        {(formData.insertTenants || formData.insertUsers) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenants Configuration */}
              {formData.insertTenants && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Tenants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.tenantsCount}
                    onChange={(e) => handleInputChange('tenantsCount', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Number of sample tenants to create (1-100)
                  </p>
                </div>
              )}

              {/* Users Configuration */}
              {formData.insertUsers && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Users per Tenant
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.usersPerTenant}
                    onChange={(e) => handleInputChange('usersPerTenant', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Number of users to create per tenant (1-50)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Range Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Time Range
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timeRangeOptions.map((option) => (
              <label
                key={option.value}
                className="relative flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  name="timeRange"
                  value={option.value}
                  checked={formData.timeRange === option.value}
                  onChange={(e) => handleInputChange('timeRange', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Backfill Days */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Backfill Days
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="0"
              max="365"
              value={formData.backfillDays}
              onChange={(e) => handleInputChange('backfillDays', parseInt(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Additional days to backfill (0-365). Data will be created as if it was created in the past.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Important Notice
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This will create sample data for testing purposes. The data will be realistic but not production-ready.
                All sample users will have the password "password123".
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!formData.insertTenants && !formData.insertUsers)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inserting Data...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Insert Sample Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InsertSampleDataForm;
