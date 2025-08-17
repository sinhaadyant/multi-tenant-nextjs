"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield, Users, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { Role } from "@/types/entities";
import type {
  TableColumn,
  FilterGroup,
  PaginatedResponse,
} from "@/types/common";

// Role list columns
const columns: TableColumn<Role>[] = [
  {
    key: "name",
    label: "Role Name",
    sortable: true,
    searchable: true,
    render: (value, record) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <div className="font-medium">{value}</div>
          {record.description && (
            <div className="text-sm text-gray-500">{record.description}</div>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "is_system",
    label: "Type",
    sortable: true,
    filterable: true,
    render: value => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "System" : "Custom"}
      </Badge>
    ),
  },
  {
    key: "tenant_id",
    label: "Tenant",
    sortable: true,
    searchable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">Global Role</span>;
      return <span className="text-sm">{value}</span>;
    },
  },
  {
    key: "users_count",
    label: "Users",
    sortable: true,
    render: (value, record) => (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">{value || 0}</span>
      </div>
    ),
  },
  {
    key: "permissions",
    label: "Permissions",
    render: (value, record) => {
      const permissionCount = record.permissions?.length || 0;
      return (
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{permissionCount} modules</span>
        </div>
      );
    },
  },
  {
    key: "created_at",
    label: "Created",
    sortable: true,
    render: value => {
      if (!value) return <span className="text-gray-400">-</span>;
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
];

// Filter groups
const filters: FilterGroup[] = [
  {
    key: "isGlobal",
    label: "Role Type",
    type: "select",
    options: [
      { label: "All", value: "" },
      { label: "Global", value: "true" },
      { label: "Tenant", value: "false" },
    ],
  },
];

export default function RolesPage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Bulk operations - moved before permission check
  const bulkDeleteMutation = usePostMutation("/roles/bulk-delete");

  // Check permissions
  if (!canRead("roles")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view roles.
          </p>
        </div>
      </div>
    );
  }

  // Fetch roles data
  const fetchRoles = async (params: any): Promise<PaginatedResponse<Role>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page)
      queryParams.append("limit", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.sort_by) queryParams.append("sortBy", params.sort_by);
    if (params.sort_order) queryParams.append("sortOrder", params.sort_order);

    if (params.filters) {
      params.filters.forEach((filter: any) => {
        if (filter.value !== "") {
          queryParams.append(filter.key, filter.value.toString());
        }
      });
    }

    const response = await fetch(`/api/roles?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }

    return response.json();
  };

  const handleViewRole = (record: Role) => {
    router.push(`/roles/${record.id}`);
  };

  const handleEditRole = (roleId: string) => {
    router.push(`/roles/${roleId}/edit`);
  };

  const handleCreateRole = () => {
    router.push("/roles/create");
  };

  const handleCloneRole = (roleId: string) => {
    router.push(`/roles/${roleId}/clone`);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedRoles(selectedIds);
  };

  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) {
      error({ message: "Please select roles to delete" });
      return;
    }

    if (
      !confirm(`Are you sure you want to delete ${selectedRoles.length} roles?`)
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({ role_ids: selectedRoles });
      success({
        message: `${selectedRoles.length} roles deleted successfully`,
      });
      setSelectedRoles([]);
    } catch (err) {
      error({ message: "Failed to delete roles" });
    }
  };

  const handleExport = (data: Role[]) => {
    const csvContent = [
      ["Name", "Type", "Tenant", "Users", "Permissions", "Created"],
      ...data.map(role => [
        role.name,
        role.is_system ? "System" : "Custom",
        role.tenant_id || "Global",
        role.users_count?.toString() || "0",
        role.permissions?.length?.toString() || "0",
        role.created_at ? new Date(role.created_at).toLocaleDateString() : "-",
      ]),
    ]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roles.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
            <p className="text-muted-foreground">
              Manage roles and their permissions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canCreate("roles") && (
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              All roles in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">System-wide roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Tenant-specific roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Users with roles assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable<Role>
        queryKey={["roles"]}
        fetchData={fetchRoles}
        columns={columns}
        title="Roles"
        description="Manage system roles and their permissions"
        searchable={true}
        filterable={true}
        selectable={canDelete("roles")}
        exportable={true}
        filters={filters}
        onRowClick={handleViewRole}
        onSelectionChange={handleSelectionChange}
        onExport={handleExport}
        emptyMessage="No roles found"
        loadingMessage="Loading roles..."
        errorMessage="An error occurred while loading roles"
      />

      {/* Bulk Actions */}
      {selectedRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Bulk Actions ({selectedRoles.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {canDelete("roles") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  Delete Selected
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
