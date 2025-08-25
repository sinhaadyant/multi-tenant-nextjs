"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter, Users, Shield, Activity, FileText, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'role' | 'audit' | 'report' | 'setting';
  path: string;
  icon: React.ReactNode;
}

interface TenantSearchProps {
  tenantSlug: string;
  className?: string;
}

const TenantSearch: React.FC<TenantSearchProps> = ({ tenantSlug, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const { user, tenant } = useReduxAuth();
  
  const {
    canViewUsers,
    canViewRoles,
    canViewAudit,
    canViewReports,
    canViewAnalytics,
    canCreateUsers,
    canCreateReports,
    canManageRoles,
  } = useDashboardPermissions();

  // Define searchable items based on permissions
  const searchableItems = useMemo((): SearchResult[] => {
    const items: SearchResult[] = [];

    // Users section
    if (canViewUsers) {
      items.push({
        id: 'users',
        title: 'Users',
        description: 'Manage organization users',
        type: 'user',
        path: `/${tenantSlug}/users`,
        icon: <Users className="w-4 h-4" />
      });
      
      if (canCreateUsers) {
        items.push({
          id: 'add-user',
          title: 'Add User',
          description: 'Create a new user account',
          type: 'user',
          path: `/${tenantSlug}/users?action=create`,
          icon: <Users className="w-4 h-4" />
        });
      }
    }

    // Roles section
    if (canViewRoles) {
      items.push({
        id: 'roles',
        title: 'Roles',
        description: 'Manage user roles and permissions',
        type: 'role',
        path: `/${tenantSlug}/roles`,
        icon: <Shield className="w-4 h-4" />
      });
      
      if (canManageRoles) {
        items.push({
          id: 'manage-roles',
          title: 'Manage Roles',
          description: 'Create and edit role permissions',
          type: 'role',
          path: `/${tenantSlug}/roles?action=manage`,
          icon: <Shield className="w-4 h-4" />
        });
      }
    }

    // Audit section
    if (canViewAudit) {
      items.push({
        id: 'audit',
        title: 'Audit Logs',
        description: 'View system activity and audit trails',
        type: 'audit',
        path: `/${tenantSlug}/audit`,
        icon: <Activity className="w-4 h-4" />
      });
    }

    // Reports section
    if (canViewReports) {
      items.push({
        id: 'reports',
        title: 'Reports',
        description: 'View and generate reports',
        type: 'report',
        path: `/${tenantSlug}/reports`,
        icon: <FileText className="w-4 h-4" />
      });
      
      if (canCreateReports) {
        items.push({
          id: 'create-report',
          title: 'Create Report',
          description: 'Generate a new report',
          type: 'report',
          path: `/${tenantSlug}/reports?action=create`,
          icon: <FileText className="w-4 h-4" />
        });
      }
    }

    // Settings section (always available)
    items.push({
      id: 'settings',
      title: 'Settings',
      description: 'Manage organization settings',
      type: 'setting',
      path: `/${tenantSlug}/settings`,
      icon: <Settings className="w-4 h-4" />
    });

    return items;
  }, [canViewUsers, canViewRoles, canViewAudit, canViewReports, canViewAnalytics, canCreateUsers, canCreateReports, canManageRoles, tenantSlug]);

  // Filter results based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return searchableItems.filter(item =>
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    );
  }, [searchableItems, searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
        handleResultClick(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setSelectedIndex(-1);
    }
  }, [filteredResults, selectedIndex]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    router.push(result.path);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
  }, [router]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  // Handle focus
  const handleFocus = useCallback(() => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  }, [searchTerm]);

  // Handle click outside
  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={t('forms:placeholders.searchUsersRolesReports')}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="py-2">
            {filteredResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 ${
                  index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.type === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      result.type === 'role' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                      result.type === 'audit' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      result.type === 'report' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {result.type}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm && filteredResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-8 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No results found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try searching for something else or check your permissions.
            </p>
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
};

export default TenantSearch;
