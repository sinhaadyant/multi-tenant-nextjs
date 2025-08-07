"use client";

import React, { useState } from 'react';
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
  Package,
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

const TenantTable: React.FC<TenantTableProps> = ({
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

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      starter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[plan as keyof typeof planColors] || planColors.starter}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  const handleSort = (field: string) => {
    onSort(field);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Name', 'Subdomain', 'Status', 'Plan', 'Users', 'Region', 'Created', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Name</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('slug')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Subdomain</span>
                  {getSortIcon('slug')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('isActive')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Status</span>
                  {getSortIcon('isActive')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('plan')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Plan</span>
                  {getSortIcon('plan')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('userCount')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Users</span>
                  {getSortIcon('userCount')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('region')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Region</span>
                  {getSortIcon('region')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Created</span>
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center space-y-2">
                    <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">No tenants found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <React.Fragment key={tenant.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tenant.name}
                          </div>
                          {tenant.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {tenant.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {tenant.slug}
                      </div>
                      {tenant.domain && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tenant.domain}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tenant.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPlanBadge(tenant.plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {tenant.userCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {tenant.region}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(tenant.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onView(tenant)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(tenant)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Edit Tenant"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(tenant)}
                          className={`${
                            tenant.isActive 
                              ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                          title={tenant.isActive ? 'Suspend Tenant' : 'Activate Tenant'}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tenant)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === tenant.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features</h4>
                            <div className="flex flex-wrap gap-1">
                                                        {Array.isArray(tenant.features) ? tenant.features.map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                            >
                              {feature}
                            </span>
                          )) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              No features
                            </span>
                          )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                            <div className="space-y-1">
                              <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                View Users
                              </button>
                              <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                View Analytics
                              </button>
                              <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                Manage Settings
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Last Updated</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(tenant.updatedAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalRecords)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalRecords}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronUp className="h-5 w-5 transform rotate-90" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-5 w-5 transform rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantTable; 