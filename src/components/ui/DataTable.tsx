import React, { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface DataTableProps {
  columns: any[];
  data: any[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange?: (page: number) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  onSelectionChange,
  emptyMessage = 'No data found',
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header ? column.header({ column }) : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {column.cell ? column.cell({ row, column }) : row[column.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
