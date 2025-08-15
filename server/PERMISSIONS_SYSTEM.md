# Permissions System Implementation

This document outlines the implementation of the granular permissions system for the multi-tenant Next.js application.

## Overview

The permissions system implements a Role-Based Access Control (RBAC) model with granular permissions at the module and submodule level, supporting multi-tenant isolation and superadmin capabilities.

## Database Schema

### Core Tables

#### 1. Users Table

```sql
CREATE TABLE users (
  id VARCHAR(191) PRIMARY KEY,
  tenant_id VARCHAR(191) NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_superadmin BOOLEAN DEFAULT false,  -- Key field for superadmin access
  last_login_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. Role Permissions Table

```sql
CREATE TABLE role_permissions (
  id VARCHAR(191) PRIMARY KEY,
  role_id VARCHAR(191) NOT NULL,
  module_id VARCHAR(191) NOT NULL,
  submodule_id VARCHAR(191) NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_view_all BOOLEAN DEFAULT false,  -- Key field for scope control
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (submodule_id) REFERENCES submodules(id) ON DELETE CASCADE,

  UNIQUE KEY unique_role_module_submodule (role_id, module_id, submodule_id)
);
```

### Performance Indexes

The following indexes have been added for optimal query performance:

#### Role Permissions Indexes

- `idx_role_permissions_role_module` - Optimizes role-based permission queries
- `idx_role_permissions_module_permissions` - Optimizes module-based permission checks
- `idx_role_permissions_submodule_permissions` - Optimizes submodule-specific queries
- `idx_role_permissions_by_role` - Single role lookups
- `idx_role_permissions_by_module` - Single module lookups
- `idx_role_permissions_by_submodule` - Single submodule lookups

#### User and Role Indexes

- `idx_user_roles_user_role` - Optimizes user-role assignments
- `idx_users_tenant_active` - Optimizes tenant-based user queries
- `idx_roles_tenant_global` - Optimizes tenant-based role queries

#### Audit and Support Indexes

- `idx_audit_logs_tenant_user` - Optimizes audit log queries
- `idx_support_tickets_tenant_status` - Optimizes support ticket queries
- `idx_support_tickets_user_status` - Optimizes user-specific ticket queries

#### Token and Device Indexes

- `idx_refresh_tokens_user_active` - Optimizes active token queries
- `idx_login_devices_user_active` - Optimizes active device queries
- `idx_reset_tokens_user_used` - Optimizes password reset queries

## Permission System Features

### 1. Granular Permissions

- **CRUD Operations**: `can_create`, `can_read`, `can_update`, `can_delete`
- **Scope Control**: `can_view_all` determines if user can see all records or only their own
- **Module Level**: Permissions can be set at the module level
- **Submodule Level**: Permissions can be set at the submodule level for fine-grained control

### 2. Multi-Tenant Support

- **Tenant Isolation**: Users are associated with specific tenants
- **Tenant-Specific Roles**: Roles can be global or tenant-specific
- **Data Segregation**: All queries respect tenant boundaries

### 3. Superadmin Capabilities

- **Global Access**: Users with `is_superadmin = true` have access to all tenants
- **Bypass Permissions**: Superadmins can bypass normal permission checks
- **System Management**: Full access to system configuration and management

### 4. Role-Based Access Control (RBAC)

- **Role Assignment**: Users are assigned to roles
- **Permission Inheritance**: Users inherit permissions from their assigned roles
- **Flexible Roles**: Roles can be global or tenant-specific

## Implementation Details

### Database Migration

The permissions system is implemented through a comprehensive migration that:

1. Creates all necessary tables with proper relationships
2. Adds performance indexes for optimized queries
3. Sets up foreign key constraints for data integrity
4. Implements the complete RBAC structure

### Seed Data

The system includes comprehensive seed data with:

- **Modules**: Dashboard, Users, Roles, Support, Notifications
- **Submodules**: Specific components within each module
- **Global Roles**: Superadmin, Global Support
- **Tenant Roles**: Tenant Admin, Tenant User
- **Test Users**: Superadmin and tenant-specific users
- **Sample Permissions**: Full permissions for superadmin role
- **Support System**: Sample tickets and replies

### Test Credentials

```
Superadmin: superadmin@example.com / password123
Tenant A Admin: admin@tenant-a.com / password123
Tenant B Admin: admin@tenant-b.com / password123
Tenant A User: john@tenant-a.com / password123
Tenant B User: bob@tenant-b.com / password123
```

## Usage Examples

### Checking User Permissions

```typescript
// Check if user can read a specific module
const canRead = await checkUserPermission(userId, moduleId, 'read');

// Check if user can view all records or only their own
const canViewAll = await checkUserPermission(userId, moduleId, 'view_all');

// Check submodule-specific permissions
const canUpdateSubmodule = await checkUserPermission(
  userId,
  moduleId,
  submoduleId,
  'update'
);
```

### Superadmin Checks

```typescript
// Check if user is superadmin
const isSuperadmin = await isUserSuperadmin(userId);

// Superadmins bypass normal permission checks
if (isSuperadmin) {
  // Grant full access
  return true;
}
```

### Tenant-Based Queries

```typescript
// Get users for a specific tenant
const tenantUsers = await prisma.user.findMany({
  where: {
    tenantId: tenantId,
    isActive: true,
  },
});

// Get roles for a specific tenant
const tenantRoles = await prisma.role.findMany({
  where: {
    tenantId: tenantId,
    isGlobal: false,
  },
});
```

## Security Considerations

### 1. Data Isolation

- All queries must include tenant filtering
- Superadmin access is carefully controlled
- Permission checks are enforced at the database level

### 2. Audit Logging

- All permission-related actions are logged
- User activity is tracked for security monitoring
- IP addresses and device information are recorded

### 3. Session Management

- Refresh tokens are used for secure session management
- Device tracking helps identify suspicious activity
- Token expiration and rotation are implemented

### 4. Password Security

- Passwords are hashed using bcrypt
- Password reset tokens have expiration times
- Failed login attempts can be tracked

## Performance Optimizations

### 1. Database Indexes

- Composite indexes for common query patterns
- Single-column indexes for individual lookups
- Optimized indexes for permission checks

### 2. Query Optimization

- Efficient joins for permission lookups
- Caching strategies for frequently accessed permissions
- Pagination for large result sets

### 3. Connection Management

- Connection pooling for database efficiency
- Proper connection cleanup and error handling
- Optimized query patterns

## Setup Instructions

### 1. Database Setup

```bash
# Navigate to server directory
cd server

# Run the setup script
node scripts/setup-permissions.js
```

### 2. Manual Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Validate schema
node test-schema-validation.js
```

### 3. Environment Configuration

Ensure your `.env` file contains:

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

## Testing

### Schema Validation

```bash
node test-schema-validation.js
```

### API Testing

```bash
# Test authentication endpoints
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"password123"}'

# Test permission endpoints
curl -X GET http://localhost:3001/api/permissions/user/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check database connection
   - Verify DATABASE_URL format
   - Ensure database exists and is accessible

2. **Permission Denied Errors**
   - Verify user has correct role assignments
   - Check role permissions are properly set
   - Ensure tenant isolation is working

3. **Performance Issues**
   - Verify indexes are created properly
   - Check query execution plans
   - Monitor database performance metrics

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# View database schema
npx prisma studio

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## Future Enhancements

### Planned Features

1. **Permission Groups**: Group permissions for easier management
2. **Temporary Permissions**: Time-limited permission grants
3. **Permission Inheritance**: Hierarchical permission structures
4. **Advanced Auditing**: More detailed audit trail features
5. **Permission Analytics**: Usage analytics and reporting

### Performance Improvements

1. **Permission Caching**: Redis-based permission caching
2. **Query Optimization**: Further database query optimizations
3. **Connection Pooling**: Enhanced connection management
4. **Read Replicas**: Database read replica support

## Support

For issues or questions regarding the permissions system:

1. Check the troubleshooting section above
2. Review the database schema and migrations
3. Test with the provided seed data
4. Verify environment configuration
5. Check server logs for detailed error messages
