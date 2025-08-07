# Roles & Permissions Management Module

## Overview

The Roles & Permissions Management Module provides a comprehensive system for managing user roles, permissions, and role assignments across the multi-tenant platform. This module is designed with security, scalability, and user experience in mind.

## Features

### 1. Roles Management
- **CRUD Operations**: Create, read, update, and delete roles
- **Permission Assignment**: Assign multiple permissions to roles via checkbox interface
- **Role Types**: Support for global roles (applies to all tenants) and tenant-specific roles
- **Status Management**: Activate/deactivate roles
- **Validation**: Client-side and server-side validation with proper error handling
- **Search & Filter**: Search roles by name/description and filter by status
- **Sorting**: Sort by name, creation date, or user count
- **Pagination**: Handle large numbers of roles efficiently

### 2. Permission Groups
- **Module-based Organization**: Permissions are organized by modules (users, tenants, roles, etc.)
- **Permission Management**: Create, edit, and delete individual permissions
- **Grouped Display**: View permissions grouped by module for better organization
- **Search & Filter**: Search permissions and filter by module
- **Validation**: Prevent duplicate permission names and reserved keywords

### 3. Role Assignment
- **User-Role Management**: Assign and remove roles from users
- **Multi-tenant Support**: Filter users by tenant
- **Real-time Updates**: Optimistic UI updates with proper error handling
- **Bulk Operations**: Efficient handling of multiple role assignments
- **Audit Trail**: Track all role assignment changes

## Technical Implementation

### Database Schema

```sql
-- Roles table
CREATE TABLE roles (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL,
  description TEXT,
  isGlobal BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(191) NOT NULL,
  action VARCHAR(191) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Role-Permission relationship table
CREATE TABLE role_permissions (
  id VARCHAR(191) PRIMARY KEY,
  roleId VARCHAR(191) NOT NULL,
  permissionId VARCHAR(191) NOT NULL,
  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(roleId, permissionId)
);

-- Users table (existing, with roleId added)
ALTER TABLE users ADD COLUMN roleId VARCHAR(191);
ALTER TABLE users ADD FOREIGN KEY (roleId) REFERENCES roles(id);
```

### API Endpoints

#### Roles
- `GET /api/superadmin/roles` - List all roles
- `POST /api/superadmin/roles` - Create new role
- `GET /api/superadmin/roles/[id]` - Get specific role
- `PUT /api/superadmin/roles/[id]` - Update role
- `DELETE /api/superadmin/roles/[id]` - Delete role

#### Permissions
- `GET /api/superadmin/permissions` - List all permissions
- `POST /api/superadmin/permissions` - Create new permission
- `GET /api/superadmin/permissions/[id]` - Get specific permission
- `PUT /api/superadmin/permissions/[id]` - Update permission
- `DELETE /api/superadmin/permissions/[id]` - Delete permission

#### Role Assignment
- `PUT /api/superadmin/users/[id]/role` - Assign/remove role from user

### Component Structure

```
src/
├── app/
│   └── superadmin/
│       └── roles/
│           └── page.tsx                    # Main roles page with tabs
├── components/
│   └── superadmin/
│       └── roles/
│           ├── RolesManagement.tsx         # Roles list and management
│           ├── PermissionGroups.tsx        # Permission groups display
│           ├── RoleAssignment.tsx          # User role assignment
│           ├── CreateRoleModal.tsx         # Create role modal
│           ├── EditRoleModal.tsx           # Edit role modal
│           ├── ViewRoleModal.tsx           # View role details modal
│           ├── DeleteRoleModal.tsx         # Delete confirmation modal
│           └── RolesSkeleton.tsx           # Loading skeleton
├── hooks/
│   ├── useRolesAPI.ts                      # Roles API hook
│   └── usePermissionsAPI.ts                # Permissions API hook
└── app/
    └── api/
        └── superadmin/
            ├── roles/
            │   ├── route.ts                # Roles CRUD endpoints
            │   └── [id]/
            │       └── route.ts            # Individual role endpoints
            ├── permissions/
            │   ├── route.ts                # Permissions CRUD endpoints
            │   └── [id]/
            │       └── route.ts            # Individual permission endpoints
            └── users/
                └── [id]/
                    └── role/
                        └── route.ts        # User role assignment endpoint
```

## Security Features

### Authentication & Authorization
- All endpoints require SuperAdmin authentication
- Role-based access control for different operations
- Audit logging for all role and permission changes

### Data Validation
- Client-side validation with immediate feedback
- Server-side validation for all inputs
- SQL injection prevention through Prisma ORM
- XSS protection through proper input sanitization

### Business Logic Protection
- Prevent deletion of roles assigned to users
- Prevent deletion of permissions assigned to roles
- Validate role assignments against active roles only
- Check for duplicate names and reserved keywords

## User Experience Features

### Loading States
- Skeleton loaders for all list views
- Loading indicators for form submissions
- Optimistic UI updates with rollback on errors

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Retry mechanisms for failed operations
- Graceful degradation for network issues

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

## Usage Examples

### Creating a New Role
1. Navigate to Roles & Permissions → Roles Management
2. Click "Create Role" button
3. Fill in role name and description
4. Select permissions from grouped checkboxes
5. Choose if it's a global role
6. Submit the form

### Assigning Roles to Users
1. Navigate to Roles & Permissions → Role Assignment
2. Use filters to find specific users
3. Select a role from the dropdown for each user
4. Changes are saved automatically

### Managing Permissions
1. Navigate to Roles & Permissions → Permission Groups
2. View permissions organized by module
3. Use search and filters to find specific permissions
4. Edit or delete permissions as needed

## Seeding Data

To populate the system with initial permissions and roles:

```bash
npm run seed:permissions-roles
```

This will create:
- 30+ predefined permissions across 8 modules
- 4 default roles (Super Administrator, Tenant Administrator, User Manager, Viewer)
- Proper role-permission relationships

## Testing

### Unit Tests
- Component testing with React Testing Library
- Hook testing for API operations
- Utility function testing

### Integration Tests
- API endpoint testing
- Database operation testing
- Authentication flow testing

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness testing

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Efficient joins for role-permission relationships
- Pagination for large datasets

### Frontend Optimization
- React.memo for expensive components
- useMemo and useCallback for expensive calculations
- Lazy loading for modals and complex components

### Caching Strategy
- Client-side caching of roles and permissions
- Optimistic updates for better perceived performance
- Background refresh for stale data

## Monitoring & Analytics

### Audit Logging
- All role and permission changes are logged
- User assignment changes are tracked
- Detailed context for each operation

### Performance Metrics
- API response times
- Component render times
- User interaction patterns

### Error Tracking
- Client-side error reporting
- Server-side error logging
- User feedback collection

## Future Enhancements

### Planned Features
- Bulk role assignment operations
- Role templates and inheritance
- Advanced permission conditions
- Role-based UI customization
- Integration with external identity providers

### Scalability Improvements
- Redis caching for frequently accessed data
- Database sharding for large deployments
- Microservice architecture for role management
- GraphQL API for flexible data fetching

## Troubleshooting

### Common Issues

1. **Role not appearing in assignment dropdown**
   - Check if role is active
   - Verify role is not tenant-specific for global users

2. **Permission changes not reflecting**
   - Clear browser cache
   - Check for JavaScript errors in console
   - Verify API response status

3. **Cannot delete role**
   - Ensure no users are assigned to the role
   - Check audit logs for assignment history

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed API logs and component state changes.

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team. 