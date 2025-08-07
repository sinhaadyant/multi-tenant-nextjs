"use client";

import React, { useState, useMemo } from 'react';
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

// Status Badge Component
const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'suspended':
        return {
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        };
      default:
        return {
          icon: <MoreHorizontal className="w-4 h-4" />,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
    }
  };

  const config = getStatusConfig(value);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.icon}
      <span className="ml-1">{value}</span>
    </span>
  );
};

// Actions Cell Renderer
const ActionsCellRenderer: React.FC<ICellRendererParams> = ({ data, onEdit, onDelete, onView }) => {
  return (
    <div className="flex items-center space-x-2">
      {onView && (
        <button
          onClick={() => onView(data)}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(data)}
          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(data)}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const DataTable: React.FC<DataTableProps> = ({
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
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState<any>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Grid options
  const gridOptions: GridOptions = {
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
  };

  // Enhanced columns with actions
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

  const handleRowClick = (event: any) => {
    if (onRowClick) {
      onRowClick(event.data);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (gridApi) {
      gridApi.setQuickFilter(event.target.value);
    }
  };

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
};

export default DataTable; 