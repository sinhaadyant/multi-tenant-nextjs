# Role Management API Documentation

## Overview

This document describes the comprehensive role management system that supports both global roles (created by SuperAdmin) and tenant-specific roles (created by Tenant Admins), with the ability for tenants to override global role permissions.

## Database Schema

### Key Tables

1. **roles** - Stores all roles (global and tenant-specific)
   - `scope`: 'GLOBAL' or 'TENANT'
   - `tenantId`: null for global roles, tenant ID for tenant roles
   - `createdBy`: ID of the user who created the role

2. **role_permissions** - Maps permissions to roles
   - Standard permission assignments

3. **tenant_role_overrides** - Stores tenant-specific overrides for global roles
   - `roleId`: Reference to global role
   - `tenantId`: Reference to tenant
   - `permissionId`: Reference to permission
   - `isGranted`: Boolean indicating if permission is granted/denied

4. **user_roles** - Assigns roles to users
   - Links users to roles in specific tenant contexts

## API Endpoints

### 1. Global Role Management (SuperAdmin Only)

#### Create Global Role
```http
POST /api/roles/global
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "name": "Global Editor",
  "description": "Global editor with content management permissions",
  "permissions": ["perm1", "perm2", "perm3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "role_id",
      "name": "Global Editor",
      "description": "Global editor with content management permissions",
      "scope": "GLOBAL",
      "isActive": true,
      "permissions": [...]
    }
  },
  "message": "Global role created successfully"
}
```

#### List Global Roles
```http
GET /api/roles/global?search=editor&status=active&page=1&limit=10
Authorization: Bearer <superadmin-token>
```

#### Update Global Role
```http
PUT /api/roles/{roleId}
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "name": "Updated Global Editor",
  "description": "Updated description",
  "permissions": ["perm1", "perm2", "perm4"]
}
```

#### Delete Global Role
```http
DELETE /api/roles/{roleId}
Authorization: Bearer <superadmin-token>
```

### 2. Tenant Role Management

#### Create Tenant Role
```http
POST /api/roles/tenant
Authorization: Bearer <tenant-token>
Content-Type: application/json

{
  "name": "Custom Editor",
  "description": "Tenant-specific editor role",
  "permissions": ["perm1", "perm2"]
}
```

### 3. Unified Role Listing

#### List All Roles (Global + Tenant)
```http
GET /api/roles?scope=ALL&search=editor&status=active
Authorization: Bearer <token>
```

**Query Parameters:**
- `scope`: 'GLOBAL', 'TENANT', or 'ALL'
- `search`: Search in role names and descriptions
- `status`: 'active', 'inactive', or 'all'
- `page`: Page number for pagination
- `limit`: Number of items per page

**Response includes:**
- Global roles with tenant overrides applied (if applicable)
- Tenant-specific roles
- Permission information with override status

### 4. Role Permission Overrides

#### Override Global Role Permissions
```http
POST /api/roles/{roleId}/permissions/override
Authorization: Bearer <tenant-token>
Content-Type: application/json

{
  "overrides": [
    {
      "permissionId": "perm1",
      "isGranted": false
    },
    {
      "permissionId": "perm2",
      "isGranted": true
    }
  ]
}
```

#### Get Role Overrides
```http
GET /api/roles/{roleId}/permissions/override
Authorization: Bearer <tenant-token>
```

#### Remove All Overrides
```http
DELETE /api/roles/{roleId}/permissions/override
Authorization: Bearer <tenant-token>
```

### 5. User Role Assignment

#### Assign Role to User
```http
POST /api/users/{userId}/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "role_id"
}
```

#### Get User's Roles
```http
GET /api/users/{userId}/roles
Authorization: Bearer <token>
```

#### Remove Role from User
```http
DELETE /api/users/{userId}/roles?roleId=role_id
Authorization: Bearer <token>
```

## Permission Resolution Logic

### For Global Roles:
1. Get base permissions from `role_permissions`
2. Apply tenant-specific overrides from `tenant_role_overrides`
3. Return final permission set

### For Tenant Roles:
1. Get permissions directly from `role_permissions`
2. No overrides applied

### Example Permission Resolution:
```javascript
// Global role "Editor" has permissions: [read, write, delete]
// Tenant A overrides: delete = false
// Final permissions for Tenant A: [read, write] (delete is denied)
// Tenant B has no overrides: [read, write, delete] (all granted)
```

## Authorization Rules

### SuperAdmin:
- Can create, read, update, delete global roles
- Can assign global roles to any user
- Cannot manage tenant-specific roles
- Has all permissions by default

### Tenant Admin:
- Can create, read, update, delete tenant-specific roles
- Can assign global roles and tenant roles to users in their tenant
- Can override global role permissions for their tenant
- Cannot access roles from other tenants

### Tenant Users:
- Can view roles they have access to (global + their tenant's roles)
- Cannot modify roles or permissions
- Can view their own role assignments

## Error Handling

### Common Error Responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Role name is required",
  "statusCode": 400,
  "details": [
    {
      "field": "name",
      "message": "Role name is required"
    }
  ]
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied",
  "statusCode": 403
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Role name already exists",
  "statusCode": 409
}
```

## Usage Examples

### Creating a Global Role with Permissions
```javascript
const response = await fetch('/api/roles/global', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${superadminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Content Manager',
    description: 'Manages content across all tenants',
    permissions: ['content.read', 'content.write', 'content.publish']
  })
});
```

### Overriding Global Role Permissions
```javascript
const response = await fetch('/api/roles/global-role-id/permissions/override', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${tenantToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    overrides: [
      { permissionId: 'content.publish', isGranted: false },
      { permissionId: 'content.write', isGranted: true }
    ]
  })
});
```

### Assigning Role to User
```javascript
const response = await fetch('/api/users/user-id/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roleId: 'role-id'
  })
});
```

## Migration Guide

### Running the Migration:
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run role system migration
npx tsx scripts/migrate-role-system.ts
```

### Migration Steps:
1. Adds `scope` field to existing roles
2. Converts roles without `tenantId` to GLOBAL scope
3. Converts roles with `tenantId` to TENANT scope
4. Creates default global roles if none exist
5. Verifies migration integrity

## Best Practices

1. **Role Naming**: Use descriptive names that indicate the role's purpose and scope
2. **Permission Granularity**: Create specific permissions rather than broad ones
3. **Override Management**: Document why overrides are needed for audit purposes
4. **Testing**: Test permission resolution with various role combinations
5. **Monitoring**: Monitor role usage and permission conflicts

## Security Considerations

1. **Audit Logging**: All role and permission changes are logged
2. **Validation**: Input validation prevents invalid role/permission assignments
3. **Authorization**: Strict authorization checks prevent unauthorized access
4. **Cascade Deletion**: Proper foreign key constraints ensure data integrity
5. **Override Limits**: Tenants can only override global roles, not create new ones
