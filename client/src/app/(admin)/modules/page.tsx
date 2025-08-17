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

// Module list columns
const columns: TableColumn<Module>[] = [
  {
    key: "name",
    label: "Module Name",
    sortable: true,
    searchable: true,
    render: (value, record) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          {record.is_active ? (
            <FolderOpen className="h-4 w-4 text-blue-600" />
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
    key: "icon",
    label: "Icon",
    render: value => (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{value || "📁"}</span>
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
      const isSuperadminOnly = value === "tenants" || value === "backup";
      return (
        <Badge variant={isSuperadminOnly ? "destructive" : "outline"}>
          {isSuperadminOnly ? "Superadmin Only" : "All Users"}
        </Badge>
      );
    },
  },
  {
    key: "children",
    label: "Submodules",
    render: (value, record) => {
      const submoduleCount = record.children?.length || 0;
      return (
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">{submoduleCount}</span>
          <span className="text-xs text-gray-500">submodules</span>
        </div>
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
    key: "key",
    label: "Access Level",
    type: "select",
    options: [
      { label: "All", value: "" },
      { label: "Superadmin Only", value: "tenants,backup" },
      { label: "All Users", value: "users,roles,modules" },
    ],
  },
];

export default function ModulesPage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Bulk operations - moved before permission check
  const bulkActivateMutation = usePostMutation("/modules/bulk-activate");
  const bulkDeactivateMutation = usePostMutation("/modules/bulk-deactivate");
  const bulkDeleteMutation = usePostMutation("/modules/bulk-delete");

  // Check permissions
  if (!canRead("modules")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view modules.
          </p>
        </div>
      </div>
    );
  }

  // Fetch modules data
  const fetchModules = async (
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

    const response = await fetch(`/api/modules?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch modules");
    }

    return response.json();
  };

  const handleViewModule = (record: Module) => {
    router.push(`/modules/${record.id}`);
  };

  const handleEditModule = (moduleId: string) => {
    router.push(`/modules/${moduleId}/edit`);
  };

  const handleCreateModule = () => {
    router.push("/modules/create");
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedModules(selectedIds);
  };

  const handleBulkActivate = async () => {
    if (selectedModules.length === 0) {
      error({ message: "Please select modules to activate" });
      return;
    }

    try {
      await bulkActivateMutation.mutateAsync({ module_ids: selectedModules });
      success({
        message: `${selectedModules.length} modules activated successfully`,
      });
      setSelectedModules([]);
    } catch (err) {
      error({ message: "Failed to activate modules" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedModules.length === 0) {
      error({ message: "Please select modules to deactivate" });
      return;
    }

    try {
      await bulkDeactivateMutation.mutateAsync({ module_ids: selectedModules });
      success({
        message: `${selectedModules.length} modules deactivated successfully`,
      });
      setSelectedModules([]);
    } catch (err) {
      error({ message: "Failed to deactivate modules" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedModules.length === 0) {
      error({ message: "Please select modules to delete" });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedModules.length} modules?`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({ module_ids: selectedModules });
      success({
        message: `${selectedModules.length} modules deleted successfully`,
      });
      setSelectedModules([]);
    } catch (err) {
      error({ message: "Failed to delete modules" });
    }
  };

  const handleExport = (data: Module[]) => {
    const csvContent = [
      [
        "Name",
        "Icon",
        "Route",
        "Status",
        "Access",
        "Submodules",
        "Order",
        "Created",
      ],
      ...data.map(module => [
        module.name,
        module.icon || "Default",
        module.route || "/",
        module.is_active ? "Active" : "Inactive",
        module.key === "tenants" || module.key === "backup"
          ? "Superadmin Only"
          : "All Users",
        module.children?.length?.toString() || "0",
        module.order?.toString() || "0",
        module.created_at
          ? new Date(module.created_at).toLocaleDateString()
          : "-",
      ]),
    ]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modules.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
            <p className="text-muted-foreground">
              Manage application modules and menu structure
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canCreate("modules") && (
            <Button onClick={handleCreateModule}>
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              All modules in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Modules
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Currently active modules
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
              Superadmin-only modules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submodules
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              All submodules across modules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable<Module>
        queryKey={["modules"]}
        fetchData={fetchModules}
        columns={columns}
        title="Modules"
        description="Manage application modules and their submodules"
        searchable={true}
        filterable={true}
        selectable={canDelete("modules")}
        exportable={true}
        filters={filters}
        onRowClick={handleViewModule}
        onSelectionChange={handleSelectionChange}
        onExport={handleExport}
        emptyMessage="No modules found"
        loadingMessage="Loading modules..."
        errorMessage="An error occurred while loading modules"
      />

      {/* Bulk Actions */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Bulk Actions ({selectedModules.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {canUpdate("modules") && (
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
              {canDelete("modules") && (
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
