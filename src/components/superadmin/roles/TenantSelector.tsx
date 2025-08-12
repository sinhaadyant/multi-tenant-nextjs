"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronDown, Building2, Users, Check } from 'lucide-react';
import { Tenant } from '@/hooks/useRolesPermissionsAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

interface TenantSelectorProps {
  selectedTenant: Tenant | null;
  onTenantSelect: (tenant: Tenant) => void;
  onFetchTenants: (filters: { search?: string; page?: number; limit?: number }) => Promise<any>;
  loading?: boolean;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({
  selectedTenant,
  onTenantSelect,
  onFetchTenants,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Simple debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch tenants
  const fetchTenants = useCallback(async (search?: string, page: number = 1) => {
    try {
      setIsLoadingTenants(true);
      const result = await onFetchTenants({
        search,
        page,
        limit: 10
      });
      
      if (result) {
        setTenants(result.tenants || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalRecords(result.pagination?.totalRecords || 0);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setIsLoadingTenants(false);
    }
  }, [onFetchTenants]);

  // Load tenants on mount and when search changes
  useEffect(() => {
    fetchTenants(debouncedSearchTerm, 1);
    setCurrentPage(1);
  }, [debouncedSearchTerm, fetchTenants]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTenants(debouncedSearchTerm, page);
  };

  // Handle tenant selection
  const handleTenantSelect = (tenant: Tenant) => {
    onTenantSelect(tenant);
    setIsOpen(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (!isOpen && tenants.length === 0) {
      fetchTenants('', 1);
    }
    setIsOpen(!isOpen);
  }, [isOpen, tenants.length, fetchTenants]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Tenant
        </label>
        
        {/* Selected Tenant Display */}
        <div
          onClick={toggleDropdown}
          className="relative cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          {selectedTenant ? (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedTenant.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedTenant.slug} • {selectedTenant.userCount} users
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                  selectedTenant.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {selectedTenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a tenant to manage roles and permissions
                </p>
              </div>
            </div>
          )}
          
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tenants List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingTenants ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto"></div>
                  <p className="mt-2 text-sm">Loading tenants...</p>
                </div>
              ) : tenants.length === 0 && !isLoadingTenants ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    {searchTerm ? 'No tenants found matching your search' : 'No tenants available'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      onClick={() => handleTenantSelect(tenant)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {tenant.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{tenant.slug}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{tenant.userCount}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                            tenant.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {selectedTenant?.id === tenant.id && (
                            <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} tenants
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-xs px-2 py-1"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-xs px-2 py-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading tenant data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
