"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  FileText,
  Users,
  Activity,
  Shield,
  TrendingUp
} from 'lucide-react';
import { TenantReportsFilters as TenantReportsFiltersType } from '@/hooks/useTenantReports';

interface TenantReportsFiltersProps {
  filters: TenantReportsFiltersType;
  onFiltersChange: (filters: TenantReportsFiltersType) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const TenantReportsFilters: React.FC<TenantReportsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.search || '');

  const reportTypeOptions = [
    { value: 'user_activity', label: 'User Activity', icon: Users, description: 'Track user actions and behavior' },
    { value: 'role_summary', label: 'Role Summary', icon: Shield, description: 'Role assignments and permissions' },
    { value: 'login_history', label: 'Login History', icon: Activity, description: 'User login patterns and security' },
    { value: 'audit_logs', label: 'Audit Logs', icon: FileText, description: 'System audit trail and changes' },
    { value: 'system_health', label: 'System Health', icon: TrendingUp, description: 'System performance metrics' }
  ];

  const statusOptions = [
    { value: 'generating', label: 'Generating', color: 'yellow' },
    { value: 'ready', label: 'Ready', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' }
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.reportType) count++;
    if (filters.status) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (localSearchTerm) count++;
    return count;
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleReportTypeChange = (reportType: string) => {
    onFiltersChange({
      ...filters,
      reportType: filters.reportType === reportType ? undefined : reportType,
      page: 1
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? undefined : status,
      page: 1
    });
  };

  const handleDateRangeChange = (dateFrom: string, dateTo: string) => {
    onFiltersChange({
      ...filters,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: 1
    });
  };

  const clearAllFilters = () => {
    onClearFilters();
    setLocalSearchTerm('');
  };

  const selectedReportType = reportTypeOptions.find(option => option.value === filters.reportType);
  const selectedStatus = statusOptions.find(option => option.value === filters.status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            {getActiveFiltersCount() > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Reports
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('forms:placeholders.searchByReportName')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            disabled={loading}
          />
        </div>
      </div>

      {/* Report Type Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Report Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportTypeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = filters.reportType === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleReportTypeChange(option.value)}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </span>
                </div>
                <p className={`text-xs ${
                  isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                filters.status === status.value
                  ? `bg-${status.color}-100 text-${status.color}-800 border-${status.color}-300 dark:bg-${status.color}-900 dark:text-${status.color}-300`
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              }`}
              disabled={loading}
            >
              {filters.status === status.value && (
                <X className="w-3 h-3 inline mr-1" />
              )}
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date Range
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateRangeChange(e.target.value, filters.dateTo || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateRangeChange(filters.dateFrom || '', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {getActiveFiltersCount() > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedReportType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Type: {selectedReportType.label}
                <button
                  onClick={() => handleReportTypeChange(selectedReportType.value)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Status: {selectedStatus.label}
                <button
                  onClick={() => handleStatusChange(selectedStatus.value)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Date: {filters.dateFrom || 'Any'} - {filters.dateTo || 'Any'}
                <button
                  onClick={() => handleDateRangeChange('', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localSearchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Search: {localSearchTerm}
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantReportsFilters;
