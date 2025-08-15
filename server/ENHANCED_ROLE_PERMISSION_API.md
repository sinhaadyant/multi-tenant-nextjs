# Enhanced Role and Permission Management API

## Overview

The Enhanced Role and Permission Management API provides comprehensive role-based access control (RBAC) with tenant scope considerations, permission matrix management, and user role assignment capabilities.

## Key Features

### 🔐 **Role Management**

- **CRUD Operations**: Create, Read, Update, Delete roles with tenant scope validation
- **Tenant Filtering**: Global roles + tenant-specific roles
- **Scope Validation**: Users can only manage roles within their accessible scope
- **Cascade Cleanup**: Automatic permission cleanup when roles are deleted

### 🎯 **Permission Matrix Management**

- **Bulk Permission Assignment**: Update multiple permissions at once
- **Module & Submodule Support**: Granular permissions at module and submodule levels
- **Permission Preview**: Preview effective permissions for role combinations
- **Validation**: Comprehensive permission structure validation

### 👥 **User Role Management**

- **Role Assignment**: Assign multiple roles to users with validation
- **Effective Permissions**: Calculate and return user's effective permissions
- **Scope Validation**: Ensure users can only assign accessible roles
- **Permission Inheritance**: Automatic permission resolution from multiple roles

### 🛡️ **Security Features**

- **Permission-Based Access**: All operations require appropriate permissions
- **Data Scope Filtering**: Tenant isolation and scope enforcement
- **Field-Level Security**: Sensitive data filtering based on permissions
- **Audit Trail**: All operations logged with user context

## API Endpoints

### 1. List Roles

```http
GET /api/roles
```

**Permission Required**: `role-management:read`

**Data Scope Behavior**:

- **Superadmin**: Returns all roles across all tenants
- **Tenant Scope**: Returns global roles + tenant-specific roles
- **Own Scope**: Returns only global roles

**Response Example**:

```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": [
    {
      "id": "role-123",
      "name": "Admin",
      "description": "Administrator role",
      "tenantId": "tenant-456",
      "_count": {
        "userRoles": 5,
        "rolePermissions": 12
      }
    }
  ]
}
```

### 2. Get Role by ID

```http
GET /api/roles/:id
```

**Permission Required**: `role-management:read`

**Scope Validation**: User must have access to the requested role

**Response Example**:

```json
{
  "success": true,
  "message": "Role retrieved successfully",
  "data": {
    "id": "role-123",
    "name": "Admin",
    "description": "Administrator role",
    "tenantId": "tenant-456",
    "_count": {
      "userRoles": 5,
      "rolePermissions": 12
    }
  }
}
```

### 3. Create Role

```http
POST /api/roles
```

**Permission Required**: `role-management:create`

**Scope Validation**:

- Cannot create roles with `own` scope
- Tenant scope: Can only create roles in same tenant
- Superadmin: Can create roles in any tenant

**Request Body**:

```json
{
  "name": "New Role",
  "description": "Role description",
  "isGlobal": false
}
```

### 4. Update Role

```http
PUT /api/roles/:id
```

**Permission Required**: `role-management:update`

**Scope Validation**: User must have access to the requested role

### 5. Delete Role

```http
DELETE /api/roles/:id
```

**Permission Required**: `role-management:delete`

**Scope Validation**: User must have access to the requested role

**Safety Checks**:

- Prevents deletion of roles assigned to users
- Automatic cascade cleanup of role permissions

### 6. Get Role Permission Matrix

```http
GET /api/roles/:id/permissions
```

**Permission Required**: `role-management:read`

**Response Example**:

```json
{
  "success": true,
  "message": "Role permissions retrieved successfully",
  "data": {
    "role": {
      "id": "role-123",
      "name": "Admin",
      "description": "Administrator role",
      "tenantId": "tenant-456"
    },
    "permissionMatrix": [
      {
        "module": {
          "id": "module-1",
          "name": "User Management",
          "key": "user-management",
          "description": "Manage users and profiles"
        },
        "permissions": {
          "canCreate": true,
          "canRead": true,
          "canUpdate": true,
          "canDelete": false,
          "canViewAll": true
        },
        "submodules": [
          {
            "submodule": {
              "id": "submodule-1",
              "name": "User Profiles",
              "key": "profiles",
              "description": "Manage user profiles"
            },
            "permissions": {
              "canCreate": true,
              "canRead": true,
              "canUpdate": true,
              "canDelete": false,
              "canViewAll": true
            }
          }
        ]
      }
    ]
  }
}
```

### 7. Update Role Permissions

```http
PUT /api/roles/:id/permissions
```

**Permission Required**: `role-management:update`

**Request Body**:

```json
{
  "permissions": [
    {
      "moduleId": "module-1",
      "submoduleId": null,
      "canCreate": true,
      "canRead": true,
      "canUpdate": true,
      "canDelete": false,
      "canViewAll": true
    },
    {
      "moduleId": "module-1",
      "submoduleId": "submodule-1",
      "canCreate": true,
      "canRead": true,
      "canUpdate": true,
      "canDelete": false,
      "canViewAll": true
    }
  ]
}
```

**Features**:

- Bulk permission update in transaction
- Automatic permission cache invalidation
- Validation of permission structure

### 8. Get User Effective Permissions

```http
GET /api/users/:id/effective-permissions
```

**Permission Required**: `user-management:read`

**Response Example**:

```json
{
  "success": true,
  "message": "User effective permissions retrieved successfully",
  "data": {
    "userId": "user-123",
    "effectivePermissions": {
      "user-management": {
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": false,
        "canViewAll": true
      }
    },
    "userRoles": [
      {
        "roleId": "role-123",
        "roleName": "Admin",
        "isGlobal": false,
        "tenantId": "tenant-456"
      }
    ],
    "dataScopes": {
      "user-management": {
        "scope": "tenant",
        "tenantId": "tenant-456"
      }
    }
  }
}
```

### 9. Preview Permissions

```http
POST /api/permissions/preview
```

**Permission Required**: `role-management:read`

**Request Body**:

```json
{
  "roleIds": ["role-123", "role-456"]
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Permission preview generated successfully",
  "data": {
    "roleIds": ["role-123", "role-456"],
    "roles": [
      {
        "id": "role-123",
        "name": "Admin",
        "description": "Administrator role",
        "tenantId": "tenant-456"
      }
    ],
    "previewMatrix": [
      {
        "module": {
          "id": "module-1",
          "name": "User Management",
          "key": "user-management",
          "description": "Manage users and profiles"
        },
        "permissions": {
          "canCreate": true,
          "canRead": true,
          "canUpdate": true,
          "canDelete": false,
          "canViewAll": true
        },
        "submodules": []
      }
    ]
  }
}
```

## Permission Structure

### **Module Permissions**

```typescript
interface ModulePermissions {
  canCreate: boolean; // Create new records
  canRead: boolean; // View records
  canUpdate: boolean; // Modify existing records
  canDelete: boolean; // Delete records
  canViewAll: boolean; // Access sensitive data
}
```

### **Permission Inheritance**

- **Union Logic**: Permissions from multiple roles are combined using OR logic
- **Module Level**: Base permissions for entire module
- **Submodule Level**: Granular permissions for specific submodules
- **Override Behavior**: Submodule permissions override module permissions

## Data Scope Behavior

### **Superadmin Scope**

```typescript
// Can access all roles across all tenants
GET / api / roles;
// Returns: All roles in the system
```

### **Tenant Scope**

```typescript
// Can access global roles + tenant-specific roles
GET / api / roles;
// Returns: Global roles + roles where tenantId matches user's tenant
```

### **Own Scope**

```typescript
// Can only access global roles
GET / api / roles;
// Returns: Only roles where tenantId is null
```

## Role Types

### **Global Roles**

- `tenantId: null`
- Available to all tenants
- Typically system-level roles (Superadmin, Guest, etc.)

### **Tenant-Specific Roles**

- `tenantId: "tenant-123"`
- Only available within specific tenant
- Custom roles created by tenant administrators

## Permission Matrix UI Support

### **Frontend Integration**

```typescript
// Get permission matrix for role editing
const getRolePermissions = async (roleId: string) => {
  const response = await api.get(`/roles/${roleId}/permissions`);
  return response.data.permissionMatrix;
};

// Update role permissions
const updateRolePermissions = async (
  roleId: string,
  permissions: Permission[]
) => {
  await api.put(`/roles/${roleId}/permissions`, { permissions });
};

// Preview permissions for role combination
const previewPermissions = async (roleIds: string[]) => {
  const response = await api.post('/permissions/preview', { roleIds });
  return response.data.previewMatrix;
};
```

### **Permission Matrix Component**

```typescript
interface PermissionMatrixProps {
  modules: Module[];
  permissions: Permission[];
  onPermissionChange: (moduleId: string, submoduleId: string, permission: string, value: boolean) => void;
}

// Example usage in React component
<PermissionMatrix
  modules={permissionMatrix}
  permissions={currentPermissions}
  onPermissionChange={handlePermissionChange}
/>
```

## Error Handling

### **403 Forbidden**

```json
{
  "success": false,
  "error": "Insufficient permissions to create roles"
}
```

### **404 Not Found**

```json
{
  "success": false,
  "error": "Role not found"
}
```

### **400 Bad Request**

```json
{
  "success": false,
  "error": "Invalid permission structure",
  "details": [
    {
      "field": "permissions",
      "message": "Permission array is required"
    }
  ]
}
```

## Security Considerations

### **Data Protection**

- Role descriptions filtered based on view_all permission
- Tenant isolation enforced at API level
- Cross-tenant role assignment prevention

### **Access Control**

- All operations validate user permissions
- Scope validation for record-level operations
- Role deletion safety checks

### **Permission Validation**

- All endpoints validate permissions before execution
- Permission structure validation
- Role accessibility validation

## Performance Optimizations

### **Caching**

- Permission checks cached for 15 minutes
- Role data cached per tenant
- Permission matrix cached per role

### **Query Efficiency**

- Optimized queries with proper indexing
- Bulk operations for permission updates
- Transaction-based updates for consistency

## Testing

### **Permission Testing**

```typescript
describe('Role Management Permissions', () => {
  it('should allow role creation with canCreate permission', async () => {
    // Test implementation
  });

  it('should deny role creation without required permissions', async () => {
    // Test implementation
  });
});
```

### **Scope Testing**

```typescript
describe('Role Data Scope Filtering', () => {
  it('should filter roles by tenant scope', async () => {
    // Test implementation
  });

  it('should prevent cross-tenant role access', async () => {
    // Test implementation
  });
});
```

## Migration Guide

### **From Basic Role API**

1. Update route handlers to use permission guard middleware
2. Add data scope filtering to role queries
3. Implement permission matrix endpoints
4. Add bulk permission update support
5. Update error handling for permission errors

### **Frontend Updates**

1. Add permission matrix UI components
2. Implement role preview functionality
3. Handle new error responses (403, 404)
4. Add bulk permission update interfaces

## Conclusion

The Enhanced Role and Permission Management API provides a comprehensive, secure, and scalable solution for role-based access control with advanced features like permission matrices, role previews, and tenant scope management. It ensures data security while maintaining flexibility for different organizational structures and permission requirements.
