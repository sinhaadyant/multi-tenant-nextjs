"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Folder,
  FolderOpen,
  Settings,
  Filter,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { Module } from "@/types/entities";
import type {
  TableColumn,
  FilterGroup,
  PaginatedResponse,
} from "@/types/common";

// Submodule list columns
const columns: TableColumn<Module>[] = [
  {
    key: "name",
    label: "Submodule Name",
    sortable: true,
    searchable: true,
    render: (value, record) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          {record.is_active ? (
            <FolderOpen className="h-4 w-4 text-green-600" />
          ) : (
            <Folder className="h-4 w-4 text-gray-400" />
          )}
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
    key: "parent",
    label: "Parent Module",
    sortable: true,
    searchable: true,
    render: (value, record) => {
      const parentModule = record.parent;
      return (
        <div className="flex items-center space-x-2">
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">
            {parentModule?.name || "No Parent"}
          </span>
        </div>
      );
    },
  },
  {
    key: "icon",
    label: "Icon",
    render: value => (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{value || "📄"}</span>
        <span className="text-sm text-gray-500">{value || "Default"}</span>
      </div>
    ),
  },
  {
    key: "route",
    label: "Route",
    render: value => (
      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
        {value || "/"}
      </code>
    ),
  },
  {
    key: "is_active",
    label: "Status",
    sortable: true,
    filterable: true,
    render: value => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    key: "key",
    label: "Access",
    sortable: true,
    filterable: true,
    render: value => {
      const isSuperadminOnly =
        value === "tenant-management" || value === "backup-management";
      return (
        <Badge variant={isSuperadminOnly ? "destructive" : "outline"}>
          {isSuperadminOnly ? "Superadmin Only" : "All Users"}
        </Badge>
      );
    },
  },
  {
    key: "order",
    label: "Order",
    sortable: true,
    render: value => <span className="text-sm font-medium">{value || 0}</span>,
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
    key: "is_active",
    label: "Status",
    type: "select",
    options: [
      { label: "All", value: "" },
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
  {
    key: "parent_id",
    label: "Parent Module",
    type: "select",
    options: [
      { label: "All", value: "" },
      { label: "Users", value: "users" },
      { label: "Roles", value: "roles" },
      { label: "Tenants", value: "tenants" },
      { label: "Backup", value: "backup" },
    ],
  },
];

export default function SubmodulesPage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedSubmodules, setSelectedSubmodules] = useState<string[]>([]);

  // Bulk operations - moved before permission check
  const bulkActivateMutation = usePostMutation("/submodules/bulk-activate");
  const bulkDeactivateMutation = usePostMutation("/submodules/bulk-deactivate");
  const bulkDeleteMutation = usePostMutation("/submodules/bulk-delete");

  // Check permissions
  if (!canRead("submodules")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view submodules.
          </p>
        </div>
      </div>
    );
  }

  // Fetch submodules data
  const fetchSubmodules = async (
    params: any
  ): Promise<PaginatedResponse<Module>> => {
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

    const response = await fetch(`/api/submodules?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch submodules");
    }

    return response.json();
  };

  const handleViewSubmodule = (record: Module) => {
    router.push(`/submodules/${record.id}`);
  };

  const handleEditSubmodule = (submoduleId: string) => {
    router.push(`/submodules/${submoduleId}/edit`);
  };

  const handleCreateSubmodule = () => {
    router.push("/submodules/create");
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSubmodules(selectedIds);
  };

  const handleBulkActivate = async () => {
    if (selectedSubmodules.length === 0) {
      error({ message: "Please select submodules to activate" });
      return;
    }

    try {
      await bulkActivateMutation.mutateAsync({
        submodule_ids: selectedSubmodules,
      });
      success({
        message: `${selectedSubmodules.length} submodules activated successfully`,
      });
      setSelectedSubmodules([]);
    } catch (err) {
      error({ message: "Failed to activate submodules" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedSubmodules.length === 0) {
      error({ message: "Please select submodules to deactivate" });
      return;
    }

    try {
      await bulkDeactivateMutation.mutateAsync({
        submodule_ids: selectedSubmodules,
      });
      success({
        message: `${selectedSubmodules.length} submodules deactivated successfully`,
      });
      setSelectedSubmodules([]);
    } catch (err) {
      error({ message: "Failed to deactivate submodules" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubmodules.length === 0) {
      error({ message: "Please select submodules to delete" });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedSubmodules.length} submodules?`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({
        submodule_ids: selectedSubmodules,
      });
      success({
        message: `${selectedSubmodules.length} submodules deleted successfully`,
      });
      setSelectedSubmodules([]);
    } catch (err) {
      error({ message: "Failed to delete submodules" });
    }
  };

  const handleExport = (data: Module[]) => {
    const csvContent = [
      [
        "Name",
        "Parent Module",
        "Icon",
        "Route",
        "Status",
        "Access",
        "Order",
        "Created",
      ],
      ...data.map(submodule => [
        submodule.name,
        submodule.parent?.name || "No Parent",
        submodule.icon || "Default",
        submodule.route || "/",
        submodule.is_active ? "Active" : "Inactive",
        submodule.key === "tenant-management" ||
        submodule.key === "backup-management"
          ? "Superadmin Only"
          : "All Users",
        submodule.order?.toString() || "0",
        submodule.created_at
          ? new Date(submodule.created_at).toLocaleDateString()
          : "-",
      ]),
    ]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submodules.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submodules</h1>
            <p className="text-muted-foreground">
              Manage application submodules and their relationships
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canCreate("submodules") && (
            <Button onClick={handleCreateSubmodule}>
              <Plus className="h-4 w-4 mr-2" />
              Create Submodule
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submodules
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              All submodules in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Submodules
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Currently active submodules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Superadmin Only
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Superadmin-only submodules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Submodules without parent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable<Module>
        queryKey={["submodules"]}
        fetchData={fetchSubmodules}
        columns={columns}
        title="Submodules"
        description="Manage application submodules and their parent relationships"
        searchable={true}
        filterable={true}
        selectable={canDelete("submodules")}
        exportable={true}
        filters={filters}
        onRowClick={handleViewSubmodule}
        onSelectionChange={handleSelectionChange}
        onExport={handleExport}
        emptyMessage="No submodules found"
        loadingMessage="Loading submodules..."
        errorMessage="An error occurred while loading submodules"
      />

      {/* Bulk Actions */}
      {selectedSubmodules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Bulk Actions ({selectedSubmodules.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {canUpdate("submodules") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkActivate}
                    disabled={bulkActivateMutation.isPending}
                  >
                    Activate Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    disabled={bulkDeactivateMutation.isPending}
                  >
                    Deactivate Selected
                  </Button>
                </>
              )}
              {canDelete("submodules") && (
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
