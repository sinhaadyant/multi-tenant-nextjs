"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  User, 
  Search, 
  ChevronDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { FilterState } from '@/hooks/useTenantsManagement';

interface TenantsFiltersProps {
  filters: FilterState;
  onApplyFilter: (filterType: keyof FilterState, value: any) => void;
  onClearFilter: (filterType?: keyof FilterState) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const TenantsFilters: React.FC<TenantsFiltersProps> = ({
  filters,
  onApplyFilter,
  onClearFilter,
  searchTerm,
  onSearchChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const isUpdatingRef = useRef(false);

  // Sync localSearchTerm with searchTerm prop (but not from our own updates)
  useEffect(() => {
    if (!isUpdatingRef.current && searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm, localSearchTerm]);

  // Debounced search to prevent excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        isUpdatingRef.current = true;
        onSearchChange(localSearchTerm);
        // Reset the flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, onSearchChange]);

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'suspended', label: 'Suspended', color: 'red' }
  ];

  const featureOptions = [
    { value: 'analytics', label: 'Analytics' },
    { value: 'api', label: 'API Access' },
    { value: 'sso', label: 'Single Sign-On' },
    { value: 'backup', label: 'Backup & Recovery' },
    { value: 'ml', label: 'Machine Learning' },
    { value: 'ai', label: 'Artificial Intelligence' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'iot', label: 'IoT Integration' },
    { value: 'quantum', label: 'Quantum Computing' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'education', label: 'Education' },
    { value: 'security', label: 'Security' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'userCount', label: 'User Count' },
    { value: 'status', label: 'Status' }
  ];

  const dateRangePresets = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'This year', value: 'year' },
    { label: 'Custom range', value: 'custom' }
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.owner) count++;
    if (filters.features.length > 0) count++;
    if (localSearchTerm) count++;
    return count;
  };

  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    let start = new Date();
    
    switch (preset) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        // Handle custom date picker
        return;
    }

    onApplyFilter('dateRange', {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  };

  const clearAllFilters = () => {
    onClearFilter();
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                    const newStatuses = filters.status.includes(status.value)
                      ? filters.status.filter(s => s !== status.value)
                      : [...filters.status, status.value];
                    onApplyFilter('status', newStatuses);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    filters.status.includes(status.value)
                      ? `bg-${status.color}-100 text-${status.color}-800 border-${status.color}-300 dark:bg-${status.color}-900 dark:text-${status.color}-300`
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                  }`}
                >
                  {filters.status.includes(status.value) && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Created Date
            </label>
            <div className="flex flex-wrap gap-2">
              {dateRangePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleDateRangePreset(preset.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {filters.dateRange && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filters.dateRange.start} to {filters.dateRange.end}
                </span>
                <button
                  onClick={() => onClearFilter('dateRange')}
                  className="text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Owner Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Owner/Admin
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by owner name or email..."
                value={filters.owner}
                onChange={(e) => onApplyFilter('owner', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Features Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Features
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {featureOptions.map((feature) => (
                <label key={feature.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.features.includes(feature.value)}
                    onChange={(e) => {
                      const newFeatures = e.target.checked
                        ? [...filters.features, feature.value]
                        : filters.features.filter(f => f !== feature.value);
                      onApplyFilter('features', newFeatures);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature.label}
                  </span>
                </label>
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
                value={filters.sortBy}
                onChange={(e) => onApplyFilter('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onApplyFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
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
            {filters.status.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300"
              >
                Status: {status}
                <button
                  onClick={() => onApplyFilter('status', filters.status.filter(s => s !== status))}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.dateRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Date: {filters.dateRange.start} - {filters.dateRange.end}
                <button
                  onClick={() => onClearFilter('dateRange')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.owner && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300">
                Owner: {filters.owner}
                <button
                  onClick={() => onClearFilter('owner')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.features.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-300"
              >
                Feature: {feature}
                <button
                  onClick={() => onApplyFilter('features', filters.features.filter(f => f !== feature))}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
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