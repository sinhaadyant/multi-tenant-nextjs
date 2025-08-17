"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  Input,
  Label,
} from "@/components/ui";
import {
  useApiQuery,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation,
  useUploadMutation,
  queryKeys,
} from "@/hooks/useApi";
import { apiHelpers } from "@/lib/axios";
import { notificationService } from "@/services/notificationService";
import type { User, CreateUserForm, UpdateUserForm } from "@/types";
import {
  UserPlus,
  Edit,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function ApiDemoPage() {
  const [activeTab, setActiveTab] = useState("queries");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [formData, setFormData] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  // Mock data for demo purposes
  const mockUsers: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      is_active: true,
      is_superadmin: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      is_active: true,
      is_superadmin: false,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-16T10:30:00Z",
    },
  ];

  // Simulated API calls for demo
  const simulateApiCall = async (
    delay: number = 1000,
    shouldFail: boolean = false
  ): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, delay));
    if (shouldFail) {
      throw new Error("Simulated API error");
    }
    return mockUsers;
  };

  // Query examples
  const usersQuery = useApiQuery<User[]>(
    queryKeys.users.list({ page: 1, per_page: 10 }),
    "/users",
    { page: 1, per_page: 10 },
    {
      queryFn: () => simulateApiCall(1000),
      enabled: false, // Disable automatic fetching for demo
    }
  );

  const userDetailQuery = useApiQuery<User>(
    queryKeys.users.detail(selectedUserId),
    `/users/${selectedUserId}`,
    undefined,
    {
      queryFn: () => simulateApiCall(500).then(users => users[0]),
      enabled: !!selectedUserId,
    }
  );

  // Mutation examples
  const createUserMutation = useCreateMutation<User, CreateUserForm>(
    "/users",
    [queryKeys.users.lists()],
    {
      onSuccess: (data: any) => {
        notificationService.success({
          message: "User has been created successfully!",
        });
        setFormData({
          name: "",
          email: "",
          password: "",
          password_confirmation: "",
        });
      },
      onError: (error: any) => {
        notificationService.error({ message: "Failed to create user" });
      },
    }
  );

  const updateUserMutation = useUpdateMutation<User, UpdateUserForm>(
    `/users/${selectedUserId}`,
    [queryKeys.users.detail(selectedUserId), queryKeys.users.lists()],
    {
      onSuccess: (data: any) => {
        notificationService.success({
          message: "User has been updated successfully!",
        });
      },
    }
  );

  const deleteUserMutation = useDeleteMutation(
    "/users",
    [queryKeys.users.lists()],
    {
      onSuccess: () => {
        notificationService.success({
          message: "User has been deleted successfully!",
        });
      },
    }
  );

  const uploadMutation = useUploadMutation<{ url: string }>(
    "/upload",
    undefined,
    {
      onSuccess: (data: any) => {
        notificationService.success({
          message: `File uploaded successfully! URL: ${data.url}`,
        });
      },
    }
  );

  // Manual API call examples
  const handleManualApiCall = async () => {
    try {
      const response = await apiHelpers.get("/users");
      notificationService.success({ message: "Manual API call successful!" });
      console.log("Response:", response.data);
    } catch (error) {
      notificationService.error({ message: "Manual API call failed!" });
    }
  };

  const handleDownloadFile = async () => {
    try {
      await apiHelpers.download("/export/users", "users-export.csv");
      notificationService.success({ message: "File downloaded successfully!" });
    } catch (error) {
      notificationService.error({ message: "Failed to download file!" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = () => {
    if (!selectedUserId) return;

    const updateData: UpdateUserForm = {
      name: "Updated Name",
      email: "updated@example.com",
    };

    updateUserMutation.mutate(updateData);
  };

  const handleDeleteUser = () => {
    if (!selectedUserId) return;
    deleteUserMutation.mutate(selectedUserId);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Integration Demo</h1>
        <Badge variant="secondary">Axios + TanStack Query</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="mutations">Mutations</TabsTrigger>
          <TabsTrigger value="manual">Manual API</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Examples</CardTitle>
              <CardDescription>
                TanStack Query hooks for data fetching with caching and error
                handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Users List Query:</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    onClick={() => usersQuery.refetch()}
                    disabled={usersQuery.isFetching}
                    size="sm"
                  >
                    {usersQuery.isFetching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Fetch Users
                  </Button>
                  <Badge
                    variant={usersQuery.isLoading ? "secondary" : "default"}
                  >
                    {usersQuery.isLoading ? "Loading..." : "Ready"}
                  </Badge>
                </div>
                <div className="bg-gray-100 p-4 rounded text-sm">
                  <pre>{JSON.stringify(usersQuery.data, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">User Detail Query:</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="userId">User ID:</Label>
                  <Input
                    id="userId"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-48"
                  />
                  <Badge
                    variant={
                      userDetailQuery.isLoading ? "secondary" : "default"
                    }
                  >
                    {userDetailQuery.isLoading ? "Loading..." : "Ready"}
                  </Badge>
                </div>
                {userDetailQuery.data && (
                  <div className="bg-gray-100 p-4 rounded text-sm">
                    <pre>{JSON.stringify(userDetailQuery.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mutations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mutation Examples</CardTitle>
              <CardDescription>
                TanStack Query hooks for data mutations with optimistic updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Create User:</h4>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name:</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email:</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password:</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={e =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password_confirmation">
                      Confirm Password:
                    </Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          password_confirmation: e.target.value,
                        })
                      }
                      placeholder="Confirm password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="w-full"
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Update User:</h4>
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    placeholder="Enter user ID to update"
                    className="w-48"
                  />
                  <Button
                    onClick={handleUpdateUser}
                    disabled={updateUserMutation.isPending || !selectedUserId}
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update User
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Delete User:</h4>
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    placeholder="Enter user ID to delete"
                    className="w-48"
                  />
                  <Button
                    onClick={handleDeleteUser}
                    disabled={deleteUserMutation.isPending || !selectedUserId}
                    variant="destructive"
                  >
                    {deleteUserMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">File Upload:</h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                  <Badge
                    variant={uploadMutation.isPending ? "secondary" : "default"}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Ready"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual API Calls</CardTitle>
              <CardDescription>
                Direct Axios calls using the configured instance and helpers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Direct API Call:</h4>
                <Button onClick={handleManualApiCall}>
                  Make Manual API Call
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">File Download:</h4>
                <Button onClick={handleDownloadFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Users Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Features</CardTitle>
              <CardDescription>
                Key features of the Axios and TanStack Query integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Axios Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Automatic token injection</li>
                    <li>• Tenant header management</li>
                    <li>• Request/response interceptors</li>
                    <li>• Automatic token refresh</li>
                    <li>• Global error handling</li>
                    <li>• Request ID tracking</li>
                    <li>• File upload/download helpers</li>
                    <li>• TypeScript support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    TanStack Query Features:
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Automatic caching</li>
                    <li>• Background refetching</li>
                    <li>• Optimistic updates</li>
                    <li>• Error retry logic</li>
                    <li>• Query invalidation</li>
                    <li>• Loading states</li>
                    <li>• DevTools integration</li>
                    <li>• Type-safe queries</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Error Handling:</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      Error Handling Demo
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    The integration includes comprehensive error handling:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• 401 errors trigger automatic logout</li>
                    <li>• 422 validation errors are handled by forms</li>
                    <li>• Network errors show user-friendly messages</li>
                    <li>• Server errors are logged and displayed</li>
                    <li>• Token refresh on expiration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
