"use client";

import React, { useState, useCallback } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ReportsFilters as ReportsFiltersType } from '@/hooks/useReports';

interface ReportsFiltersProps {
  filters: ReportsFiltersType;
  onFiltersChange: (filters: Partial<ReportsFiltersType>) => void;
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 500);

  // Update search when debounced value changes
  React.useEffect(() => {
    onFiltersChange({ search: debouncedSearch });
  }, [debouncedSearch, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ dateFrom: value });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ dateTo: value });
  };

  const handleReportTypeChange = (value: string) => {
    onFiltersChange({ reportType: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value || undefined });
  };

  const handleSortByChange = (value: string) => {
    onFiltersChange({ sortBy: value as any });
  };

  const handleSortOrderChange = (value: string) => {
    onFiltersChange({ sortOrder: value as 'asc' | 'desc' });
  };

  const clearFilters = useCallback(() => {
    setSearchValue('');
    onFiltersChange({
      search: undefined,
      reportType: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.search || filters.reportType || filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-4">
        {/* Search and Basic Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Report Type Filter */}
          <div className="sm:w-48">
            <select
              value={filters.reportType || ''}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Report Types</option>
              <option value="user_activity">User Activity</option>
              <option value="tenant_summary">Tenant Summary</option>
              <option value="login_history">Login History</option>
              <option value="audit_logs">Audit Logs</option>
              <option value="system_health">System Health</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-40">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="generating">Generating</option>
              <option value="ready">Ready</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleSortByChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="type">Report Type</option>
                  <option value="name">Report Name</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleSortOrderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Search: {filters.search}
                <button
                  onClick={() => {
                    setSearchValue('');
                    onFiltersChange({ search: undefined });
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.reportType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Type: {filters.reportType}
                <button
                  onClick={() => onFiltersChange({ reportType: undefined })}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Status: {filters.status}
                <button
                  onClick={() => onFiltersChange({ status: undefined })}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Date: {filters.dateFrom || 'Start'} - {filters.dateTo || 'End'}
                <button
                  onClick={() => onFiltersChange({ dateFrom: undefined, dateTo: undefined })}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 