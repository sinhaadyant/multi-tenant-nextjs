"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { User, Role } from "@/types/entities";
import type {
  TableColumn,
  FilterGroup,
  PaginatedResponse,
} from "@/types/common";

// User list columns
const columns: TableColumn<User>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    searchable: true,
    render: (value, record) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          {record.avatar ? (
            <img
              src={record.avatar}
              alt={value}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {value.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    searchable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">No Role</span>;
      return (
        <Badge variant={value.is_system ? "default" : "secondary"}>
          {value.name}
        </Badge>
      );
    },
  },
  {
    key: "tenant",
    label: "Tenant",
    sortable: true,
    searchable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">No Tenant</span>;
      return <span className="text-sm">{value.name}</span>;
    },
  },
  {
    key: "is_active",
    label: "Status",
    sortable: true,
    filterable: true,
    render: value => (
      <Badge variant={value ? "default" : "destructive"}>
        {value ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    key: "last_login_at",
    label: "Last Login",
    sortable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">Never</span>;
      const date = new Date(value);
      return (
        <div>
          <div className="text-sm">{date.toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">
            {date.toLocaleTimeString()}
          </div>
        </div>
      );
    },
  },
  {
    key: "created_at",
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewUser(record.id)}
        >
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditUser(record.id)}
        >
          Edit
        </Button>
      </div>
    ),
  },
];

// Filter options
const filters: FilterGroup[] = [
  {
    key: "is_active",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { label: "All", value: "" },
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
  {
    key: "role_id",
    label: "Role",
    type: "select",
    placeholder: "All Roles",
    options: [
      { label: "All", value: "" },
      // Will be populated dynamically
    ],
  },
];

export default function UsersPage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch roles for filter options - moved before permission check
  const { data: rolesData } = useApiQuery<{ data: Role[] }>(
    ["roles"],
    "/roles",
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Update filters with roles - moved before permission check
  const updatedFilters = React.useMemo(() => {
    if (!rolesData?.data) return filters;

    const roleOptions = [
      { label: "All", value: "" },
      ...rolesData?.data?.map((role: Role) => ({
        label: role.name,
        value: role.id,
      })),
    ];

    return filters.map(filter =>
      filter.key === "role_id" ? { ...filter, options: roleOptions } : filter
    );
  }, [rolesData]);

  // Bulk operations - moved before permission check
  const bulkActivateMutation = usePostMutation("/users/bulk-activate");
  const bulkDeactivateMutation = usePostMutation("/users/bulk-deactivate");
  const bulkDeleteMutation = usePostMutation("/users/bulk-delete");

  // Check permissions
  if (!canRead("user-management")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  // Fetch users data
  const fetchUsers = async (params: any): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params.sort_order) queryParams.append("sort_order", params.sort_order);

    if (params.filters) {
      params.filters.forEach((filter: any) => {
        if (filter.value !== "") {
          queryParams.append(filter.key, filter.value.toString());
        }
      });
    }

    const response = await fetch(`/api/users?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return response.json();
  };

  const handleViewUser = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleCreateUser = () => {
    router.push("/users/create");
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedUsers(selectedIds);
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) {
      error({ message: "Please select users to activate" });
      return;
    }

    try {
      await bulkActivateMutation.mutateAsync({ user_ids: selectedUsers });
      success({
        message: `${selectedUsers.length} users activated successfully`,
      });
      setSelectedUsers([]);
    } catch (err) {
      error({ message: "Failed to activate users" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) {
      error({ message: "Please select users to deactivate" });
      return;
    }

    try {
      await bulkDeactivateMutation.mutateAsync({ user_ids: selectedUsers });
      success({
        message: `${selectedUsers.length} users deactivated successfully`,
      });
      setSelectedUsers([]);
    } catch (err) {
      error({ message: "Failed to deactivate users" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      error({ message: "Please select users to delete" });
      return;
    }

    if (
      !confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({ user_ids: selectedUsers });
      success({
        message: `${selectedUsers.length} users deleted successfully`,
      });
      setSelectedUsers([]);
    } catch (err) {
      error({ message: "Failed to delete users" });
    }
  };

  const handleExport = (data: User[]) => {
    const csvContent = [
      ["Name", "Email", "Role", "Tenant", "Status", "Last Login", "Created"],
      ...data.map(user => [
        user.name,
        user.email,
        user.role?.name || "No Role",
        user.tenant?.name || "No Tenant",
        user.is_active ? "Active" : "Inactive",
        user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString()
          : "Never",
        new Date(user.created_at).toLocaleDateString(),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  New This Month
                </p>
                <p className="text-2xl font-bold">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-800">
                {selectedUsers.length} user(s) selected
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkActivate}
                  disabled={bulkActivateMutation.isPending}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDeactivate}
                  disabled={bulkDeactivateMutation.isPending}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<User>
            queryKey={["users"]}
            fetchData={fetchUsers}
            columns={columns}
            searchable={true}
            filterable={true}
            selectable={true}
            exportable={true}
            filters={updatedFilters}
            onSelectionChange={handleSelectionChange}
            onExport={handleExport}
            emptyMessage="No users found"
            loadingMessage="Loading users..."
            errorMessage="Failed to load users"
          />
        </CardContent>
      </Card>
    </div>
  );
}
