"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useTenants } from '@/hooks/useTenantsAPI';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserFilterBarProps {
  filters: {
    search?: string;
    status?: string;
    tenantId?: string;
    roleId?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

const UserFilterBar: React.FC<UserFilterBarProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    tenantId: filters.tenantId || '',
    roleId: filters.roleId || '',
  });
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');

  // Fetch tenants for filter dropdown
  const { data: tenantsData } = useTenants({ limit: 100 });

  // Fetch roles for filter dropdown
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/superadmin/roles');
      return response.data.roles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange({ ...filters, ...newFilters, page: 1 });
  }, [localFilters, filters, onFiltersChange]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    setLocalFilters({
      status: '',
      tenantId: '',
      roleId: '',
    });
    onClearFilters();
  }, [onClearFilters]);

  // Check if any filters are active
  const hasActiveFilters = searchValue || localFilters.status || localFilters.tenantId || localFilters.roleId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="space-y-4">
        {/* Enhanced Quick Tenant Filter */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tenant Filter:
              {tenantSearchTerm && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  (Searching: "{tenantSearchTerm}")
                </span>
              )}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {tenantsData?.data?.tenants?.length || 0} tenants available
            </span>
          </div>
          
          <div className="space-y-3">
            {/* All Tenants Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('tenantId', '')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 text-left ${
                  !localFilters.tenantId
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="mr-2">🏢</span>
                All Tenants
                <span className="ml-auto text-xs opacity-75">
                  ({tenantsData?.data?.tenants?.length || 0} total)
                </span>
              </button>
            </div>

            {/* Active Tenants */}
            {tenantsData?.data?.tenants?.filter((tenant: any) => tenant.isActive).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-1">
                  Active Tenants
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tenantsData?.data?.tenants
                    ?.filter((tenant: any) => tenant.isActive)
                    ?.filter((tenant: any) => 
                      !tenantSearchTerm || 
                      tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                      tenant.slug.toLowerCase().includes(tenantSearchTerm.toLowerCase())
                    )
                    ?.slice(0, 6)
                    ?.map((tenant: any) => (
                      <button
                        key={tenant.id}
                        onClick={() => handleFilterChange('tenantId', tenant.id)}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                          localFilters.tenantId === tenant.id
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs opacity-75">{tenant.slug}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Inactive Tenants */}
            {tenantsData?.data?.tenants?.filter((tenant: any) => !tenant.isActive).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-1">
                  Inactive Tenants
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tenantsData?.data?.tenants
                    ?.filter((tenant: any) => !tenant.isActive)
                    ?.filter((tenant: any) => 
                      !tenantSearchTerm || 
                      tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                      tenant.slug.toLowerCase().includes(tenantSearchTerm.toLowerCase())
                    )
                    ?.slice(0, 3)
                    ?.map((tenant: any) => (
                      <button
                        key={tenant.id}
                        onClick={() => handleFilterChange('tenantId', tenant.id)}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                          localFilters.tenantId === tenant.id
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-75'
                        }`}
                      >
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs opacity-75">{tenant.slug} - Inactive</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Show More Button */}
            {tenantsData?.data?.tenants?.length > 9 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    // Scroll to the dropdown filter
                    document.querySelector('select[value="' + localFilters.tenantId + '"]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  View All {tenantsData.tenants.length} Tenants in Dropdown →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by name or email..."
            defaultValue={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
            disabled={loading}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          {/* Enhanced Tenant Filter */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</label>
            <div className="space-y-2">
              {/* Tenant Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={tenantSearchTerm}
                  onChange={(e) => setTenantSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
                {tenantSearchTerm && (
                  <button
                    onClick={() => setTenantSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Tenant Dropdown */}
              <div className="relative">
                <select
                  value={localFilters.tenantId}
                  onChange={(e) => handleFilterChange('tenantId', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white w-full sm:min-w-[200px] lg:min-w-[250px] font-medium appearance-none"
                  disabled={loading}
                >
                  <option value="">All Tenants ({tenantsData?.data?.tenants?.length || 0} total)</option>
                                      <optgroup label="Active Tenants">
                      {tenantsData?.data?.tenants
                      ?.filter((tenant: any) => tenant.isActive)
                      ?.filter((tenant: any) => 
                        !tenantSearchTerm || 
                        tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                        tenant.slug.toLowerCase().includes(tenantSearchTerm.toLowerCase())
                      )
                      ?.map((tenant: any) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.slug})
                        </option>
                      ))}
                  </optgroup>
                                      {tenantsData?.data?.tenants?.some((tenant: any) => !tenant.isActive) && (
                      <optgroup label="Inactive Tenants">
                        {tenantsData?.data?.tenants
                        ?.filter((tenant: any) => !tenant.isActive)
                        ?.filter((tenant: any) => 
                          !tenantSearchTerm || 
                          tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                          tenant.slug.toLowerCase().includes(tenantSearchTerm.toLowerCase())
                        )
                        ?.map((tenant: any) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.slug}) - Inactive
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select
              value={localFilters.roleId}
              onChange={(e) => handleFilterChange('roleId', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white w-full sm:min-w-[120px] lg:min-w-[150px]"
              disabled={loading}
            >
              <option value="">All Roles</option>
              {rolesData?.map((role: Role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col space-y-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white w-full sm:min-w-[100px] lg:min-w-[120px]"
              disabled={loading}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 w-full sm:w-auto sm:ml-auto">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={loading}
                className="text-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiltersChange({ ...filters, page: 1 })}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current View:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {localFilters.tenantId 
                ? `Users from ${tenantsData?.data?.tenants?.find((t: any) => t.id === localFilters.tenantId)?.name}`
                : 'Users from All Tenants'
              }
            </span>
          </div>
          
          {hasActiveFilters && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Object.values(localFilters).filter(Boolean).length} active filter(s)
            </span>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
            
            {searchValue && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Search: "{searchValue}"
                <button
                  onClick={() => setSearchValue('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.tenantId && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
                <span className="mr-1">🏢</span>
                Tenant: {tenantsData?.data?.tenants?.find((t: any) => t.id === localFilters.tenantId)?.name}
                <button
                  onClick={() => handleFilterChange('tenantId', '')}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.roleId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Role: {rolesData?.find((r: Role) => r.id === localFilters.roleId)?.name}
                <button
                  onClick={() => handleFilterChange('roleId', '')}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Status: {localFilters.status === 'active' ? 'Active' : 'Inactive'}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 hover:text-orange-600"
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

export default UserFilterBar; 