"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  CheckSquare,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Settings,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";
import type { TenantWithStats } from "@/types";

interface BulkOperationsProps {
  tenants: TenantWithStats[];
  selectedTenants: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRefresh: () => void;
}

export function BulkOperations({
  tenants,
  selectedTenants,
  onSelectionChange,
  onRefresh,
}: BulkOperationsProps) {
  const { canUpdate, canDelete } = usePermissions();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const activateMutation = useApiMutation(
    async (tenantIds: string[]) => {
      const response = await apiHelpers.post("/tenants/bulk/activate", {
        tenant_ids: tenantIds,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        notificationService.success({
          message: `${selectedTenants.length} tenant(s) activated successfully`,
        });
        onRefresh();
        onSelectionChange([]);
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to activate tenants",
        });
      },
    }
  );

  const deactivateMutation = useApiMutation(
    async (tenantIds: string[]) => {
      const response = await apiHelpers.post("/tenants/bulk/deactivate", {
        tenant_ids: tenantIds,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        notificationService.success({
          message: `${selectedTenants.length} tenant(s) deactivated successfully`,
        });
        onRefresh();
        onSelectionChange([]);
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to deactivate tenants",
        });
      },
    }
  );

  const deleteMutation = useApiMutation(
    async (tenantIds: string[]) => {
      const response = await apiHelpers.post("/tenants/bulk/delete", {
        tenant_ids: tenantIds,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        notificationService.success({
          message: `${selectedTenants.length} tenant(s) deleted successfully`,
        });
        onRefresh();
        onSelectionChange([]);
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to delete tenants",
        });
      },
    }
  );

  const exportMutation = useApiMutation(
    async (tenantIds: string[]) => {
      const response = await apiHelpers.post("/tenants/bulk/export", {
        tenant_ids: tenantIds,
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Create and download the file
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tenants-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notificationService.success({
          message: "Tenant data exported successfully",
        });
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to export tenant data",
        });
      },
    }
  );

  const handleSelectAll = () => {
    if (selectedTenants.length === tenants.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tenants.map((tenant) => tenant.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTenants.length === 0) {
      notificationService.error({
        message: "Please select at least one tenant",
      });
      return;
    }

    setBulkAction(action);
    setShowConfirmDialog(true);
  };

  const confirmBulkAction = async () => {
    setIsProcessing(true);
    try {
      switch (bulkAction) {
        case "activate":
          await activateMutation.mutateAsync(selectedTenants);
          break;
        case "deactivate":
          await deactivateMutation.mutateAsync(selectedTenants);
          break;
        case "delete":
          await deleteMutation.mutateAsync(selectedTenants);
          break;
        case "export":
          await exportMutation.mutateAsync(selectedTenants);
          break;
      }
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const getSelectedTenantsInfo = () => {
    const selected = tenants.filter((tenant) =>
      selectedTenants.includes(tenant.id)
    );
    const activeCount = selected.filter((t) => t.is_active).length;
    const inactiveCount = selected.length - activeCount;
    const hasUsers = selected.some((t) => t.userCount > 0);
    const hasRoles = selected.some((t) => t.roleCount > 0);

    return {
      selected,
      activeCount,
      inactiveCount,
      hasUsers,
      hasRoles,
    };
  };

  const { selected, activeCount, inactiveCount, hasUsers, hasRoles } =
    getSelectedTenantsInfo();

  if (selectedTenants.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-muted/50 border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedTenants.length === tenants.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedTenants.length} of {tenants.length} selected
              </span>
            </div>
            <Badge variant="secondary">
              {activeCount} active, {inactiveCount} inactive
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {canUpdate("tenants") && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("activate")}
                    disabled={activeCount === selected.length}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Activate ({selected.length - activeCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("deactivate")}
                    disabled={inactiveCount === selected.length}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Deactivate ({activeCount})
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>

              {canDelete("tenants") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("delete")}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selected.length})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Warning for tenants with data */}
        {(hasUsers || hasRoles) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {hasUsers && hasRoles
                ? `${selected.filter((t) => t.userCount > 0 || t.roleCount > 0).length} selected tenant(s) have users and roles. Deleting these tenants will also remove all associated data.`
                : hasUsers
                ? `${selected.filter((t) => t.userCount > 0).length} selected tenant(s) have users. Deleting these tenants will also remove all associated users.`
                : `${selected.filter((t) => t.roleCount > 0).length} selected tenant(s) have roles. Deleting these tenants will also remove all associated roles.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Tenants Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {selected.slice(0, 6).map((tenant) => (
            <div
              key={tenant.id}
              className="flex items-center justify-between p-2 bg-background rounded border text-sm"
            >
              <span className="font-medium truncate">{tenant.name}</span>
              <Badge variant={tenant.is_active ? "default" : "secondary"} className="ml-2">
                {tenant.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
          {selected.length > 6 && (
            <div className="flex items-center justify-center p-2 bg-background rounded border text-sm text-muted-foreground">
              +{selected.length - 6} more
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "activate" && "Activate Tenants"}
              {bulkAction === "deactivate" && "Deactivate Tenants"}
              {bulkAction === "delete" && "Delete Tenants"}
              {bulkAction === "export" && "Export Tenant Data"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "activate" &&
                `Are you sure you want to activate ${selectedTenants.length} tenant(s)?`}
              {bulkAction === "deactivate" &&
                `Are you sure you want to deactivate ${selectedTenants.length} tenant(s)?`}
              {bulkAction === "delete" &&
                `Are you sure you want to delete ${selectedTenants.length} tenant(s)? This action cannot be undone and will remove all associated data.`}
              {bulkAction === "export" &&
                `Export data for ${selectedTenants.length} tenant(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={isProcessing}
              className={
                bulkAction === "delete" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  {bulkAction === "activate" && "Activate"}
                  {bulkAction === "deactivate" && "Deactivate"}
                  {bulkAction === "delete" && "Delete"}
                  {bulkAction === "export" && "Export"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
