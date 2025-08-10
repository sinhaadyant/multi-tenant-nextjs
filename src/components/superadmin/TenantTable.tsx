"use client";

import React, { useState, useMemo, useTransition, useCallback, memo } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  ChevronUp, 
  ChevronDown,
  Users,
  Globe,
  Calendar,
  MapPin
} from 'lucide-react';
import { Tenant } from '@/hooks/useTenantsAPI';
import { format } from 'date-fns';

interface TenantTableProps {
  tenants: Tenant[];
  loading: boolean;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onToggleStatus: (tenant: Tenant) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
}

// Memoized Status Badge Component
const StatusBadge = memo(({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }`}>
    {isActive ? 'Active' : 'Inactive'}
  </span>
));

StatusBadge.displayName = 'StatusBadge';

// Memoized Sort Icon Component
const SortIcon = memo(({ field, sortBy, sortOrder }: { field: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
  if (sortBy !== field) {
    return <ChevronUp className="w-4 h-4 text-gray-400" />;
  }
  return sortOrder === 'asc' 
    ? <ChevronUp className="w-4 h-4 text-blue-500" />
    : <ChevronDown className="w-4 h-4 text-blue-500" />;
});

SortIcon.displayName = 'SortIcon';

// Memoized Tenant Row Component for better performance
const TenantRow = memo(({ 
  tenant, 
  isExpanded, 
  onToggleExpand, 
  onView, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  sortBy,
  sortOrder,
  onSort 
}: {
  tenant: Tenant;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onToggleStatus: (tenant: Tenant) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleSort = useCallback((field: string) => {
    startTransition(() => {
      onSort(field);
    });
  }, [onSort]);

  const handleAction = useCallback((action: 'view' | 'edit' | 'delete' | 'toggle') => {
    startTransition(() => {
      switch (action) {
        case 'view':
          onView(tenant);
          break;
        case 'edit':
          onEdit(tenant);
          break;
        case 'delete':
          onDelete(tenant);
          break;
        case 'toggle':
          onToggleStatus(tenant);
          break;
      }
    });
  }, [tenant, onView, onEdit, onDelete, onToggleStatus]);

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          <div className="flex items-center">
            <button
              onClick={() => onToggleExpand(tenant.id)}
              className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {tenant.name}
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge isActive={tenant.isActive} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {tenant.userCount}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(tenant.createdAt), 'MMM dd, yyyy')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleAction('view')}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={isPending}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction('edit')}
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
              disabled={isPending}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction('toggle')}
              className={`${
                tenant.isActive 
                  ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300'
                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
              }`}
              disabled={isPending}
            >
              {tenant.isActive ? <Trash2 className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Globe className="w-4 h-4 mr-2" />
                <span>Domain: {tenant.domain}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Region: {tenant.region}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Last Active: {format(new Date(tenant.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

TenantRow.displayName = 'TenantRow';

const TenantTable: React.FC<TenantTableProps> = memo(({
  tenants,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSort
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Memoized sort handler with transition
  const handleSort = useCallback((field: string) => {
    startTransition(() => {
      onSort(field);
    });
  }, [onSort]);

  // Memoized expand handler
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  // Memoized pagination handlers
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      onPageChange(page);
    });
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((size: number) => {
    startTransition(() => {
      onPageSizeChange(size);
    });
  }, [onPageSizeChange]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);
    return { start, end };
  }, [currentPage, pageSize, totalRecords]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Name', 'Status', 'Users', 'Created', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tenants
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginationInfo.start} to {paginationInfo.end} of {totalRecords} tenants
              {isPending && <span className="ml-2 text-blue-500">Updating...</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                { key: 'name', label: 'Name' },
                 { key: 'status', label: 'Status' },
                { key: 'userCount', label: 'Users' },
                { key: 'createdAt', label: 'Created' },
                { key: 'actions', label: 'Actions' }
              ].map(({ key, label }) => (
                <th 
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => key !== 'actions' && handleSort(key)}
                >
                  <div className="flex items-center">
                    {label}
                    {key !== 'actions' && <SortIcon field={key} sortBy={sortBy} sortOrder={sortOrder} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.map((tenant) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                isExpanded={expandedRow === tenant.id}
                onToggleExpand={handleToggleExpand}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

TenantTable.displayName = 'TenantTable';

export default TenantTable; 