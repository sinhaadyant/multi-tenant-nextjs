"use client";

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX, Key } from 'lucide-react';
import { User } from '@/hooks/useUsers';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';

interface UserTableProps {
  users: User[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortingChange: (sorting: SortingState) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
}

const columnHelper = createColumnHelper<User>();

// Mobile Actions Dropdown Component
const UserActionsDropdown: React.FC<{
  user: User;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
}> = ({ user, onViewUser, onEditUser, onDeleteUser, onToggleStatus, onResetPassword }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-toggle"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-48 z-50"
      >
        <DropdownItem onItemClick={() => { onViewUser(user); setIsOpen(false); }}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownItem>
        <DropdownItem onItemClick={() => { onEditUser(user); setIsOpen(false); }}>
          <Edit className="w-4 h-4 mr-2" />
          Edit User
        </DropdownItem>
        <DropdownItem onItemClick={() => { onToggleStatus(user); setIsOpen(false); }}>
          {user.isActive ? (
            <>
              <UserX className="w-4 h-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </DropdownItem>
        <DropdownItem onItemClick={() => { onResetPassword(user); setIsOpen(false); }}>
          <Key className="w-4 h-4 mr-2" />
          Reset Password
        </DropdownItem>
        <DropdownItem 
          onItemClick={() => { onDeleteUser(user); setIsOpen(false); }}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User
        </DropdownItem>
      </Dropdown>
    </div>
  );
};

// Skeleton loader for the table
const UserTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {['Name', 'Tenant', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map((header) => (
                <th
                  key={header}
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  style={{ 
                    width: header === 'Name' ? '200px' : 
                           header === 'Tenant' ? '150px' : 
                           header === 'Role' ? '150px' : 
                           header === 'Status' ? '100px' : 
                           header === 'Last Login' ? '120px' : 
                           header === 'Created' ? '120px' : 
                           header === 'Actions' ? '100px' : 'auto'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 10 }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }, (_, j) => (
                  <td 
                    key={j} 
                    className="px-3 sm:px-6 py-4 whitespace-nowrap"
                    style={{ 
                      width: j === 0 ? '200px' : 
                             j === 1 ? '150px' : 
                             j === 2 ? '150px' : 
                             j === 3 ? '100px' : 
                             j === 4 ? '120px' : 
                             j === 5 ? '120px' : 
                             j === 6 ? '100px' : 'auto'
                    }}
                  >
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onResetPassword,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      size: 200,
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {row.original.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {row.original.email}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('tenant', {
      header: 'Tenant',
      size: 150,
      cell: ({ getValue }) => {
        const tenant = getValue();
        return tenant ? (
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {tenant.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {tenant.slug}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">No tenant</span>
        );
      },
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      size: 150,
      cell: ({ getValue }) => {
        const role = getValue();
        return role ? (
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {role.name}
            </div>
            {role.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {role.description}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">No role</span>
        );
      },
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      size: 100,
      cell: ({ getValue }) => {
        const isActive = getValue();
        return (
          <Badge
            variant="light"
            color={isActive ? 'success' : 'error'}
            size="sm"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('lastLogin', {
      header: 'Last Login',
      size: 120,
      cell: ({ getValue }) => {
        const lastLogin = getValue();
        return lastLogin ? (
          <div className="text-sm text-gray-900 dark:text-white">
            {new Date(lastLogin).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">Never</span>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      size: 120,
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {new Date(getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: ({ row }) => {
        const [isOpen, setIsOpen] = useState(false);
        
        return (
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="dropdown-toggle"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            <Dropdown
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              className="w-48 z-50"
            >
              <DropdownItem onItemClick={() => { onViewUser(row.original); setIsOpen(false); }}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownItem>
              <DropdownItem onItemClick={() => { onEditUser(row.original); setIsOpen(false); }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </DropdownItem>
              <DropdownItem onItemClick={() => { onToggleStatus(row.original); setIsOpen(false); }}>
                {row.original.isActive ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownItem>
              <DropdownItem onItemClick={() => { onResetPassword(row.original); setIsOpen(false); }}>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </DropdownItem>
              <DropdownItem 
                onItemClick={() => { onDeleteUser(row.original); setIsOpen(false); }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownItem>
            </Dropdown>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange(newSorting);
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
  });

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    onPageSizeChange(pageSize);
  };

  if (loading) {
    return <UserTableSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <div className="flex flex-col">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <div className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="light"
                    color={user.isActive ? 'success' : 'error'}
                    size="sm"
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <UserActionsDropdown
                    user={user}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    onToggleStatus={onToggleStatus}
                    onResetPassword={onResetPassword}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tenant:</span>
                  <p className="text-gray-900 dark:text-white truncate">
                    {user.tenant?.name || 'No tenant'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Role:</span>
                  <p className="text-gray-900 dark:text-white truncate">
                    {user.role?.name || 'No role'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                  <p className="text-gray-900 dark:text-white">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
            <select
              value={pagination.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
