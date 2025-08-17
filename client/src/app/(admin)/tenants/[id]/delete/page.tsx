"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  Building,
  Users,
  Shield,
  Loader2
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";
import type { Tenant } from "@/types";

interface TenantWithStats extends Tenant {
  userCount: number;
  roleCount: number;
}

interface TenantResponse {
  tenant: TenantWithStats;
}

export default function DeleteTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { canDelete } = usePermissions();
  const tenantId = params.id as string;
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: tenantData,
    isLoading,
    error,
  } = useApiQuery<TenantResponse>(
    ["tenant", tenantId],
    `/tenants/${tenantId}`,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const deleteTenantMutation = useApiMutation(
    async () => {
      const response = await apiHelpers.delete(`/tenants/${tenantId}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        notificationService.success({
          message: "Tenant deleted successfully",
        });
        router.push("/tenants");
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to delete tenant",
        });
      },
    }
  );

  const handleDelete = async () => {
    if (!canDelete("tenants")) {
      notificationService.error({
        message: "You don't have permission to delete tenants",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTenantMutation.mutateAsync();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canDelete("tenants")) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to delete tenants.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Loading tenant details...</span>
        </div>
      </div>
    );
  }

  if (error || !tenantData?.data?.tenant) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Tenant Not Found</h1>
          <p className="text-muted-foreground">
            The tenant you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/tenants")} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  const tenant = tenantData.data.tenant;

  // Check if tenant can be deleted
  const hasUsersOrRoles = tenant.userCount > 0 || tenant.roleCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delete Tenant</h1>
            <p className="text-muted-foreground">
              Remove tenant from the system
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Tenant: {tenant.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning Alert */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                This action cannot be undone. This will permanently delete the tenant
                and all associated data.
              </AlertDescription>
            </Alert>

            {/* Tenant Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Tenant Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{tenant.name}</span>
                </div>
                {tenant.domain && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Domain:</span>
                    <span className="text-sm font-mono">{tenant.domain}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Users:</span>
                  <span className="text-sm">{tenant.userCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Roles:</span>
                  <span className="text-sm">{tenant.roleCount}</span>
                </div>
              </div>
            </div>

            {/* Cannot Delete Warning */}
            {hasUsersOrRoles && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  This tenant cannot be deleted because it has {tenant.userCount} user(s) and {tenant.roleCount} role(s). 
                  Please remove all users and roles before deleting the tenant.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || hasUsersOrRoles}
                className="flex items-center space-x-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>
                  {isDeleting 
                    ? "Deleting..." 
                    : hasUsersOrRoles 
                      ? "Cannot Delete" 
                      : "Delete Tenant"
                  }
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
