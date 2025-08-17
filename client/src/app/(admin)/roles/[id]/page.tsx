"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Copy,
  Shield,
  Users,
  Calendar,
  Building,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { Role } from "@/types/entities";

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { success, error } = useNotification();
  const { canRead, canUpdate } = usePermissions();

  // Fetch role data - moved before permission check
  const {
    data: role,
    isLoading,
    refetch,
  } = useApiQuery<Role>(["roles", roleId], `/roles/${roleId}`);

  // Check permissions
  if (!canRead("roles")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view role details.
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.push("/roles");
  };

  const handleEdit = () => {
    router.push(`/roles/${roleId}/edit`);
  };

  const handleClone = () => {
    router.push(`/roles/${roleId}/clone`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Role not found</p>
        </div>
      </div>
    );
  }

  const roleData = role?.data || role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {roleData?.name}
            </h1>
            <p className="text-muted-foreground">Role Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {canUpdate("roles") && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Role
            </Button>
          )}
          <Button variant="outline" onClick={handleClone}>
            <Copy className="h-4 w-4 mr-2" />
            Clone Role
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Role Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Role Name
                  </label>
                  <p className="text-lg font-semibold">{roleData?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={roleData?.is_system ? "default" : "secondary"}
                    >
                      {roleData?.is_system ? "System" : "Custom"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tenant
                  </label>
                  <div className="flex items-center space-x-2">
                    {roleData?.tenant_id ? (
                      <>
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{roleData.tenant_id}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Global Role</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {roleData?.created_at
                        ? new Date(roleData.created_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              {roleData?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-gray-700">{roleData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roleData.rolePermissions &&
              roleData.rolePermissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Module</th>
                        <th className="text-center p-2 font-medium">Create</th>
                        <th className="text-center p-2 font-medium">Read</th>
                        <th className="text-center p-2 font-medium">Update</th>
                        <th className="text-center p-2 font-medium">Delete</th>
                        <th className="text-center p-2 font-medium">
                          View All
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleData.rolePermissions.map(permission => (
                        <tr key={permission.id} className="border-b">
                          <td className="p-2">
                            <span className="font-medium">
                              {permission.module?.name || "Unknown Module"}
                            </span>
                          </td>
                          <td className="text-center p-2">
                            {permission.canCreate ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-2">
                            {permission.canRead ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-2">
                            {permission.canUpdate ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-2">
                            {permission.canDelete ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-2">
                            {permission.canViewAll ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No permissions assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Permissions</span>
                <Badge variant="secondary">
                  {roleData.rolePermissions?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Users with Role</span>
                <Badge variant="secondary">{roleData.userCount || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canUpdate("roles") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleClone}
              >
                <Copy className="h-4 w-4 mr-2" />
                Clone Role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
