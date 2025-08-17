"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building,
  Users,
  Shield,
  Globe,
  Calendar,
  Activity,
  Settings,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Tenant, User, Role } from "@/types";

interface TenantWithDetails extends Tenant {
  users: User[];
  roles: Role[];
  userCount: number;
  roleCount: number;
}

interface TenantResponse {
  tenant: TenantWithDetails;
}

export default function ViewTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { canRead, canUpdate, canDelete } = usePermissions();
  const tenantId = params.id as string;

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

  const tenant = tenantData?.data?.tenant;

  const handleEdit = () => {
    router.push(`/tenants/${tenantId}/edit`);
  };

  const handleDelete = () => {
    router.push(`/tenants/${tenantId}/delete`);
  };

  if (!canRead("tenants")) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view tenants.
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

  if (error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Tenant Not Found</h1>
          <p className="text-muted-foreground">
            The tenant you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/tenants")} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground">Tenant Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canUpdate("tenants") && (
            <>
              <Button onClick={() => router.push(`/tenants/${tenantId}/settings`)} variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button onClick={handleEdit} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          {canDelete("tenants") && (
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={tenant.is_active ? "default" : "secondary"}>
                {tenant.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {tenant.domain && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Domain</span>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{tenant.domain}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(tenant.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDateTime(tenant.updated_at)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Users</span>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {tenant.userCount}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Roles</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {tenant.roleCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Section */}
      {tenant.users && tenant.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users ({tenant.userCount} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenant.users.slice(0, 5).map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {tenant.userCount > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{tenant.userCount - 5} more users
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Section */}
      {tenant.roles && tenant.roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles ({tenant.roleCount} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenant.roles.slice(0, 5).map(role => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={role.is_system ? "default" : "secondary"}>
                    {role.is_system ? "System" : "Custom"}
                  </Badge>
                </div>
              ))}
              {tenant.roleCount > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{tenant.roleCount - 5} more roles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
