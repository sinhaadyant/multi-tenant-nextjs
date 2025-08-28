"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, Calendar, MapPin, Package, Users } from 'lucide-react';
import { TenantFilters } from '@/hooks/useTenantsAPI';
import { useTranslation } from 'react-i18next';

interface TenantFiltersEnhancedProps {
  filters: TenantFilters;
  onFiltersChange: (filters: TenantFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const TenantFiltersEnhanced: React.FC<TenantFiltersEnhancedProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const { t } = useTranslation('superadmin');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((key: keyof TenantFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  }, [filters, onFiltersChange]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: '', page: 1 });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = filters.status || filters.plan || filters.region || filters.search;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.plan) count++;
    if (filters.region) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Enhanced Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('tenants.management.filters.searchPlaceholder')}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
            disabled={loading}
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
                 {/* Search Status */}
         {searchValue && (
           <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
             {t('common.search')} for &quot;{searchValue}&quot;...
           </div>
         )}
      </div>

      {/* Filter Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            disabled={loading}
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getActiveFiltersCount()} active
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={loading}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-6 space-y-6">
            {/* Status and Plan Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Status
                  </div>
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loading}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Suspended</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Plan
                  </div>
                </label>
                <select
                  value={filters.plan || ''}
                  onChange={(e) => handleFilterChange('plan', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loading}
                >
                  <option value="">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Region
                </div>
              </label>
              <select
                value={filters.region || ''}
                onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                disabled={loading}
              >
                <option value="">All Regions</option>
                <option value="US East">US East</option>
                <option value="US West">US West</option>
                <option value="EU West">EU West</option>
                <option value="EU Central">EU Central</option>
                <option value="Asia Pacific">Asia Pacific</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Sort By
                  </div>
                </label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loading}
                >
                  <option value="createdAt">Created Date</option>
                  <option value="name">Name</option>
                  <option value="userCount">User Count</option>
                  <option value="plan">Plan</option>
                  <option value="isActive">Status</option>
                  <option value="updatedAt">Last Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loading}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Active Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filters.status && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Status: {filters.status === 'active' ? 'Active' : 'Suspended'}
                      <button
                        onClick={() => handleFilterChange('status', undefined)}
                        className="ml-2 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.plan && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Plan: {filters.plan.charAt(0).toUpperCase() + filters.plan.slice(1)}
                      <button
                        onClick={() => handleFilterChange('plan', undefined)}
                        className="ml-2 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.region && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Region: {filters.region}
                      <button
                        onClick={() => handleFilterChange('region', undefined)}
                        className="ml-2 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                                     {filters.search && (
                     <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                       Search: &quot;{filters.search}&quot;
                      <button
                        onClick={handleClearSearch}
                        className="ml-2 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantFiltersEnhanced; 