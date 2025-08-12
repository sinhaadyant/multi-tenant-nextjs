# Roles & Permissions Management Module

## Overview

The Roles & Permissions Management Module is a comprehensive solution for managing user roles, permissions, and role assignments across multi-tenant applications. It provides a complete interface for superadmins to manage role-based access control (RBAC) for all tenants in the system.

## Features

### 🏢 Tenant Selection
- **Dropdown with Search**: Search and select tenants with pagination
- **Real-time Data Loading**: Automatically loads roles, users, and modules for selected tenant
- **Tenant Information Display**: Shows tenant name, slug, user count, and status

### 🛡️ Role Management
- **CRUD Operations**: Create, read, update, and delete roles
- **Search & Filtering**: Search roles by name/description, filter by status
- **Sorting**: Sort by name, creation date, or user count
- **Pagination**: Efficient pagination for large role lists
- **Validation**: Role name uniqueness per tenant, required fields validation

### 🔧 Module Permissions
- **Module List**: Display all available modules with their permissions
- **Permission Matrix**: Checkbox interface for View/Create/Edit/Delete permissions
- **Bulk Operations**: Select all permissions per module or globally
- **Real-time Updates**: Save permissions with immediate feedback
- **Permission Counting**: Show selected permissions count per module

### 👥 Role Assignment
- **User List**: Display all users in the selected tenant
- **Role Dropdown**: Assign roles to users via dropdown selection
- **Bulk Assignment**: Assign the same role to multiple users
- **Search & Filtering**: Search users by name/email, filter by status/role
- **Assignment Tracking**: Track current role assignments and changes

## Architecture

### Frontend Components

#### Core Components
- **`TenantSelector`**: Dropdown for tenant selection with search and pagination
- **`RoleList`**: Table displaying roles with CRUD operations
- **`RoleForm`**: Modal form for creating/editing roles
- **`ModulePermissionTable`**: Permission matrix for role-module assignments
- **`RoleAssignmentTable`**: Interface for assigning roles to users

#### Supporting Components
- **`useRolesPermissionsAPI`**: Custom hook for all API operations
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Success/error feedback

### Backend API Endpoints

#### Core Endpoints
- `GET /api/superadmin/tenants` - Fetch tenants with pagination
- `GET /api/superadmin/roles` - Fetch roles with filtering and pagination
- `POST /api/superadmin/roles` - Create new role
- `PUT /api/superadmin/roles/[id]` - Update existing role
- `DELETE /api/superadmin/roles/[id]` - Delete role
- `GET /api/superadmin/modules` - Fetch all available modules
- `POST /api/superadmin/roles/[id]/permissions` - Update role permissions
- `POST /api/superadmin/role-assignment` - Assign roles to users

#### Enhanced Features
- **Pagination**: All list endpoints support pagination
- **Search**: Text-based search across relevant fields
- **Filtering**: Status-based and relationship-based filtering
- **Sorting**: Multiple sort options with direction control
- **Audit Logging**: All operations are logged for compliance

## Database Schema

### Core Tables
```sql
-- Roles table with tenant relationship
CREATE TABLE roles (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  isGlobal BOOLEAN DEFAULT false,
  tenantId VARCHAR(191),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, tenantId)
);

-- Modules table
CREATE TABLE modules (
  id VARCHAR(191) PRIMARY KEY,
  moduleKey VARCHAR(191) UNIQUE NOT NULL,
  moduleName VARCHAR(191) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  orderIndex INT DEFAULT 0
);

-- Permissions table
CREATE TABLE permissions (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL,
  action VARCHAR(191) NOT NULL,
  moduleKey VARCHAR(191) NOT NULL,
  isActive BOOLEAN DEFAULT true
);

-- Role-Permission relationships
CREATE TABLE role_permissions (
  roleId VARCHAR(191) NOT NULL,
  permissionId VARCHAR(191) NOT NULL,
  PRIMARY KEY(roleId, permissionId)
);

-- User-Role relationships
CREATE TABLE user_roles (
  userId VARCHAR(191) NOT NULL,
  roleId VARCHAR(191) NOT NULL,
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  assignedBy VARCHAR(191),
  PRIMARY KEY(userId, roleId)
);
```

## API Documentation

### Authentication
All endpoints require superadmin authentication via JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Handling
Errors follow a consistent format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Usage Examples

### 1. Select Tenant and Load Data
```javascript
// Select a tenant
const tenant = await fetchTenants({ search: 'TechCorp' });
await loadTenantData(tenant[0]);

// This automatically loads:
// - Roles for the tenant
// - Users in the tenant
// - Available modules
```

### 2. Create a New Role
```javascript
const newRole = await createRole({
  name: 'Content Manager',
  description: 'Manages content and publications',
  tenantId: 'tenant-id'
});
```

### 3. Assign Permissions to Role
```javascript
await updateRolePermissions(roleId, [
  {
    moduleId: 'content-management',
    actions: ['view', 'create', 'edit']
  },
  {
    moduleId: 'user-management',
    actions: ['view']
  }
]);
```

### 4. Assign Role to Users
```javascript
await assignRolesToUsers(tenantId, [
  {
    userId: 'user-1',
    roleId: 'role-1'
  },
  {
    userId: 'user-2',
    roleId: 'role-1'
  }
]);
```

## Security Features

### Access Control
- **Superadmin Only**: All operations require superadmin privileges
- **Tenant Isolation**: Users can only manage roles within their assigned tenants
- **Audit Logging**: All operations are logged with user and timestamp
- **Input Validation**: Comprehensive validation on all inputs

### Data Protection
- **JWT Authentication**: Secure token-based authentication
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF protection

## Testing

### Automated Tests
Run the comprehensive test suite:
```bash
node scripts/test-roles-permissions.js
```

### Manual Testing Checklist
- [ ] Tenant selection with search and pagination
- [ ] Role creation with validation
- [ ] Role editing and deletion
- [ ] Permission assignment and removal
- [ ] Role assignment to users
- [ ] Bulk operations (select all, clear all)
- [ ] Search and filtering functionality
- [ ] Pagination on all lists
- [ ] Error handling and user feedback
- [ ] Responsive design on mobile devices

## Performance Considerations

### Optimization Strategies
- **Pagination**: All lists use pagination to limit data transfer
- **Debounced Search**: Search inputs use debouncing to reduce API calls
- **Caching**: Module data is cached to reduce redundant requests
- **Lazy Loading**: Components load data only when needed
- **Optimistic Updates**: UI updates immediately, then syncs with server

### Database Optimization
- **Indexes**: Proper indexing on frequently queried fields
- **Eager Loading**: Related data loaded in single queries
- **Transaction Usage**: Critical operations wrapped in transactions
- **Query Optimization**: Efficient queries with proper joins

## Troubleshooting

### Common Issues

#### 1. "Role name already exists" Error
**Cause**: Duplicate role names within the same tenant
**Solution**: Use a unique role name or check existing roles first

#### 2. "Tenant not found" Error
**Cause**: Invalid tenant ID or tenant doesn't exist
**Solution**: Verify tenant exists and user has access

#### 3. "Permission denied" Error
**Cause**: User doesn't have superadmin privileges
**Solution**: Ensure user is logged in as superadmin

#### 4. "Module not found" Error
**Cause**: Invalid module ID or module is inactive
**Solution**: Check module exists and is active

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=roles-permissions:*
```

## Future Enhancements

### Planned Features
- **Role Templates**: Pre-defined role templates for common use cases
- **Permission Inheritance**: Hierarchical permission inheritance
- **Time-based Permissions**: Temporary role assignments
- **Advanced Analytics**: Role usage analytics and insights
- **Bulk Import/Export**: CSV import/export for role assignments
- **Role Approval Workflow**: Approval process for role changes
- **Integration APIs**: REST APIs for external system integration

### Scalability Improvements
- **Redis Caching**: Implement Redis for better performance
- **Database Sharding**: Support for database sharding
- **Microservices**: Break into microservices for better scalability
- **Event-driven Architecture**: Implement event sourcing for audit trails

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npm run db:setup`
4. Start development server: `npm run dev`
5. Run tests: `npm run test:roles-permissions`

### Code Standards
- **TypeScript**: All new code must be written in TypeScript
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Testing**: Write unit tests for all new features
- **Documentation**: Update documentation for all changes

### Pull Request Process
1. Create feature branch from main
2. Implement feature with tests
3. Update documentation
4. Submit pull request with description
5. Address review comments
6. Merge after approval

## Support

### Getting Help
- **Documentation**: Check this documentation first
- **Issues**: Create GitHub issue for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact development team for urgent issues

### Reporting Bugs
When reporting bugs, please include:
- **Environment**: OS, Node.js version, database type
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected vs Actual**: What you expected vs what happened
- **Logs**: Relevant error logs and stack traces
- **Screenshots**: Visual evidence if applicable

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: Development Team
