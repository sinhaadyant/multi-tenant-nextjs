"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Edit, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, useApiMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { MultiSelect } from "@/components/ui";
import type { User, Role, Tenant } from "@/types/entities";

// Validation schema
const editUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    role_id: z.string().min(1, "Please select a role"),
    tenant_id: z.string().optional(),
    is_active: z.boolean(),
    is_superadmin: z.boolean(),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .refine(
    data => {
      if (data.password && !data.password_confirmation) {
        return false;
      }
      if (data.password_confirmation && !data.password) {
        return false;
      }
      if (
        data.password &&
        data.password_confirmation &&
        data.password !== data.password_confirmation
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["password_confirmation"],
    }
  );

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { success, error } = useNotification();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useApiQuery<User>(
    ["users", userId],
    `/users/${userId}`
  );

  // Fetch roles and tenants for form options
  const { data: rolesData, isLoading: rolesLoading } = useApiQuery<Role[]>(
    ["roles"],
    "/roles"
  );

  const { data: tenantsData, isLoading: tenantsLoading } = useApiQuery<
    Tenant[]
  >(["tenants"], "/tenants");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Update form when user data is loaded
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role_id: user.role_id || "",
        tenant_id: user.tenant_id || "",
        is_active: user.is_active,
        is_superadmin: user.is_superadmin,
        password: "",
        password_confirmation: "",
      });
    }
  }, [user, reset]);

  // Update user mutation
  const updateUserMutation = useApiMutation(
    ["users"],
    `/users/${userId}`,
    "PATCH"
  );

  const onSubmit = async (data: EditUserFormData) => {
    try {
      // Remove empty password fields
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.password_confirmation;
      }

      await updateUserMutation.mutateAsync(updateData);
      success({ message: "User updated successfully" });
      router.push(`/users/${userId}`);
    } catch (err: any) {
      error({
        message: err.response?.data?.message || "Failed to update user",
      });
    }
  };

  const handleCancel = () => {
    router.push(`/users/${userId}`);
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-gray-600">Update user information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter full name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="Enter phone number"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role_id">Role *</Label>
                    <Select
                      onValueChange={value => setValue("role_id", value)}
                      disabled={rolesLoading}
                      defaultValue={user.role_id || ""}
                    >
                      <SelectTrigger
                        className={errors.role_id ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesData?.map((role: Role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role_id && (
                      <p className="text-sm text-red-500">
                        {errors.role_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Tenant</Label>
                    <Select
                      onValueChange={value => setValue("tenant_id", value)}
                      disabled={tenantsLoading}
                      defaultValue={user.tenant_id || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Tenant</SelectItem>
                        {tenantsData?.map((tenant: Tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Change Password (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          placeholder="Enter new password"
                          className={
                            errors.password ? "border-red-500 pr-10" : "pr-10"
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("password_confirmation")}
                          placeholder="Confirm new password"
                          className={
                            errors.password_confirmation
                              ? "border-red-500 pr-10"
                              : "pr-10"
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password_confirmation && (
                        <p className="text-sm text-red-500">
                          {errors.password_confirmation.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status and Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Status & Permissions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={watch("is_active")}
                        onCheckedChange={checked =>
                          setValue("is_active", checked as boolean)
                        }
                      />
                      <Label htmlFor="is_active">Active User</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_superadmin"
                        checked={watch("is_superadmin")}
                        onCheckedChange={checked =>
                          setValue("is_superadmin", checked as boolean)
                        }
                      />
                      <Label htmlFor="is_superadmin">Super Administrator</Label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || updateUserMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Update User</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Password Change</h4>
                <p className="text-sm text-gray-600">
                  Leave password fields empty if you don&apos;t want to change the
                  password.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Role Changes</h4>
                <p className="text-sm text-gray-600">
                                  Changing a user&apos;s role will update their permissions
                immediately.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Status Changes</h4>
                <p className="text-sm text-gray-600">
                  Deactivating a user will prevent them from accessing the
                  system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
