"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import type { Module } from "@/types/entities";

// Validation schema
const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
  isGlobal: z.boolean(),
  permissions: z.array(
    z.object({
      moduleId: z.string(),
      submoduleId: z.string().optional(),
      canCreate: z.boolean(),
      canRead: z.boolean(),
      canUpdate: z.boolean(),
      canDelete: z.boolean(),
      canViewAll: z.boolean(),
    })
  ),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export default function CreateRolePage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canCreate } = usePermissions();
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    Record<string, any>
  >({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      isGlobal: false,
      permissions: [],
    },
  });

  // Fetch modules for permission matrix - moved before permission check
  const { data: modulesData, isLoading: modulesLoading } = useApiQuery<
    Module[]
  >(["modules"], "/modules");

  // Create role mutation - moved before permission check
  const createRoleMutation = usePostMutation("/roles");

  // Check permissions
  if (!canCreate("roles")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to create roles.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      // Convert selected permissions to the required format
      const permissions = Object.entries(selectedPermissions).map(
        ([moduleId, permissions]) => ({
          moduleId,
          ...permissions,
        })
      );

      const roleData = {
        ...data,
        permissions,
      };

      await createRoleMutation.mutateAsync(roleData);
      success({ message: "Role created successfully" });
      router.push("/roles");
    } catch (err: any) {
      error({
        message: err.response?.data?.message || "Failed to create role",
      });
    }
  };

  const handleCancel = () => {
    router.push("/roles");
  };

  const handlePermissionChange = (
    moduleId: string,
    permission: string,
    value: boolean
  ) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permission]: value,
      },
    }));
  };

  const handleSelectAllModule = (moduleId: string, value: boolean) => {
    const permissions = ["canCreate", "canRead", "canUpdate", "canDelete"];
    const newPermissions = permissions.reduce(
      (acc, perm) => {
        acc[perm] = value;
        return acc;
      },
      {} as Record<string, boolean>
    );

    setSelectedPermissions(prev => ({
      ...prev,
      [moduleId]: newPermissions,
    }));
  };

  const handleSelectAllPermissions = (permission: string, value: boolean) => {
    if (!modulesData?.data) return;

    const newPermissions = { ...selectedPermissions };
    modulesData.data.forEach(module => {
      newPermissions[module.id] = {
        ...newPermissions[module.id],
        [permission]: value,
      };
    });

    setSelectedPermissions(newPermissions);
  };

  const isModuleSelected = (moduleId: string) => {
    const modulePermissions = selectedPermissions[moduleId];
    if (!modulePermissions) return false;
    return Object.values(modulePermissions).some(Boolean);
  };

  const isPermissionSelected = (permission: string) => {
    if (!modulesData?.data) return false;
    return modulesData.data.some(module => {
      const modulePermissions = selectedPermissions[module.id];
      return modulePermissions?.[permission];
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Role</h1>
            <p className="text-muted-foreground">
              Create a new role with specific permissions
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter role name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter role description"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGlobal"
                checked={watch("isGlobal")}
                onCheckedChange={checked =>
                  setValue("isGlobal", checked as boolean)
                }
              />
              <Label htmlFor="isGlobal">Global Role</Label>
              <p className="text-sm text-gray-500">
                Global roles apply to all tenants
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Permissions</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Select the permissions for this role
            </p>
          </CardHeader>
          <CardContent>
            {modulesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading modules...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Module</th>
                      <th className="text-center p-2 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <span>Create</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canCreate", true)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canCreate", false)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <span>Read</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canRead", true)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canRead", false)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <span>Update</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canUpdate", true)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canUpdate", false)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <span>Delete</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canDelete", true)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canDelete", false)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <span>View All</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canViewAll", true)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSelectAllPermissions("canViewAll", false)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modulesData?.data?.map(module => (
                      <tr key={module.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={isModuleSelected(module.id)}
                              onCheckedChange={checked =>
                                handleSelectAllModule(
                                  module.id,
                                  checked as boolean
                                )
                              }
                            />
                            <span className="font-medium">{module.name}</span>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={
                              selectedPermissions[module.id]?.canCreate || false
                            }
                            onCheckedChange={checked =>
                              handlePermissionChange(
                                module.id,
                                "canCreate",
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={
                              selectedPermissions[module.id]?.canRead || false
                            }
                            onCheckedChange={checked =>
                              handlePermissionChange(
                                module.id,
                                "canRead",
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={
                              selectedPermissions[module.id]?.canUpdate || false
                            }
                            onCheckedChange={checked =>
                              handlePermissionChange(
                                module.id,
                                "canUpdate",
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={
                              selectedPermissions[module.id]?.canDelete || false
                            }
                            onCheckedChange={checked =>
                              handlePermissionChange(
                                module.id,
                                "canDelete",
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={
                              selectedPermissions[module.id]?.canViewAll ||
                              false
                            }
                            onCheckedChange={checked =>
                              handlePermissionChange(
                                module.id,
                                "canViewAll",
                                checked as boolean
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
