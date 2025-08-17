"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  Building,
  Users,
  Shield,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/utils";
import { apiHelpers } from "@/lib/axios";
import { usePostMutation } from "@/hooks/useApiMutation";
import { notificationService } from "@/services/notificationService";
import DataTable from "@/components/ui/DataTable/DataTable";
import type { Tenant, PaginatedResponse } from "@/types";
import type { DataTableParams } from "@/components/ui/DataTable";

interface TenantWithStats extends Tenant {
  userCount: number;
  roleCount: number;
}

// Transform API response to match DataTable expectations
const transformTenantsResponse = (
  response: any
): PaginatedResponse<TenantWithStats> => {
  return {
    data: response.tenants || [],
    pagination: {
      current_page: response.meta?.page || 1,
      last_page: response.meta?.totalPages || 1,
      per_page: response.meta?.limit || 10,
      total: response.meta?.total || 0,
      from: ((response.meta?.page || 1) - 1) * (response.meta?.limit || 10) + 1,
      to: Math.min(
        (response.meta?.page || 1) * (response.meta?.limit || 10),
        response.meta?.total || 0
      ),
    },
  };
};

// Fetch data function for DataTable
const fetchTenants = async (
  params: DataTableParams
): Promise<PaginatedResponse<TenantWithStats>> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.per_page) queryParams.append("limit", params.per_page.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.sort_by) queryParams.append("sortBy", params.sort_by);
  if (params.sort_order) queryParams.append("sortOrder", params.sort_order);

  // Handle filters
  if (params.filters) {
    params.filters.forEach((filter: any) => {
      if (filter.key === "isActive") {
        queryParams.append("isActive", filter.value.toString());
      }
    });
  }

  const response = await apiHelpers.get(`/tenants?${queryParams.toString()}`);
  return transformTenantsResponse(response.data);
};

export function TenantDataTable() {
  const router = useRouter();
  const { canUpdate, canDelete, canRead } = usePermissions();
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  // Bulk operations
  const bulkActivateMutation = usePostMutation("/tenants/bulk-activate");
  const bulkDeactivateMutation = usePostMutation("/tenants/bulk-deactivate");
  const bulkDeleteMutation = usePostMutation("/tenants/bulk-delete");

  const handleEdit = (tenant: TenantWithStats) => {
    router.push(`/tenants/${tenant.id}/edit`);
  };

  const handleView = (tenant: TenantWithStats) => {
    router.push(`/tenants/${tenant.id}`);
  };

  const handleDelete = (tenant: TenantWithStats) => {
    router.push(`/tenants/${tenant.id}/delete`);
  };

  const handleCreate = () => {
    router.push("/tenants/create");
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedTenants(selectedIds);
  };

  const handleBulkActivate = async () => {
    if (selectedTenants.length === 0) {
      notificationService.error({
        message: "Please select tenants to activate",
      });
      return;
    }

    try {
      await bulkActivateMutation.mutateAsync({ tenant_ids: selectedTenants });
      notificationService.success({
        message: `${selectedTenants.length} tenants activated successfully`,
      });
      setSelectedTenants([]);
    } catch (err) {
      notificationService.error({ message: "Failed to activate tenants" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedTenants.length === 0) {
      notificationService.error({
        message: "Please select tenants to deactivate",
      });
      return;
    }

    try {
      await bulkDeactivateMutation.mutateAsync({ tenant_ids: selectedTenants });
      notificationService.success({
        message: `${selectedTenants.length} tenants deactivated successfully`,
      });
      setSelectedTenants([]);
    } catch (err) {
      notificationService.error({ message: "Failed to deactivate tenants" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTenants.length === 0) {
      notificationService.error({ message: "Please select tenants to delete" });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedTenants.length} tenants?`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({ tenant_ids: selectedTenants });
      notificationService.success({
        message: `${selectedTenants.length} tenants deleted successfully`,
      });
      setSelectedTenants([]);
    } catch (err) {
      notificationService.error({ message: "Failed to delete tenants" });
    }
  };

  const handleExport = (data: TenantWithStats[]) => {
    const csvContent = [
      ["Name", "Domain", "Status", "Users", "Roles", "Created"],
      ...data.map(tenant => [
        tenant.name,
        tenant.domain || "N/A",
        tenant.is_active ? "Active" : "Inactive",
        tenant.userCount.toString(),
        tenant.roleCount.toString(),
        formatDate(tenant.created_at),
      ]),
    ];

    const csvString = csvContent.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value: string, record: TenantWithStats) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "domain",
      label: "Domain",
      render: (value: string) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "userCount",
      label: "Users",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          {value}
        </div>
      ),
    },
    {
      key: "roleCount",
      label: "Roles",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-muted-foreground" />
          {value}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right" as const,
      render: (value: any, record: TenantWithStats) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {canRead("tenants") && (
              <DropdownMenuItem onClick={() => handleView(record)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
            {canUpdate("tenants") && (
              <DropdownMenuItem onClick={() => handleEdit(record)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete("tenants") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(record)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: "isActive",
      label: "Status",
      type: "select" as const,
      placeholder: "Filter by status",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tenants</h2>
          <p className="text-sm text-muted-foreground">
            Manage multi-tenant organizations and their configurations
          </p>
        </div>
        {canUpdate("tenants") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedTenants.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-800">
                {selectedTenants.length} tenant(s) selected
              </p>
              <div className="flex space-x-2">
                {canUpdate("tenants") && (
                  <>
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
                  </>
                )}
                {canDelete("tenants") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DataTable */}
      <DataTable
        queryKey={["tenants"]}
        fetchData={fetchTenants}
        columns={columns}
        title="Tenants"
        searchable={true}
        filterable={true}
        selectable={true}
        exportable={true}
        filters={filters}
        onSelectionChange={handleSelectionChange}
        onExport={handleExport}
        emptyMessage="No tenants found"
        loadingMessage="Loading tenants..."
        errorMessage="Error loading tenants"
        onRowClick={canRead("tenants") ? handleView : undefined}
      />
    </div>
  );
}
