"use client";

import React, { useState, useMemo, useCallback, memo } from 'react';
import { VirtualizedTable } from '@/components/common/VirtualizedList';
import { DynamicDataTable } from '@/lib/dynamicImports';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  header: string;
  width?: number | string;
  sortable?: boolean;
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

interface OptimizedDataTableProps {
  data: any[];
  columns: Column[];
  height?: number;
  rowHeight?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onRowClick?: (row: any, index: number) => void;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  getRowKey?: (row: any, index: number) => string | number;
  enableVirtualization?: boolean;
  virtualThreshold?: number; // Number of rows before enabling virtualization
}

const OptimizedDataTable: React.FC<OptimizedDataTableProps> = ({
  data,
  columns,
  height = 400,
  rowHeight = 48,
  loading = false,
  error = null,
  className,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
  selectedRows = new Set(),
  onSelectionChange,
  getRowKey = (_, index) => index,
  enableVirtualization = true,
  virtualThreshold = 100,
}) => {
  const [localSortBy, setLocalSortBy] = useState<string | undefined>(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>(sortOrder || 'asc');

  // Determine if virtualization should be used
  const shouldVirtualize = enableVirtualization && data.length > virtualThreshold;

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!localSortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[localSortBy];
      const bValue = b[localSortBy];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return localSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, localSortBy, localSortOrder]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    const newOrder = localSortBy === key && localSortOrder === 'asc' ? 'desc' : 'asc';
    setLocalSortBy(key);
    setLocalSortOrder(newOrder);
    onSort?.(key, newOrder);
  }, [localSortBy, localSortOrder, onSort]);

  // Handle row selection
  const handleRowSelection = useCallback((rowKey: string | number) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowKey)) {
      newSelection.delete(rowKey);
    } else {
      newSelection.add(rowKey);
    }
    onSelectionChange(newSelection);
  }, [selectedRows, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    if (selectedRows.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row, index) => getRowKey(row, index))));
    }
  }, [selectedRows, data, onSelectionChange, getRowKey, onSelectionChange]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Use virtualization for large datasets
  if (shouldVirtualize) {
    const virtualColumns = columns.map(col => ({
      key: col.key,
      header: col.header,
      width: col.width,
      render: (row: any, index: number) => {
        const value = row[col.key];
        return col.render ? col.render(value, row, index) : value;
      },
    }));

    return (
      <VirtualizedTable
        items={sortedData}
        height={height}
        rowHeight={rowHeight}
        columns={virtualColumns}
        className={className}
        getItemKey={getRowKey}
        headerClassName="bg-gray-50 dark:bg-gray-800"
        rowClassName={cn(
          'cursor-pointer transition-colors',
          onRowClick && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        )}
      />
    );
  }

  // Regular table for smaller datasets
  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {onSelectionChange && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  style={{ width: column.width || 'auto' }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && localSortBy === column.key && (
                      <span className="text-blue-500">
                        {localSortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((row, index) => {
              const rowKey = getRowKey(row, index);
              const isSelected = selectedRows.has(rowKey);

              return (
                <tr
                  key={rowKey}
                  className={cn(
                    'transition-colors',
                    isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {onSelectionChange && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelection(rowKey)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                        style={{ width: column.width || 'auto' }}
                      >
                        {column.render ? column.render(value, row, index) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(OptimizedDataTable); 