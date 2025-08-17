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
  Badge,
  Button,
} from "@/components/ui";
import type {
  User,
  Tenant,
  Role,
  Module,
  Permission,
  SupportTicket,
  AuditLog,
  LoginDevice,
  ApiResponse,
  PaginationMeta,
  CreateUserForm,
  UpdateUserForm,
  LoginForm,
  RegisterForm,
  Pagination,
  FilterParams,
  TableConfig,
  Status,
  Priority,
  Notification,
  ThemeMode,
  DeepPartial,
  Optional,
  RequiredFields,
} from "@/types";

export default function TypesDemoPage() {
  const [activeTab, setActiveTab] = useState("entities");

  // Example data using the types
  const exampleUser: User = {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    avatar: "https://example.com/avatar.jpg",
    is_active: true,
    is_superadmin: false,
    email_verified_at: "2024-01-01T00:00:00Z",
    last_login_at: "2024-01-15T10:30:00Z",
    tenant_id: "tenant-1",
    role_id: "role-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  };

  const exampleTenant: Tenant = {
    id: "tenant-1",
    name: "Acme Corporation",
    domain: "acme.com",
    subdomain: "acme",
    logo: "https://example.com/logo.png",
    is_active: true,
    subscription_plan: "pro",
    subscription_expires_at: "2024-12-31T23:59:59Z",
    max_users: 100,
    max_storage_gb: 1000,
    features: ["users", "roles", "audit"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  };

  const exampleApiResponse: ApiResponse<User> = {
    success: true,
    message: "User retrieved successfully",
    data: exampleUser,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 1,
      from: 1,
      to: 1,
    },
  };

  const exampleForm: CreateUserForm = {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567890",
    password: "securepassword",
    password_confirmation: "securepassword",
    role_id: "role-2",
    tenant_id: "tenant-1",
    is_active: true,
    is_superadmin: false,
  };

  const exampleTableConfig: TableConfig<User> = {
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "is_active", label: "Status", sortable: true },
      { key: "created_at", label: "Created", sortable: true },
    ],
    actions: [
      {
        key: "edit",
        label: "Edit",
        onClick: user => console.log("Edit user:", user),
      },
      {
        key: "delete",
        label: "Delete",
        variant: "destructive",
        onClick: user => console.log("Delete user:", user),
        confirm: {
          title: "Delete User",
          message: "Are you sure you want to delete this user?",
        },
      },
    ],
    selectable: true,
    sortable: true,
    filterable: true,
    searchable: true,
    pagination: true,
    loading: false,
    emptyText: "No users found",
  };

  const exampleNotification: Notification = {
    id: "1",
    type: "success",
    title: "Success",
    message: "User created successfully",
    duration: 5000,
    dismissible: true,
  };

  // Utility type examples
  type PartialUser = DeepPartial<User>;
  type UserWithoutId = Optional<User, "id" | "created_at" | "updated_at">;
  type RequiredUserFields = RequiredFields<User, "name" | "email">;

  const partialUser: PartialUser = {
    name: "John",
    email: "john@example.com",
    // Other fields are optional
  };

  const userWithoutId: UserWithoutId = {
    name: "Jane",
    email: "jane@example.com",
    is_active: true,
    is_superadmin: false,
    // id, created_at, updated_at are optional
  };

  const requiredUserFields: RequiredUserFields = {
    ...exampleUser,
    // name and email are required, others are optional
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">TypeScript Types Demo</h1>
        <Badge variant="secondary">Type Definitions</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="common">Common</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Types</CardTitle>
              <CardDescription>
                Core entity types for User, Tenant, Role, Module, Permission,
                etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">User Entity:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleUser, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tenant Entity:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleTenant, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    Available Entity Types:
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• User & AuthUser</li>
                    <li>• Tenant & TenantSettings</li>
                    <li>• Role</li>
                    <li>• Module</li>
                    <li>• Permission & UserPermissions</li>
                    <li>• SupportTicket & TicketAttachment</li>
                    <li>• AuditLog</li>
                    <li>• LoginDevice</li>
                    <li>• Token & ResetToken</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• BaseEntity with common fields</li>
                    <li>• Proper relationships</li>
                    <li>• Optional fields</li>
                    <li>• Type-safe associations</li>
                    <li>• Extensible structure</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Response Types</CardTitle>
              <CardDescription>
                Standard API response format and related types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">API Response Example:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleApiResponse, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">API Types:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• ApiResponse&lt;T&gt;</li>
                    <li>• PaginationMeta</li>
                    <li>• ApiError</li>
                    <li>• PaginationParams</li>
                    <li>• FilterParams</li>
                    <li>• LoginResponse</li>
                    <li>• TokenResponse</li>
                    <li>• ErrorResponse</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Generic response wrapper</li>
                    <li>• Standardized pagination</li>
                    <li>• Error handling</li>
                    <li>• Type-safe data</li>
                    <li>• Consistent format</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Types</CardTitle>
              <CardDescription>
                Type-safe form definitions for create/update operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Create User Form:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleForm, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Form Types:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• CreateUserForm</li>
                    <li>• UpdateUserForm</li>
                    <li>• LoginForm</li>
                    <li>• RegisterForm</li>
                    <li>• CreateTenantForm</li>
                    <li>• CreateRoleForm</li>
                    <li>• CreateTicketForm</li>
                    <li>• UpdateProfileForm</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Separate create/update types</li>
                    <li>• Required vs optional fields</li>
                    <li>• Validation-ready</li>
                    <li>• Form-specific fields</li>
                    <li>• Type-safe operations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="common" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Types</CardTitle>
              <CardDescription>
                Reusable types for pagination, filtering, tables, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Table Configuration:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleTableConfig, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Notification Example:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(exampleNotification, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Common Types:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Pagination & PaginatedResponse</li>
                    <li>• FilterParams & AppliedFilter</li>
                    <li>• TableConfig & TableColumn</li>
                    <li>• Status & Priority</li>
                    <li>• Notification & ModalConfig</li>
                    <li>• DateRange & FileInfo</li>
                    <li>• ThemeMode & LocaleConfig</li>
                    <li>• ValidationRule</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Reusable across components</li>
                    <li>• Consistent patterns</li>
                    <li>• Type-safe configurations</li>
                    <li>• Flexible options</li>
                    <li>• UI-agnostic</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Utility Types</CardTitle>
              <CardDescription>
                TypeScript utility types for common transformations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">DeepPartial Example:</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(partialUser, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Optional Example:</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(userWithoutId, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Utility Types:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• DeepPartial&lt;T&gt;</li>
                    <li>• Optional&lt;T, K&gt;</li>
                    <li>• RequiredFields&lt;T, K&gt;</li>
                    <li>• Nullable&lt;T&gt;</li>
                    <li>• ValueOf&lt;T&gt;</li>
                    <li>• ArrayElement&lt;T&gt;</li>
                    <li>• PromiseType&lt;T&gt;</li>
                    <li>• ComponentProps&lt;T&gt;</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Use Cases:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Form updates (DeepPartial)</li>
                    <li>• API requests (Optional)</li>
                    <li>• Required validations</li>
                    <li>• Null safety</li>
                    <li>• Type extraction</li>
                    <li>• Component props</li>
                    <li>• Promise handling</li>
                    <li>• Array operations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Type Usage Examples</CardTitle>
          <CardDescription>
            How to use these types in your components and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Importing Types:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm">
                {`import type { 
  User, 
  ApiResponse, 
  CreateUserForm,
  TableConfig 
} from '@/types';`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Using in Components:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm">
                {`interface UserListProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">API Service Types:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm">
                {`async function createUser(data: CreateUserForm): Promise<ApiResponse<User>> {
  // Implementation
}

async function getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
  // Implementation
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
