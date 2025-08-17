"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "./DataTable";
import { useNotification } from "@/hooks/useNotification";
import type {
  TableColumn,
  FilterGroup,
  PaginatedResponse,
} from "@/types/common";

// Mock data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastLogin: string | null;
  createdAt: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "active",
    lastLogin: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "active",
    lastLogin: "2024-01-14T15:45:00Z",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Manager",
    status: "inactive",
    lastLogin: "2024-01-10T09:20:00Z",
    createdAt: "2024-01-03T00:00:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "User",
    status: "pending",
    lastLogin: null,
    createdAt: "2024-01-04T00:00:00Z",
  },
  {
    id: "5",
    name: "Charlie Wilson",
    email: "charlie@example.com",
    role: "Admin",
    status: "active",
    lastLogin: "2024-01-13T14:15:00Z",
    createdAt: "2024-01-05T00:00:00Z",
  },
];

// Mock API function
const fetchUsers = async (params: any): Promise<PaginatedResponse<User>> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  let filteredData = [...mockUsers];

  // Apply search
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredData = filteredData.filter(
      user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
    );
  }

  // Apply status filter
  if (params.filters) {
    const statusFilter = params.filters.find((f: any) => f.key === "status");
    if (statusFilter) {
      filteredData = filteredData.filter(
        user => user.status === statusFilter.value
      );
    }
  }

  // Apply sorting
  if (params.sort_by) {
    filteredData.sort((a, b) => {
      const aValue = a[params.sort_by as keyof User];
      const bValue = b[params.sort_by as keyof User];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return params.sort_order === "asc" ? 1 : -1;
      if (bValue === null) return params.sort_order === "asc" ? -1 : 1;

      if (aValue < bValue) return params.sort_order === "asc" ? -1 : 1;
      if (aValue > bValue) return params.sort_order === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Apply pagination
  const page = params.page || 1;
  const perPage = params.per_page || 10;
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      current_page: page,
      last_page: Math.ceil(filteredData.length / perPage),
      per_page: perPage,
      total: filteredData.length,
      from: startIndex + 1,
      to: Math.min(endIndex, filteredData.length),
    },
  };
};

// Column definitions
const columns: TableColumn<User>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    searchable: true,
    render: (value, record) => (
      <div>
        <div className="font-medium">{value}</div>
        <div className="text-sm text-gray-500">{record.email}</div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    searchable: true,
    render: value => (
      <Badge variant={value === "Admin" ? "default" : "secondary"}>
        {value}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    filterable: true,
    render: value => {
      const variants: Record<string, "default" | "destructive" | "secondary"> =
        {
          active: "default",
          inactive: "destructive",
          pending: "secondary",
        };

      return (
        <Badge variant={variants[value] || "secondary"}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: "lastLogin",
    label: "Last Login",
    sortable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">Never</span>;

      const date = new Date(value);
      return (
        <div>
          <div>{date.toLocaleDateString()}</div>
          <div className="text-sm text-gray-500">
            {date.toLocaleTimeString()}
          </div>
        </div>
      );
    },
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    render: value => {
      const date = new Date(value);
      return date.toLocaleDateString();
    },
  },
  {
    key: "actions",
    label: "Actions",
    align: "right",
    render: (_, record) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline">
          Edit
        </Button>
        <Button size="sm" variant="outline" className="text-red-600">
          Delete
        </Button>
      </div>
    ),
  },
];

// Filter definitions
const filters: FilterGroup[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { label: "All", value: "" },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Pending", value: "pending" },
    ],
  },
];

export const DataTableExample: React.FC = () => {
  const { success, error } = useNotification();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleRowClick = (user: User) => {
    success({ message: `Clicked on user: ${user.name}` });
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedUsers(selectedIds);
    success({ message: `Selected ${selectedIds.length} users` });
  };

  const handleExport = (data: User[]) => {
    // Simulate export
    const csvContent = [
      ["Name", "Email", "Role", "Status", "Last Login", "Created"],
      ...data.map(user => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.lastLogin || "Never",
        user.createdAt,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">DataTable Example</h2>
        <p className="text-gray-600">
          This example demonstrates the DataTable component with search,
          filtering, sorting, pagination, and export functionality.
        </p>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Selected {selectedUsers.length} user(s): {selectedUsers.join(", ")}
          </p>
        </div>
      )}

      <DataTable<User>
        queryKey={["users", "example"]}
        fetchData={fetchUsers}
        columns={columns}
        title="Users"
        description="Manage user accounts and permissions"
        searchable={true}
        filterable={true}
        selectable={true}
        exportable={true}
        filters={filters}
        onRowClick={handleRowClick}
        onSelectionChange={handleSelectionChange}
        onExport={handleExport}
        emptyMessage="No users found"
        loadingMessage="Loading users..."
        errorMessage="Failed to load users"
      />
    </div>
  );
};
