"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  ChevronDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { TenantFilters as TenantFiltersType } from '@/hooks/useTenantsAPI';

interface TenantsFiltersProps {
  filters: TenantFiltersType;
  onFiltersChange: (filters: TenantFiltersType) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const TenantsFilters: React.FC<TenantsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.search || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync localSearchTerm with filters.search prop
  useEffect(() => {
    setLocalSearchTerm(filters.search || '');
  }, [filters.search]);

  // Debounced search to prevent excessive API calls
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (localSearchTerm !== filters.search) {
        onFiltersChange({
          ...filters,
          search: localSearchTerm,
          page: 1 // Reset to first page when searching
        });
      }
    }, 500); // Increased debounce time for better UX

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearchTerm, filters.search, onFiltersChange]);

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'suspended', label: 'Suspended', color: 'red' }
  ];



  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'userCount', label: 'User Count' },
    { value: 'status', label: 'Status' }
  ];

  const regionOptions = [
    { value: 'US East', label: 'US East' },
    { value: 'US West', label: 'US West' },
    { value: 'Europe', label: 'Europe' },
    { value: 'Asia Pacific', label: 'Asia Pacific' }
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.region) count++;
    if (localSearchTerm) count++;
    return count;
  };

  const handleRegionChange = (region: string) => {
    onFiltersChange({
      ...filters,
      region: region
    });
  };

  const clearAllFilters = () => {
    onClearFilters();
    setLocalSearchTerm('');
  };

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
                <RotateCcw className="w-4 h-4" />
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants by name, slug, or owner..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      status: filters.status === status.value ? undefined : status.value
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    filters.status === status.value
                      ? `bg-${status.color}-100 text-${status.color}-800 border-${status.color}-300 dark:bg-${status.color}-900 dark:text-${status.color}-300`
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                  }`}
                >
                  {filters.status === status.value && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Region
            </label>
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((region) => (
                <button
                  key={region.value}
                  onClick={() => handleRegionChange(region.value)}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    filters.region === region.value
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>



          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {getActiveFiltersCount() > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Status: {filters.status}
                <button
                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.region && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Region: {filters.region}
                <button
                  onClick={() => onFiltersChange({ ...filters, region: undefined })}
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
                  onClick={() => setLocalSearchTerm('')}
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

export default TenantsFilters; 