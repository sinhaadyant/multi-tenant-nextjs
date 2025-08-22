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
import { User } from '@/hooks/useTenantUsers';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';

interface TenantUserTableProps {
  users: User[];
  loading: boolean;
  pagination?: {
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

const TenantUserTable: React.FC<TenantUserTableProps> = ({
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
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {row.original.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('contactNumber', {
      header: 'Contact',
      cell: ({ getValue }) => (
        <span className="text-gray-600">{getValue() || 'N/A'}</span>
      ),
    }),
    columnHelper.accessor('roles', {
      header: 'Roles',
      cell: ({ getValue }) => {
        const roles = getValue();
        return (
          <div className="flex flex-wrap gap-1">
            {roles && roles.length > 0 ? (
              roles.map((role, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No roles</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'success' : 'danger'}>
          {getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),
    columnHelper.accessor('lastLogin', {
      header: 'Last Login',
      cell: ({ getValue }) => {
        const lastLogin = getValue();
        return (
          <span className="text-gray-600">
            {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}
          </span>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-gray-600">
          {new Date(getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewUser(row.original)}
            className="hidden md:flex"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditUser(row.original)}
            className="hidden md:flex"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <UserActionsDropdown
            user={row.original}
            onViewUser={onViewUser}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
            onToggleStatus={onToggleStatus}
            onResetPassword={onResetPassword}
          />
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      pagination: paginationState,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange(newSorting);
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(paginationState) : updater;
      setPaginationState(newPagination);
      onPageChange(newPagination.pageIndex + 1);
      onPageSizeChange(newPagination.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-b"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
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
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalRecords)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalRecords}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-l-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  const isCurrentPage = pageNumber === pagination.page;
                  const isNearCurrent = Math.abs(pageNumber - pagination.page) <= 2;
                  
                  if (isCurrentPage || isNearCurrent || pageNumber === 1 || pageNumber === pagination.totalPages) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={isCurrentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(pageNumber)}
                        className="rounded-none"
                      >
                        {pageNumber}
                      </Button>
                    );
                  } else if (pageNumber === 2 || pageNumber === pagination.totalPages - 1) {
                    return <span key={pageNumber} className="px-3 py-2 text-gray-500">...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-r-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantUserTable;
