"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotification } from "@/hooks/useNotification";
import type {
  PaginationParams,
  PaginatedResponse,
  TableColumn,
  FilterGroup,
  AppliedFilter,
  SortParams,
} from "@/types/common";

export interface DataTableProps<T = any> {
  // Data fetching
  queryKey: string[];
  fetchData: (params: DataTableParams) => Promise<PaginatedResponse<T>>;

  // Configuration
  columns: TableColumn<T>[];
  title?: string;
  description?: string;

  // Features
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  exportable?: boolean;

  // Filters
  filters?: FilterGroup[];

  // Customization
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;

  // Actions
  onRowClick?: (record: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onExport?: (data: T[]) => void;

  // Styling
  className?: string;
  cardClassName?: string;
}

export interface DataTableParams extends PaginationParams {
  filters?: AppliedFilter[];
}

export interface DataTableState {
  pagination: {
    page: number;
    per_page: number;
  };
  sorting: SortParams;
  search: string;
  filters: AppliedFilter[];
  selectedIds: string[];
}

const DataTable = <T extends Record<string, any>>({
  queryKey,
  fetchData,
  columns,
  title,
  description,
  searchable = true,
  filterable = true,
  selectable = false,
  exportable = false,
  filters = [],
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  errorMessage = "An error occurred while loading data",
  onRowClick,
  onSelectionChange,
  onExport,
  className = "",
  cardClassName = "",
}: DataTableProps<T>) => {
  const { error, info } = useNotification();

  // State
  const [state, setState] = useState<DataTableState>({
    pagination: {
      page: 1,
      per_page: 10,
    },
    sorting: {},
    search: "",
    filters: [],
    selectedIds: [],
  });

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Query parameters
  const queryParams = useMemo(() => {
    const params: DataTableParams = {
      page: state.pagination.page,
      per_page: state.pagination.per_page,
      search: debouncedSearch || undefined,
      sort_by: state.sorting.sort_by,
      sort_order: state.sorting.sort_order,
      filters: state.filters.length > 0 ? state.filters : undefined,
    };

    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );
  }, [state, debouncedSearch]);

  // Data fetching
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKey, queryParams],
    queryFn: () => fetchData(queryParams),
    placeholderData: previousData => previousData,
  });

  // Handlers
  const handleSearch = useCallback(
    (value: string) => {
      setState(prev => ({
        ...prev,
        search: value,
        pagination: { ...prev.pagination, page: 1 },
      }));

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
      }, 500);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  const handleSort = useCallback((key: string) => {
    setState(prev => {
      const currentSort = prev.sorting.sort_by;
      const currentOrder = prev.sorting.sort_order;

      let newOrder: "asc" | "desc" = "asc";
      if (currentSort === key) {
        newOrder = currentOrder === "asc" ? "desc" : "asc";
      }

      return {
        ...prev,
        sorting: {
          sort_by: key,
          sort_order: newOrder,
        },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  const handlePerPageChange = useCallback((per_page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { page: 1, per_page },
    }));
  }, []);

  const handleFilterChange = useCallback((filter: AppliedFilter) => {
    setState(prev => {
      const existingIndex = prev.filters.findIndex(f => f.key === filter.key);
      let newFilters = [...prev.filters];

      if (existingIndex >= 0) {
        newFilters[existingIndex] = filter;
      } else {
        newFilters.push(filter);
      }

      return {
        ...prev,
        filters: newFilters,
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!data?.data) return;

      const newSelectedIds = checked
        ? data.data.map(item => item.id || item._id)
        : [];
      setState(prev => ({ ...prev, selectedIds: newSelectedIds }));
      onSelectionChange?.(newSelectedIds);
    },
    [data?.data, onSelectionChange]
  );

  const handleSelectRow = useCallback(
    (id: string, checked: boolean) => {
      setState(prev => {
        const newSelectedIds = checked
          ? [...prev.selectedIds, id]
          : prev.selectedIds.filter(selectedId => selectedId !== id);

        return { ...prev, selectedIds: newSelectedIds };
      });

      onSelectionChange?.(state.selectedIds);
    },
    [state.selectedIds, onSelectionChange]
  );

  const handleExport = useCallback(() => {
    if (!data?.data) {
      error({ message: "No data to export" });
      return;
    }

    try {
      onExport?.(data.data);
      info({ message: "Data exported successfully" });
    } catch (err) {
      error({ message: "Failed to export data" });
    }
  }, [data?.data, onExport, error, info]);

  const handleRefresh = useCallback(() => {
    refetch();
    info({ message: "Data refreshed" });
  }, [refetch, info]);

  // Computed values
  const totalPages = data?.pagination?.last_page || 1;
  const totalItems = data?.pagination?.total || 0;
  const currentPage = state.pagination.page;
  const perPage = state.pagination.per_page;

  // Render functions
  const renderCell = (column: TableColumn<T>, record: T, index: number) => {
    const value = record[column.key as keyof T];

    if (column.render) {
      return column.render(value, record, index);
    }

    if (column.formatter) {
      return column.formatter(value);
    }

    return value;
  };

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;

    const isSorted = state.sorting.sort_by === column.key;
    const isAsc = state.sorting.sort_order === "asc";

    return (
      <span className="ml-1">
        {isSorted ? (
          <span className={isAsc ? "rotate-180" : ""}>▼</span>
        ) : (
          <span className="text-gray-400">▼</span>
        )}
      </span>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Showing {(currentPage - 1) * perPage + 1} to{" "}
            {Math.min(currentPage * perPage, totalItems)} of {totalItems}{" "}
            results
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    if (!filterable || filters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 p-4 border-b">
        {filters.map(filter => (
          <div key={filter.key} className="flex items-center space-x-2">
            <span className="text-sm font-medium">{filter.label}:</span>
            {filter.type === "select" && (
              <Select
                onValueChange={value =>
                  handleFilterChange({
                    key: filter.key,
                    value,
                    label: filter.label,
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options?.map(option => (
                    <SelectItem
                      key={option.value.toString()}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderToolbar = () => {
    return (
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={state.search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          <Select
            value={perPage.toString()}
            onValueChange={value => handlePerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!data?.data || data.data.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex space-x-4 p-4">
              {Array.from({ length: columns.length }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">{errorMessage}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Try Again
          </Button>
        </div>
      );
    }

    if (!data?.data || data.data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    state.selectedIds.length === data.data.length &&
                    data.data.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map(column => (
              <TableHead
                key={column.key.toString()}
                className={`${column.sortable ? "cursor-pointer hover:bg-gray-50" : ""} ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}`}
                onClick={() =>
                  column.sortable && handleSort(column.key.toString())
                }
              >
                <div className="flex items-center">
                  {column.label}
                  {renderSortIcon(column)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((record, index) => (
            <TableRow
              key={record.id || record._id || index}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onRowClick?.(record)}
            >
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={state.selectedIds.includes(
                      record.id || record._id
                    )}
                    onCheckedChange={checked =>
                      handleSelectRow(
                        record.id || record._id,
                        checked as boolean
                      )
                    }
                    onClick={e => e.stopPropagation()}
                  />
                </TableCell>
              )}
              {columns.map(column => (
                <TableCell
                  key={column.key.toString()}
                  className={
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }
                >
                  {renderCell(column, record, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className={`${cardClassName}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-gray-600">{description}</p>}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {renderToolbar()}
        {renderFilters()}
        {renderTable()}
        {renderPagination()}
      </CardContent>
    </Card>
  );
};

export default DataTable;
