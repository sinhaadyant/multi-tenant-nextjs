# Tenant Modules Implementation

## Overview

This document details the comprehensive implementation of dynamic tenant modules with full CRUD operations, search filters, pagination, and permission-based access control. All modules are designed to match the superadmin implementation pattern while being scoped to tenant-specific data.

## 🎯 **Implemented Modules**

### 1. **Users Management** (`/api/tenant/[tenantSlug]/users`)
- **CRUD Operations**: Create, Read, Update, Delete individual users
- **Bulk Actions**: Activate, Deactivate, Delete, Assign Roles
- **Search & Filters**: Name, Email, Status, Role, Department
- **Pagination**: Configurable page size and navigation
- **Permissions**: View, ViewAll, Create, Update, Delete

### 2. **Roles Management** (`/api/tenant/[tenantSlug]/roles`)
- **CRUD Operations**: Create, Read, Update, Delete individual roles
- **Bulk Actions**: Activate, Deactivate, Delete
- **Search & Filters**: Name, Description, Status, System Roles
- **Pagination**: Configurable page size and navigation
- **Permissions**: View, Create, Update, Delete
- **Role Permissions**: Granular permission assignment per module

### 3. **Audit Logs** (`/api/tenant/[tenantSlug]/audit-logs`)
- **Read Operations**: List audit logs with comprehensive filtering
- **Create Operations**: Manual audit log creation for testing
- **Search & Filters**: Action, Resource, User, Date Range, Severity
- **Pagination**: Configurable page size and navigation
- **Permissions**: View, ViewAll, Create, Export
- **Statistics**: Activity breakdown by severity and type

### 4. **Reports** (`/api/tenant/[tenantSlug]/reports`)
- **CRUD Operations**: Create, Read, Update, Delete individual reports
- **Bulk Actions**: Activate, Deactivate, Delete, Execute
- **Search & Filters**: Title, Type, Status, Format
- **Pagination**: Configurable page size and navigation
- **Permissions**: View, Create, Update, Delete, Execute
- **Scheduling**: Automated report generation and delivery

### 5. **Notifications** (`/api/tenant/[tenantSlug]/notifications`)
- **CRUD Operations**: Create, Read, Update, Delete individual notifications
- **Bulk Actions**: Activate, Deactivate, Delete, Mark as Read/Unread
- **Search & Filters**: Title, Type, Priority, Category, Status
- **Pagination**: Configurable page size and navigation
- **Permissions**: View, ViewAll, Create, Update, Delete
- **Recipients**: User-specific and global notifications

## 🔧 **API Endpoints Structure**

### Base Pattern
All tenant APIs follow this consistent pattern:
```
/api/tenant/[tenantSlug]/[module]/
├── GET    - List with filters, pagination, search
├── POST   - Create new item
├── PUT    - Bulk actions
└── /[id]/
    ├── GET    - Get specific item
    ├── PUT    - Update specific item
    └── DELETE - Delete specific item
```

### Query Parameters
All list endpoints support these standard query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Global search term
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

### Response Format
All APIs return consistent response format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {...},
    "permissions": {
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    }
  }
}
```

## 🔐 **Permission System**

### Permission Levels
Each module supports these permission levels:
- **View**: Can view own data
- **ViewAll**: Can view all data in tenant
- **Create**: Can create new items
- **Update**: Can modify existing items
- **Delete**: Can delete items

### Permission Checks
All API endpoints include comprehensive permission checks:
```typescript
// Example permission check
const hasViewPermission = await checkTenantPermission(req.user!, tenantId, 'users.view');
const hasViewAllPermission = await checkTenantPermission(req.user!, tenantId, 'users.viewAll');

if (!hasViewPermission && !hasViewAllPermission) {
  return createErrorResponse('Insufficient permissions to view users', 403);
}
```

### Data Scoping
- Users without `ViewAll` permission only see their own data
- All operations are scoped to the tenant
- System roles are protected from modification
- Self-deletion is prevented

## 📊 **Search and Filtering**

### Global Search
All modules support global search across multiple fields:
```typescript
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } }
  ];
}
```

### Module-Specific Filters

#### Users
- `status` - Active/Inactive users
- `roleId` - Filter by specific role
- `department` - Filter by department

#### Roles
- `status` - Active/Inactive roles
- `isSystem` - System vs custom roles

#### Audit Logs
- `action` - Specific action type
- `resource` - Resource type
- `userId` - Specific user
- `severity` - Info/Warning/Error/Critical
- `startDate` / `endDate` - Date range

#### Reports
- `type` - User/Audit/System/Custom
- `status` - Active/Inactive
- `format` - PDF/CSV/Excel/JSON

#### Notifications
- `type` - Info/Success/Warning/Error
- `priority` - Low/Medium/High/Urgent
- `category` - Category filter
- `status` - Active/Inactive

## 📄 **Pagination**

### Standard Pagination
All list endpoints include comprehensive pagination:
```typescript
const pagination = {
  page,
  limit,
  total: totalItems,
  totalPages: Math.ceil(totalItems / limit),
  hasNext: page * limit < totalItems,
  hasPrev: page > 1
};
```

### Usage Examples
```bash
# First page with 10 items
GET /api/tenant/acme-corp/users?page=1&limit=10

# Second page with 5 items
GET /api/tenant/acme-corp/users?page=2&limit=5

# Search with pagination
GET /api/tenant/acme-corp/users?search=admin&page=1&limit=20
```

## 🔄 **CRUD Operations**

### Create Operations
All modules support creation with validation:
```typescript
// Example: Create user
const newUser = await prisma.user.create({
  data: {
    name: validatedData.name,
    email: validatedData.email,
    password: hashedPassword,
    tenantId: tenantId,
    isActive: true
  }
});
```

### Read Operations
Individual item retrieval with related data:
```typescript
// Example: Get user with roles and activity
const user = await prisma.user.findFirst({
  where: { id: userId, tenantId: tenantId },
  include: {
    userRoles: { include: { role: true } },
    auditLogs: { take: 10, orderBy: { createdAt: 'desc' } }
  }
});
```

### Update Operations
Partial updates with validation:
```typescript
// Example: Update user
const updateData: any = {};
if (validatedData.name !== undefined) updateData.name = validatedData.name;
if (validatedData.email !== undefined) updateData.email = validatedData.email;

const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: updateData
});
```

### Delete Operations
Safe deletion with dependency checks:
```typescript
// Example: Delete role with dependency check
const rolesWithUsers = await prisma.role.findMany({
  where: { id: { in: roleIds } },
  include: { _count: { select: { userRoles: true } } }
});

const rolesWithAssignedUsers = rolesWithUsers.filter(role => role._count.userRoles > 0);
if (rolesWithAssignedUsers.length > 0) {
  return createErrorResponse('Cannot delete roles that are assigned to users', 400);
}
```

## 🚀 **Bulk Actions**

### Supported Bulk Actions

#### Users
- `activate` - Activate multiple users
- `deactivate` - Deactivate multiple users
- `delete` - Delete multiple users
- `assignRoles` - Assign roles to multiple users

#### Roles
- `activate` - Activate multiple roles
- `deactivate` - Deactivate multiple roles
- `delete` - Delete multiple roles

#### Reports
- `activate` - Activate multiple reports
- `deactivate` - Deactivate multiple reports
- `delete` - Delete multiple reports
- `execute` - Execute multiple reports

#### Notifications
- `activate` - Activate multiple notifications
- `deactivate` - Deactivate multiple notifications
- `delete` - Delete multiple notifications
- `markAsRead` - Mark notifications as read
- `markAsUnread` - Mark notifications as unread

### Bulk Action Example
```typescript
// Example: Bulk activate users
const bulkAction = {
  userIds: ['user1', 'user2', 'user3'],
  action: 'activate'
};

const result = await prisma.user.updateMany({
  where: { id: { in: bulkAction.userIds }, tenantId },
  data: { isActive: true }
});
```

## 📈 **Statistics and Analytics**

### Module Statistics
Each module provides comprehensive statistics:

#### Users
```typescript
const userStats = {
  total: totalUsers,
  active: activeUsers,
  inactive: inactiveUsers
};
```

#### Roles
```typescript
const roleStats = {
  total: totalRoles,
  active: activeRoles,
  inactive: inactiveRoles,
  byType: { system: 2, custom: 8 }
};
```

#### Audit Logs
```typescript
const auditStats = {
  total: totalLogs,
  info: infoLogs,
  warning: warningLogs,
  error: errorLogs,
  critical: criticalLogs
};
```

#### Reports
```typescript
const reportStats = {
  total: totalReports,
  active: activeReports,
  inactive: inactiveReports,
  byType: { user: 5, audit: 3, system: 2, custom: 1 }
};
```

#### Notifications
```typescript
const notificationStats = {
  total: totalNotifications,
  active: activeNotifications,
  inactive: inactiveNotifications,
  byType: { info: 10, success: 5, warning: 3, error: 1 },
  byPriority: { low: 5, medium: 10, high: 3, urgent: 1 }
};
```

## 🧪 **Testing**

### Test Script
Comprehensive test script available:
```bash
npm run test:tenant-modules
```

### Test Coverage
The test script covers:
- ✅ Authentication and authorization
- ✅ CRUD operations for all modules
- ✅ Search and filtering functionality
- ✅ Pagination and sorting
- ✅ Bulk actions
- ✅ Permission-based access control
- ✅ Error handling and validation

### Test Modules
1. **Users API** - Full CRUD with bulk actions
2. **Roles API** - Full CRUD with permission management
3. **Audit Logs API** - Read operations with filtering
4. **Reports API** - Full CRUD with execution
5. **Notifications API** - Full CRUD with read status

## 🔧 **Implementation Details**

### Database Schema
All modules use the existing Prisma schema with tenant-scoped queries:
```typescript
const where: any = {
  tenantId: tenantId  // Always scope to tenant
};
```

### Error Handling
Comprehensive error handling with proper HTTP status codes:
```typescript
try {
  // API logic
} catch (error: any) {
  console.error('Error:', error);
  if (error.name === 'ZodError') {
    return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
  }
  return createErrorResponse(
    error.message || 'Failed to perform operation',
    error.status || 500
  );
}
```

### Audit Logging
All operations are logged for audit purposes:
```typescript
await createAuditLogFromRequest(req, {
  action: 'user.created',
  details: `Created user: ${newUser.name} (${newUser.email})`,
  resource: 'user',
  resourceId: newUser.id
});
```

### Validation
All inputs are validated using Zod schemas:
```typescript
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional()
});
```

## 🚀 **Usage Examples**

### Frontend Integration
```typescript
// Example: Fetch users with filters
const fetchUsers = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/tenant/${tenantSlug}/users?${params}`);
  const data = await response.json();
  return data.data;
};

// Example: Create user
const createUser = async (userData) => {
  const response = await fetch(`/api/tenant/${tenantSlug}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await response.json();
};
```

### API Usage
```bash
# Get users with search and pagination
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/tenant/acme-corp/users?search=admin&page=1&limit=10"

# Create new user
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}' \
  "http://localhost:3000/api/tenant/acme-corp/users"

# Bulk activate users
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userIds":["user1","user2"],"action":"activate"}' \
  "http://localhost:3000/api/tenant/acme-corp/users"
```

## 📋 **Future Enhancements**

### Planned Features
1. **Export Functionality** - CSV/Excel export for all modules
2. **Advanced Filtering** - Date ranges, complex queries
3. **Real-time Updates** - WebSocket integration
4. **Batch Operations** - Import/export capabilities
5. **Advanced Analytics** - Custom dashboards and reports

### Performance Optimizations
1. **Database Indexing** - Optimized queries for large datasets
2. **Caching** - Redis integration for frequently accessed data
3. **Pagination Optimization** - Cursor-based pagination for large datasets
4. **Query Optimization** - Efficient database queries

## 🎯 **Conclusion**

The tenant modules implementation provides a comprehensive, secure, and scalable solution for multi-tenant applications. All modules follow consistent patterns, include proper permission controls, and support full CRUD operations with advanced filtering and pagination.

Key benefits:
- ✅ **Consistent API Design** - All modules follow the same patterns
- ✅ **Comprehensive CRUD** - Full create, read, update, delete operations
- ✅ **Advanced Filtering** - Search, filters, and pagination
- ✅ **Permission Control** - Granular access control
- ✅ **Bulk Operations** - Efficient batch processing
- ✅ **Audit Logging** - Complete operation tracking
- ✅ **Error Handling** - Robust error management
- ✅ **Testing Coverage** - Comprehensive test suite

The implementation is production-ready and provides a solid foundation for building scalable multi-tenant applications.
