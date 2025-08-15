# Enhanced User Management API

## Overview

The Enhanced User Management API integrates with the permission guard system to provide scope-aware user management with granular permissions and data access controls.

## Key Features

### 🔐 **Permission-Based Access Control**

- **CRUD Operations**: Create, Read, Update, Delete permissions
- **View All Permission**: Access to sensitive user data
- **Bulk Operations**: Permission validation for bulk updates
- **Role Assignment**: Scope-aware role management

### 🌐 **Data Scope Filtering**

- **Superadmin**: Access to all users across all tenants
- **Tenant Scope**: Access to users within the same tenant
- **Own Scope**: Access only to user's own profile

### 🛡️ **Security Features**

- **Field-Level Security**: Sensitive data filtering based on permissions
- **Self-Deletion Prevention**: Users cannot delete their own accounts
- **Tenant Isolation**: Cross-tenant access prevention
- **Audit Trail**: All operations logged with user context

## API Endpoints

### 1. List Users

```http
GET /api/users
```

**Permission Required**: `user-management:read`

**Data Scope Behavior**:

- **Superadmin**: Returns all users across all tenants
- **canViewAll**: Returns users within same tenant
- **canRead**: Returns only user's own profile

**Query Parameters**:

- `page` (number): Page number for pagination
- `limit` (number): Number of items per page
- `search` (string): Search term for name or email
- `orderBy` (string): Field to order by (`name`, `email`, `createdAt`)
- `orderDirection` (string): Order direction (`asc`, `desc`)

**Response Example**:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "user@example.com",
        "name": "John Doe",
        "isActive": true,
        "tenantId": "tenant-456"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 2. Get User by ID

```http
GET /api/users/:id
```

**Permission Required**: `user-management:read`

**Scope Validation**: User must have access to the requested user record

**Response Example**:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "tenantId": "tenant-456",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Create User

```http
POST /api/users
```

**Permission Required**: `user-management:create`

**Scope Validation**:

- Cannot create users with `own` scope
- Tenant scope: Can only create users in same tenant
- Superadmin: Can create users in any tenant

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "securepassword",
  "isActive": true
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-789",
    "email": "newuser@example.com",
    "name": "New User",
    "isActive": true,
    "tenantId": "tenant-456"
  }
}
```

### 4. Update User

```http
PUT /api/users/:id
```

**Permission Required**: `user-management:update`

**Scope Validation**: User must have access to the requested user record

**Request Body**:

```json
{
  "name": "Updated Name",
  "isActive": false
}
```

### 5. Delete User

```http
DELETE /api/users/:id
```

**Permission Required**: `user-management:delete`

**Scope Validation**: User must have access to the requested user record

**Security**: Prevents self-deletion

### 6. Bulk Update Users

```http
PUT /api/users/bulk-update
```

**Permission Required**: `user-management:update`

**Scope Validation**: Access validation for all users in the bulk operation

**Request Body**:

```json
{
  "userIds": ["user-123", "user-456"],
  "updates": {
    "isActive": false
  }
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Bulk update completed: 2 successful, 0 failed",
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "userId": "user-123",
        "success": true,
        "error": null
      },
      {
        "userId": "user-456",
        "success": true,
        "error": null
      }
    ]
  }
}
```

### 7. Assign User Roles

```http
PUT /api/users/:id/roles
```

**Permission Required**: `user-management:update`

**Scope Validation**:

- User must have access to the requested user record
- All roles must be accessible within user's scope

**Request Body**:

```json
{
  "roleIds": ["role-123", "role-456"]
}
```

### 8. Get Own Profile

```http
GET /api/users/profile
```

**Authentication Required**: Yes (no additional permissions)

**Response**: Returns user's own profile without sensitive data

### 9. Get User Permissions

```http
GET /api/users/permissions
```

**Authentication Required**: Yes (no additional permissions)

**Response Example**:

```json
{
  "success": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "permissions": {
      "user-management": {
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": false,
        "canViewAll": true
      }
    },
    "dataScopes": {
      "user-management": {
        "scope": "tenant",
        "tenantId": "tenant-456"
      }
    }
  }
}
```

## Permission Levels

### 1. **Read Permission** (`user-management:read`)

- **Basic Access**: View user list and individual users
- **Field Filtering**: Limited to basic fields (id, email, name)
- **Scope**: Respects data scope filtering

### 2. **View All Permission** (`user-management:view_all`)

- **Extended Access**: View sensitive user data
- **Field Access**: Full user object including audit fields
- **Scope**: Still respects data scope filtering

### 3. **Create Permission** (`user-management:create`)

- **User Creation**: Create new users
- **Scope Validation**: Cannot create users with `own` scope
- **Tenant Assignment**: Automatic tenant assignment based on scope

### 4. **Update Permission** (`user-management:update`)

- **User Modification**: Update existing users
- **Record Access**: Must have access to the specific user record
- **Bulk Operations**: Supports bulk updates with validation

### 5. **Delete Permission** (`user-management:delete`)

- **User Deletion**: Soft delete users
- **Record Access**: Must have access to the specific user record
- **Self-Protection**: Prevents self-deletion

## Data Scope Behavior

### **Superadmin Scope**

```typescript
// Can access all users across all tenants
GET / api / users;
// Returns: All users in the system
```

### **Tenant Scope**

```typescript
// Can access users within the same tenant
GET / api / users;
// Returns: Users where tenantId matches user's tenant
```

### **Own Scope**

```typescript
// Can only access own profile
GET / api / users;
// Returns: Only the authenticated user's profile
```

## Error Handling

### **403 Forbidden**

```json
{
  "success": false,
  "error": "Insufficient permissions to create users"
}
```

### **404 Not Found**

```json
{
  "success": false,
  "error": "User not found"
}
```

### **400 Bad Request**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Integration Examples

### **Frontend Integration**

```typescript
// Check permissions before showing UI elements
const canCreateUsers = permissions['user-management']?.canCreate;
const canViewAllUsers = permissions['user-management']?.canViewAll;

// Conditional rendering
{canCreateUsers && <CreateUserButton />}
{canViewAllUsers && <UserManagementTable />}
```

### **API Client Usage**

```typescript
// List users with scope filtering
const users = await api.get('/users', {
  params: { page: 1, limit: 10 },
});

// Create user with automatic scope validation
const newUser = await api.post('/users', {
  email: 'user@example.com',
  name: 'New User',
});

// Bulk update with permission validation
const result = await api.put('/users/bulk-update', {
  userIds: ['user-1', 'user-2'],
  updates: { isActive: false },
});
```

## Security Considerations

### **Data Protection**

- Sensitive fields (passwordHash) are automatically filtered
- Field visibility based on permission levels
- Audit trail for all operations

### **Access Control**

- Tenant isolation enforced at API level
- Self-deletion prevention
- Cross-tenant access prevention

### **Permission Validation**

- All endpoints validate permissions before execution
- Scope validation for record-level operations
- Bulk operation permission checks

## Performance Optimizations

### **Caching**

- Permission checks cached for 15 minutes
- Data scope information cached per user
- Query optimization with proper indexing

### **Query Efficiency**

- Data scope filtering applied at database level
- Pagination support for large datasets
- Selective field loading based on permissions

## Testing

### **Permission Testing**

```typescript
// Test different permission levels
describe('User Management Permissions', () => {
  it('should allow read access with canRead permission', async () => {
    // Test implementation
  });

  it('should deny access without required permissions', async () => {
    // Test implementation
  });
});
```

### **Scope Testing**

```typescript
// Test data scope filtering
describe('Data Scope Filtering', () => {
  it('should filter users by tenant scope', async () => {
    // Test implementation
  });

  it('should prevent cross-tenant access', async () => {
    // Test implementation
  });
});
```

## Migration Guide

### **From Basic User API**

1. Update route handlers to use permission guard middleware
2. Add data scope filtering to queries
3. Implement field-level security
4. Add bulk operation support
5. Update error handling for permission errors

### **Frontend Updates**

1. Add permission checking before API calls
2. Implement conditional UI rendering
3. Handle new error responses (403, 404)
4. Add bulk operation interfaces

## Conclusion

The Enhanced User Management API provides a robust, secure, and scalable solution for user management with comprehensive permission controls and data scope filtering. It ensures data security while maintaining flexibility for different user roles and organizational structures.
