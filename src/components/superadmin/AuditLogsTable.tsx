import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Eye, Calendar, User, Building, Activity } from 'lucide-react';
import { AuditLog } from '@/hooks/useAuditLogs';

interface AuditLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
  onViewLog: (log: AuditLog) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  logs,
  loading,
  onViewLog,
  onSort,
  sortBy,
  sortOrder,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getSeverityColor = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('suspend')) {
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    }
    return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
  };

  const getSeverityIcon = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('suspend')) {
      return '🔴';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return '🟡';
    }
    return '🟢';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const SortableHeader: React.FC<{
    field: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = '' }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === field && (
          sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Add null check for logs
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No audit logs found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filters or check back later for new activity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader field="createdAt">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Timestamp</span>
                </div>
              </SortableHeader>
              <SortableHeader field="actor">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Actor</span>
                </div>
              </SortableHeader>
              <SortableHeader field="action">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>Action</span>
                </div>
              </SortableHeader>
              <SortableHeader field="target">
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>Target</span>
                </div>
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => {
              const actor = log.superAdmin || log.user;
              return (
                <tr
                  key={log.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    hoveredRow === log.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                  onMouseEnter={() => setHoveredRow(log.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">
                        {formatTimestamp(log.createdAt)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {actor && (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {actor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {actor.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {actor.email}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {log.superAdmin ? 'Super Admin' : 'User'}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSeverityIcon(log.action)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.tenant ? (
                      <div>
                        <div className="font-medium">{log.tenant.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          {log.tenant.slug}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewLog(log)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
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
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronUp className="h-5 w-5 transform rotate-90" />
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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

export default AuditLogsTable; 