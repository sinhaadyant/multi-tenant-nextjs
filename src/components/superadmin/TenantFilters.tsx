"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Filter, X, Calendar, MapPin } from 'lucide-react';
import { TenantFilters } from '@/hooks/useTenantsAPI';
import { useTranslation } from 'react-i18next';

interface TenantFiltersProps {
  filters: TenantFilters;
  onFiltersChange: (filters: TenantFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const TenantFiltersComponent: React.FC<TenantFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const { t } = useTranslation('superadmin');
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(filters.search || '');
  const [showClearButton, setShowClearButton] = useState(!!filters.search);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync local search value with filters.search
  useEffect(() => {
    setLocalSearchValue(filters.search || '');
    setShowClearButton(!!filters.search);
  }, [filters.search]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchValue(value);
    setShowClearButton(!!value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value !== filters.search) {
        onFiltersChange({
          ...filters,
          search: value,
          page: 1
        });
      }
    }, 500);
  }, [filters, onFiltersChange]);

  const handleFilterChange = useCallback((key: keyof TenantFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  }, [filters, onFiltersChange]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchValue('');
    setShowClearButton(false);
    onFiltersChange({ ...filters, search: '', page: 1 });
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    onClearFilters();
    setLocalSearchValue('');
    setShowClearButton(false);
  }, [onClearFilters]);

  const hasActiveFilters = filters.status || filters.region || filters.search;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('tenants.management.filters.searchPlaceholder')}
            value={localSearchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            disabled={loading}
          />
           {showClearButton && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            disabled={loading}
          >
            <Filter className="w-4 h-4" />
            <span>{t('tenants.management.filters.filters')}</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {t('tenants.management.filters.active')}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={loading}
            >
              {t('tenants.management.filters.clearAll')}
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tenants.management.filters.status')}
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">{t('tenants.management.filters.allStatus')}</option>
                  <option value="active">{t('tenants.management.table.status.active')}</option>
                  <option value="inactive">{t('tenants.management.table.status.suspended')}</option>
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tenants.management.filters.region')}
                </label>
                <select
                  value={filters.region || ''}
                  onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">{t('tenants.management.filters.allRegions')}</option>
                  <option value="US East">{t('tenants.management.filters.regions.usEast')}</option>
                  <option value="US West">{t('tenants.management.filters.regions.usWest')}</option>
                  <option value="EU West">{t('tenants.management.filters.regions.euWest')}</option>
                  <option value="EU Central">{t('tenants.management.filters.regions.euCentral')}</option>
                  <option value="Asia Pacific">{t('tenants.management.filters.regions.asiaPacific')}</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tenants.management.filters.sortBy')}
                </label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="createdAt">{t('tenants.management.filters.createdDate')}</option>
                  <option value="name">{t('tenants.management.table.columns.name')}</option>
                  <option value="status">{t('tenants.management.table.columns.status')}</option>
                  <option value="userCount">{t('tenants.management.filters.userCount')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('tenants.management.filters.sortOrder')}
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="desc">{t('tenants.management.filters.newestFirst')}</option>
                  <option value="asc">{t('tenants.management.filters.oldestFirst')}</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {filters.status && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {t('tenants.management.filters.status')}: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', undefined)}
                      className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.region && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {t('tenants.management.filters.region')}: {filters.region}
                    <button
                      onClick={() => handleFilterChange('region', undefined)}
                      className="ml-1 hover:text-purple-600 dark:hover:text-purple-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {t('common.search')}: "{filters.search}"
                    <button
                      onClick={handleClearSearch}
                      className="ml-1 hover:text-yellow-600 dark:hover:text-yellow-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantFiltersComponent; 