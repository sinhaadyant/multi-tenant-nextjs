"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, UserPlus, Eye, EyeOff } from "lucide-react";
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
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { MultiSelect } from "@/components/ui";
import type { Role, Tenant, User } from "@/types/entities";

// Validation schema
const createUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    role_ids: z.array(z.string()).min(1, "Please select at least one role"),
    tenant_id: z.string().optional(),
    is_active: z.boolean(),
    is_superadmin: z.boolean(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canCreate } = usePermissions();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role_ids: [],
      is_active: true,
      is_superadmin: false,
    },
  });

  // Fetch roles and tenants for form options - moved before permission check
  const { data: rolesData, isLoading: rolesLoading } = useApiQuery<Role[]>(
    ["roles"],
    "/roles"
  );

  const { data: tenantsData, isLoading: tenantsLoading } = useApiQuery<
    Tenant[]
  >(["tenants"], "/tenants");

  // Create user mutation - moved before permission check
  const createUserMutation = usePostMutation<User, CreateUserFormData>(
    "/users"
  );

  // Check permissions
  if (!canCreate("user-management")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to create users.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      await createUserMutation.mutateAsync(data);
      success({ message: "User created successfully" });
      router.push("/users");
    } catch (err: any) {
      error({
        message: err.response?.data?.message || "Failed to create user",
      });
    }
  };

  const handleCancel = () => {
    router.push("/users");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create User</h1>
            <p className="text-gray-600">Add a new user to the system</p>
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
                <UserPlus className="h-5 w-5" />
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
                    <Label htmlFor="role_ids">Roles *</Label>
                    <MultiSelect
                      options={
                        rolesData?.data?.map((role: Role) => ({
                          value: role.id,
                          label: role.name,
                          description: role.description,
                        })) || []
                      }
                      selectedValues={selectedRoleIds}
                      onSelectionChange={values => {
                        setSelectedRoleIds(values);
                        setValue("role_ids", values);
                      }}
                      placeholder="Select roles"
                      searchPlaceholder="Search roles..."
                      disabled={rolesLoading}
                      className={errors.role_ids ? "border-red-500" : ""}
                    />
                    {errors.role_ids && (
                      <p className="text-sm text-red-500">
                        {errors.role_ids.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Tenant</Label>
                    <Select
                      onValueChange={value => setValue("tenant_id", value)}
                      disabled={tenantsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Tenant</SelectItem>
                        {tenantsData?.data?.map(tenant => (
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
                  <h3 className="text-lg font-semibold">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          placeholder="Enter password"
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
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("password_confirmation")}
                          placeholder="Confirm password"
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
                    disabled={isSubmitting || createUserMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Create User</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Fields</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full Name</li>
                  <li>• Email Address</li>
                  <li>• Role</li>
                  <li>• Password</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Password Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Minimum 8 characters</li>
                  <li>• Should be secure</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Role Assignment</h4>
                <p className="text-sm text-gray-600">
                  Users must be assigned a role to access the system. The role
                  determines their permissions and access levels.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  Active - User can access the system
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">
                  Inactive - User cannot access the system
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
