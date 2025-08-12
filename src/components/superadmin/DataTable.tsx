"use client";

import React, { useState, useMemo, useTransition, useCallback, memo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions, GridReadyEvent, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  User,
  Building2
} from 'lucide-react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DataTableProps {
  data: any[];
  columns: ColDef[];
  title?: string;
  loading?: boolean;
  onRowClick?: (data: any) => void;
  onEdit?: (data: any) => void;
  onDelete?: (data: any) => void;
  onView?: (data: any) => void;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

// Memoized Actions Cell Renderer for better performance
const ActionsCellRenderer = memo(({ data, onView, onEdit, onDelete }: ICellRendererParams & {
  onView?: (data: any) => void;
  onEdit?: (data: any) => void;
  onDelete?: (data: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = useCallback((action: 'view' | 'edit' | 'delete') => {
    setIsOpen(false);
    switch (action) {
      case 'view':
        onView?.(data);
        break;
      case 'edit':
        onEdit?.(data);
        break;
      case 'delete':
        onDelete?.(data);
        break;
    }
  }, [data, onView, onEdit, onDelete]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 dark:hover:text-gray-300 transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            {onView && (
              <button
                onClick={() => handleAction('view')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-3" />
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => handleAction('edit')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => handleAction('delete')}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ActionsCellRenderer.displayName = 'ActionsCellRenderer';

// Debounced search hook for better performance
const useDebouncedSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchTerm(searchTerm);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return { searchTerm, setSearchTerm, debouncedSearchTerm, isPending };
};

const DataTable: React.FC<DataTableProps> = memo(({
  data,
  columns,
  title,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  pagination = true,
  pageSize = 10,
}) => {
  const [gridApi, setGridApi] = useState<any>(null);
  const { searchTerm, setSearchTerm, debouncedSearchTerm, isPending } = useDebouncedSearch(300);

  // Memoized filtered data with debounced search
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [data, debouncedSearchTerm]);

  // Memoized grid options to prevent unnecessary re-renders
  const gridOptions: GridOptions = useMemo(() => ({
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
    },
    rowSelection: 'single',
    animateRows: true,
    pagination: pagination,
    paginationPageSize: pageSize,
    paginationPageSizeSelector: [10, 25, 50, 100],
    suppressRowClickSelection: true,
    onGridReady: (params: GridReadyEvent) => {
      setGridApi(params.api);
    },
  }), [pagination, pageSize]);

  // Memoized enhanced columns with actions
  const enhancedColumns = useMemo(() => {
    const cols = [...columns];
    
    // Add actions column if any action handlers are provided
    if (onView || onEdit || onDelete) {
      cols.push({
        headerName: 'Actions',
        field: 'actions',
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <ActionsCellRenderer 
            {...params} 
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      });
    }
    
    return cols;
  }, [columns, onView, onEdit, onDelete]);

  // Memoized row click handler
  const handleRowClick = useCallback((event: any) => {
    if (onRowClick) {
      onRowClick(event.data);
    }
  }, [onRowClick]);

  // Memoized search handler
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} records found
              {isPending && <span className="ml-2 text-blue-500">Searching...</span>}
            </p>
          </div>
          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine w-full h-96">
        <AgGridReact
          rowData={filteredData}
          columnDefs={enhancedColumns}
          gridOptions={gridOptions}
          onRowClicked={handleRowClick}
          className="w-full h-full"
        />
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable; 