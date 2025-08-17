"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  Activity,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotification } from "@/hooks/useNotification";
import { useApiQuery, usePostMutation } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { ActivityLogs } from "@/components/ui/ActivityLogs";
import type { User } from "@/types/entities";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { success, error } = useNotification();
  const { canRead, canUpdate } = usePermissions();

  // Fetch user data - moved before permission check
  const {
    data: user,
    isLoading,
    refetch,
  } = useApiQuery<User>(["users", userId], `/users/${userId}`);

  // Password reset mutation - moved before permission check
  const resetPasswordMutation = usePostMutation(
    `/users/${userId}/reset-password`
  );

  // Check permissions
  if (!canRead("user-management")) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-600">
            You don&apos;t have permission to view user details.
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.push("/users");
  };

  const handleEdit = () => {
    router.push(`/users/${userId}/edit`);
  };

  const handleResetPassword = async () => {
    if (!confirm("Are you sure you want to reset this user's password?")) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({});
      success({ message: "Password reset email sent successfully" });
    } catch (err: any) {
      error({
        message: err.response?.data?.message || "Failed to reset password",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
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
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-600">User Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={resetPasswordMutation.isPending}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          variant={user.is_active ? "default" : "destructive"}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {user.is_superadmin && (
                          <Badge variant="secondary">Super Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {user.last_login_at && (
                      <div className="flex items-center space-x-3">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Last Login</p>
                          <p className="text-sm text-gray-600">
                            {new Date(user.last_login_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Role and Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Role</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.role ? (
                      <div className="space-y-2">
                        <Badge
                          variant={
                            user.role.is_system ? "default" : "secondary"
                          }
                        >
                          {user.role.name}
                        </Badge>
                        {user.role.description && (
                          <p className="text-sm text-gray-600">
                            {user.role.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No role assigned</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Tenant</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.tenant ? (
                      <div className="space-y-2">
                        <p className="font-medium">{user.tenant.name}</p>
                        {user.tenant.domain && (
                          <p className="text-sm text-gray-600">
                            {user.tenant.domain}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No tenant assigned
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLogs
                    logs={[]}
                    isLoading={false}
                    emptyMessage="No activity logs found for this user"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Permission details will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </CardContent>
          </Card>

          {/* User Status */}
          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={user.is_active ? "default" : "destructive"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Verified</span>
                <Badge
                  variant={user.email_verified_at ? "default" : "secondary"}
                >
                  {user.email_verified_at ? "Verified" : "Not Verified"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Super Admin</span>
                <Badge variant={user.is_superadmin ? "default" : "secondary"}>
                  {user.is_superadmin ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-gray-600 font-mono">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-gray-600">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
