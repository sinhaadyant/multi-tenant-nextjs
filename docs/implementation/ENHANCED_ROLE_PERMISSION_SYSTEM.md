# Enhanced Role & Permission Management System

## Overview

This document outlines the complete implementation of an enhanced role-permission management system for a multi-tenant Next.js application. The system supports:

- **Global Roles**: Created by SuperAdmin, visible to all tenants
- **Tenant-Specific Roles**: Created by tenants, available only to that tenant
- **Permission Overrides**: Tenants can customize permissions for global roles
- **Module-Based Permissions**: Granular control over module access and actions

## 🏗️ Database Schema

### Enhanced Tables

#### 1. Roles Table
```sql
ALTER TABLE roles
ADD COLUMN role_scope ENUM('global', 'tenant') NOT NULL DEFAULT 'tenant',
ADD COLUMN tenant_id VARCHAR(36) NULL; -- NULL for global roles
```

**Key Changes:**
- `role_scope`: Distinguishes between global and tenant-specific roles
- `tenant_id`: Links tenant-specific roles to their tenant (NULL for global roles)
- Unique constraint on `(name, tenant_id)` ensures no duplicate role names within scope

#### 2. Role Permissions Table
```sql
ALTER TABLE role_permissions
ADD COLUMN tenant_id VARCHAR(36) NULL, -- NULL for global permissions
ADD COLUMN is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

**Key Changes:**
- `tenant_id`: Enables tenant-specific permission overrides
- `is_allowed`: Allows explicit permission denial
- Unique constraint on `(role_id, permission_id, tenant_id)`

#### 3. Permissions Table
```sql
-- Enhanced permissions with action types
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    module_key VARCHAR(100) NOT NULL,
    action ENUM('view','create','edit','delete','export') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

### SuperAdmin APIs

#### 1. Global Role Management

**GET `/api/superadmin/roles`**
- List all global roles with pagination and filtering
- Returns roles with permission counts and user assignments
- Supports search, status filtering, and sorting

**POST `/api/superadmin/roles`**
- Create new global role
- Assign permissions with global scope
- Validation for role name uniqueness

**PUT `/api/superadmin/roles/[id]`**
- Update global role properties
- Modify global permissions
- Prevent modification of system roles

**DELETE `/api/superadmin/roles/[id]`**
- Delete global role (with safety checks)
- Prevents deletion if assigned to users or has tenant overrides

#### 2. Global Role Details

**GET `/api/superadmin/roles/[id]`**
- Get specific global role details
- Include assigned users and permissions
- Show role statistics

### Tenant APIs

#### 1. Role Management

**GET `/api/tenant/[tenantSlug]/roles`**
- List available roles for tenant (global + tenant-specific)
- Show permission overrides for global roles
- Include role statistics and user counts

**POST `/api/tenant/[tenantSlug]/roles`**
- Create tenant-specific role
- Assign permissions with tenant scope
- Validation within tenant context

#### 2. Permission Overrides

**GET `/api/tenant/[tenantSlug]/roles/[id]/permissions/override`**
- Get current permission overrides for global role
- Show effective permissions (global + tenant overrides)
- Include override statistics

**PUT `/api/tenant/[tenantSlug]/roles/[id]/permissions/override`**
- Update permission overrides for global role
- Replace existing overrides with new set
- Validate permission existence

**DELETE `/api/tenant/[tenantSlug]/roles/[id]/permissions/override`**
- Remove all permission overrides for global role
- Revert to global default permissions

#### 3. User Role Assignment

**GET `/api/tenant/[tenantSlug]/users/[userId]/roles`**
- Get user's assigned roles
- Show available roles for assignment
- Include role statistics

**POST `/api/tenant/[tenantSlug]/users/[userId]/roles`**
- Assign single role to user
- Validate role availability for tenant
- Prevent duplicate assignments

**PUT `/api/tenant/[tenantSlug]/users/[userId]/roles`**
- Assign multiple roles to user (replace existing)
- Bulk role assignment with validation
- Transaction safety

**DELETE `/api/tenant/[tenantSlug]/users/[userId]/roles`**
- Remove specific role from user
- Prevent removal of system roles
- Clean up role assignments

## 🎯 Key Features

### 1. Role Hierarchy
- **Global Roles**: Created by SuperAdmin, visible to all tenants
- **Tenant Roles**: Created by tenants, isolated to their scope
- **System Roles**: Protected roles with special privileges

### 2. Permission Overrides
- Tenants can customize global role permissions
- Overrides apply only within tenant scope
- Fallback to global permissions when no override exists

### 3. Module-Based Permissions
- Granular control over module access
- Action-based permissions (view, create, edit, delete, export)
- Hierarchical module structure support

### 4. User Role Management
- Multiple role assignment per user
- Role inheritance and permission aggregation
- Effective permission calculation

## 🔐 Security Implementation

### 1. Tenant Isolation
```typescript
// All queries include tenant context
const where = {
  OR: [
    { roleScope: 'global', tenantIdNew: null },
    { roleScope: 'tenant', tenantIdNew: tenant.id }
  ]
};
```

### 2. Permission Checking
```typescript
// Enhanced permission checking with overrides
function checkUserPermission(userId: string, tenantId: string, permission: string): boolean {
  const userRoles = getUserRoles(userId, tenantId);
  const effectivePermissions = calculateEffectivePermissions(userRoles, tenantId);
  return effectivePermissions.includes(permission);
}
```

### 3. Role Validation
```typescript
// Validate role assignment within tenant scope
function validateRoleAssignment(roleId: string, tenantId: string): boolean {
  const role = getRole(roleId);
  return role.roleScope === 'global' || 
         (role.roleScope === 'tenant' && role.tenantIdNew === tenantId);
}
```

## 📊 Data Flow

### 1. Global Role Creation
```
SuperAdmin → Create Global Role → Assign Global Permissions → Available to All Tenants
```

### 2. Tenant Role Creation
```
Tenant Admin → Create Tenant Role → Assign Tenant Permissions → Available to Tenant Only
```

### 3. Permission Override
```
Tenant Admin → Select Global Role → Override Specific Permissions → Apply to Tenant Users
```

### 4. User Role Assignment
```
Tenant Admin → Select User → Assign Roles → Calculate Effective Permissions → Apply Access Control
```

## 🎨 Frontend Integration

### 1. Role Management Interface
- **Global Roles Tab**: SuperAdmin manages global roles
- **Tenant Roles Tab**: Tenant admins manage their roles
- **Permission Overrides Tab**: Customize global role permissions

### 2. User Management Interface
- **Role Assignment**: Drag-and-drop role assignment
- **Permission Preview**: Show effective permissions for user
- **Role Hierarchy**: Visual representation of role relationships

### 3. Permission Management Interface
- **Module Tree**: Hierarchical module structure
- **Permission Grid**: Matrix view of permissions by role
- **Override Indicators**: Visual cues for overridden permissions

## 🚀 Usage Examples

### Creating a Global Role
```typescript
// SuperAdmin creates global admin role
const globalRole = await createGlobalRole({
  name: 'Global Admin',
  description: 'Administrative access across all tenants',
  permissions: ['users.view', 'users.create', 'users.edit', 'users.delete'],
  isTemplate: true
});
```

### Creating a Tenant Role
```typescript
// Tenant admin creates custom role
const tenantRole = await createTenantRole({
  name: 'Content Manager',
  description: 'Manages content and publications',
  permissions: ['content.view', 'content.create', 'content.edit'],
  tenantId: 'tenant-123'
});
```

### Overriding Global Role Permissions
```typescript
// Tenant customizes global role permissions
const overrides = await updatePermissionOverrides({
  roleId: 'global-admin-role',
  tenantId: 'tenant-123',
  permissions: [
    { permissionId: 'users.delete', isAllowed: false },
    { permissionId: 'users.export', isAllowed: true }
  ]
});
```

### Assigning Roles to Users
```typescript
// Assign multiple roles to user
const userRoles = await assignUserRoles({
  userId: 'user-123',
  tenantId: 'tenant-123',
  roleIds: ['global-admin-role', 'content-manager-role']
});
```

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="mysql://..."
JWT_SECRET="your-jwt-secret"
ROLE_CACHE_TTL=300 # 5 minutes
PERMISSION_CACHE_TTL=600 # 10 minutes
```

### Database Indexes
```sql
-- Performance optimization indexes
CREATE INDEX idx_roles_scope_tenant ON roles(role_scope, tenant_id);
CREATE INDEX idx_role_permissions_tenant ON role_permissions(role_id, tenant_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(user_id, tenant_id);
CREATE INDEX idx_permissions_module_action ON permissions(module_key, action);
```

## 📈 Performance Optimizations

### 1. Caching Strategy
- **Role Cache**: Cache role definitions with TTL
- **Permission Cache**: Cache effective permissions per user
- **Override Cache**: Cache tenant-specific overrides

### 2. Query Optimization
- **Eager Loading**: Load related data in single queries
- **Index Usage**: Proper database indexing for common queries
- **Pagination**: Server-side pagination for large datasets

### 3. Background Processing
- **Permission Recalculation**: Background job for permission updates
- **Role Synchronization**: Sync role changes across tenants
- **Audit Logging**: Asynchronous audit log creation

## 🧪 Testing Strategy

### 1. Unit Tests
- Role creation and validation
- Permission checking logic
- Override calculation
- User role assignment

### 2. Integration Tests
- API endpoint functionality
- Database transaction safety
- Tenant isolation verification
- Permission inheritance

### 3. Performance Tests
- Large dataset handling
- Concurrent user scenarios
- Cache effectiveness
- Database query optimization

## 🔮 Future Enhancements

### 1. Advanced Features
- **Role Inheritance**: Support for role hierarchies
- **Permission Templates**: Predefined permission sets
- **Dynamic Permissions**: Runtime permission evaluation
- **Role Analytics**: Usage statistics and insights

### 2. Security Enhancements
- **Permission Auditing**: Detailed permission change tracking
- **Role Approval Workflow**: Multi-step role assignment
- **Temporary Permissions**: Time-limited role assignments
- **Permission Risk Assessment**: Security scoring for permissions

### 3. User Experience
- **Visual Role Builder**: Drag-and-drop role creation
- **Permission Wizard**: Guided permission assignment
- **Role Recommendations**: AI-powered role suggestions
- **Mobile Support**: Responsive role management interface

## 📚 Best Practices

### 1. Security
- Always validate tenant context
- Use principle of least privilege
- Regular permission audits
- Secure role assignment workflows

### 2. Performance
- Implement proper caching
- Use database indexes
- Optimize permission queries
- Monitor performance metrics

### 3. Maintainability
- Clear role naming conventions
- Document permission purposes
- Regular role cleanup
- Version control for role changes

### 4. User Experience
- Intuitive role management interface
- Clear permission descriptions
- Helpful error messages
- Responsive design

This enhanced role-permission system provides a robust, scalable, and secure foundation for multi-tenant access control while maintaining excellent user experience and performance.
