# Comprehensive Role and Permission Module Implementation

## Overview

This document provides a complete implementation guide for the Role and Permission module in the multi-tenant Next.js application. The module allows tenant admins to manage roles and assign granular permissions to different modules with full CRUD operations, security, and modern UI.

## 🏗️ Architecture Overview

### Database Schema

The implementation uses an enhanced Prisma schema with the following key models:

```prisma
model Role {
  id          String           @id @default(cuid())
  name        String
  description String?
  isActive    Boolean          @default(true)
  isDefault   Boolean          @default(false)
  isTemplate  Boolean          @default(false)
  isSystem    Boolean          @default(false)
  color       String?
  priority    Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  createdBy   String?
  tenantId    String?
  tenant      Tenant?          @relation(fields: [tenantId], references: [id])
  permissions RolePermission[]
  userRoles   UserRole[]

  @@unique([name, tenantId])
  @@index([tenantId])
  @@index([isActive])
  @@index([isTemplate])
}

model Permission {
  id              String           @id @default(cuid())
  name            String           @unique
  description     String?
  moduleKey       String
  module          Module           @relation(fields: [moduleKey], references: [moduleKey])
  submodule       String?
  action          String
  resource        String?
  isActive        Boolean          @default(true)
  isSystem        Boolean          @default(false)
  category        String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  rolePermissions RolePermission[]

  @@unique([moduleKey, action, resource])
  @@index([moduleKey])
  @@index([action])
  @@index([isActive])
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

## 🔧 API Endpoints

### 1. Roles Management

#### GET `/api/tenant/[tenantSlug]/roles`
- **Purpose**: Fetch paginated list of roles with filtering and sorting
- **Features**:
  - Pagination support
  - Search by name/description
  - Filter by status and type
  - Sort by name, created date, priority
  - Includes permission count and user count
  - Tenant isolation

#### POST `/api/tenant/[tenantSlug]/roles`
- **Purpose**: Create new role
- **Validation**:
  - Role name uniqueness within tenant
  - Required fields validation
  - Permission assignment support
- **Features**:
  - Default role handling
  - Color and priority assignment
  - Audit logging

#### PUT `/api/tenant/[tenantSlug]/roles/[id]`
- **Purpose**: Update existing role
- **Security**:
  - Prevents system role modification
  - Validates tenant ownership
- **Features**:
  - Partial updates
  - Permission reassignment
  - Default role management

#### DELETE `/api/tenant/[tenantSlug]/roles/[id]`
- **Purpose**: Delete role
- **Safety Checks**:
  - Prevents deletion of system roles
  - Prevents deletion of default roles
  - Checks for assigned users
- **Features**:
  - Cascade permission deletion
  - Audit logging

### 2. Permissions Management

#### GET `/api/tenant/[tenantSlug]/permissions`
- **Purpose**: Fetch available permissions grouped by module
- **Features**:
  - Module-based grouping
  - Filtering by module, category, action
  - Active permissions only
  - Hierarchical structure

### 3. Role Assignment

#### GET `/api/tenant/[tenantSlug]/roles/assign`
- **Purpose**: Get role permissions for assignment interface
- **Features**:
  - Current permissions vs available permissions
  - Module-based organization
  - Assignment status indicators

#### POST `/api/tenant/[tenantSlug]/roles/assign`
- **Purpose**: Assign permissions to role
- **Features**:
  - Bulk permission assignment
  - Transaction safety
  - Validation of permission existence
  - Audit logging

## 🎨 Frontend Components

### 1. Roles Management Page (`src/app/[tenantSlug]/roles/page.tsx`)

**Features**:
- Modern table layout with sorting and filtering
- Real-time search and filtering
- Pagination support
- Permission-based action buttons
- Loading states and error handling
- Responsive design

**Key Components**:
- Role status indicators (Active, System, Default, Template)
- User count display
- Permission count display
- Action buttons (Edit, Delete, Manage Permissions)

### 2. Create Role Modal (`src/components/tenant/CreateRoleModal.tsx`)

**Features**:
- Form validation using Zod schema
- Color picker for role identification
- Priority setting
- Default role option with warnings
- Real-time validation feedback

**Form Fields**:
- Role name (required, unique validation)
- Description (optional)
- Color selection (9 predefined colors)
- Priority (0-100)
- Default role checkbox

### 3. Permissions Modal (`src/components/tenant/PermissionsModal.tsx`)

**Features**:
- Grid and list view modes
- Search functionality across permissions
- Module-based organization
- Bulk selection (module-level)
- Individual permission selection
- Visual indicators for system permissions

**UI Elements**:
- Expandable module sections
- Permission cards with action badges
- Checkbox selection
- Search with real-time filtering
- Permission counters

## 🔐 Security Implementation

### 1. Authentication & Authorization

```typescript
// Middleware-based authentication
export const withTenantAuth = (handler: Function) => {
  return async (req: AuthenticatedRequest, context: any) => {
    // JWT token verification
    // Tenant context validation
    // User permission checking
  };
};
```

### 2. Permission Checking

```typescript
async function checkUserPermission(userId: string, tenantId: string, module: string, action: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isActive: true },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  return user.userRoles.some(userRole =>
    userRole.role.permissions.some(rp => 
      rp.permission.moduleKey === module && 
      (rp.permission.action === action || rp.permission.action === 'manage')
    )
  );
}
```

### 3. Tenant Isolation

- All queries include tenant context
- Role names are unique within tenants
- Permissions are scoped to tenant modules
- API endpoints validate tenant ownership

## 📊 Data Management

### 1. React Query Integration

```typescript
// Roles query with caching
const { data: rolesData, isLoading, error, refetch } = useQuery({
  queryKey: ['roles', tenantSlug, filters, currentPage],
  queryFn: async () => {
    const response = await axios.get(`/api/tenant/${tenantSlug}/roles?${params}`);
    return response.data.data;
  },
  enabled: canViewRoles
});

// Mutations with optimistic updates
const createRoleMutation = useMutation({
  mutationFn: async (roleData: any) => {
    const response = await axios.post(`/api/tenant/${tenantSlug}/roles`, roleData);
    return response.data.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles', tenantSlug] });
    toast.success('Role created successfully');
  }
});
```

### 2. Form Validation

```typescript
const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0)
});
```

## 🎯 Key Features Implemented

### 1. Role Management
- ✅ Create, read, update, delete roles
- ✅ Role status management (active/inactive)
- ✅ Default role designation
- ✅ Template role support
- ✅ System role protection
- ✅ Color coding and priority
- ✅ User assignment tracking

### 2. Permission Assignment
- ✅ Granular CRUD permissions
- ✅ Module-based organization
- ✅ Bulk permission assignment
- ✅ Search and filter capabilities
- ✅ Visual permission indicators
- ✅ System permission protection

### 3. User Interface
- ✅ Modern, responsive design
- ✅ Real-time search and filtering
- ✅ Pagination support
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Confirmation modals
- ✅ Dark mode support

### 4. Security & Performance
- ✅ Tenant isolation
- ✅ Permission-based access control
- ✅ Input validation and sanitization
- ✅ Audit logging
- ✅ Optimistic updates
- ✅ Background refetching
- ✅ Error boundaries

## 🚀 Usage Examples

### Creating a Role
```typescript
const handleCreateRole = (roleData) => {
  createRoleMutation.mutate({
    name: "Content Manager",
    description: "Manages content and publications",
    color: "blue",
    priority: 50,
    isDefault: false,
    permissions: ["perm1", "perm2", "perm3"]
  });
};
```

### Assigning Permissions
```typescript
const handleAssignPermissions = (permissions) => {
  assignPermissionsMutation.mutate({
    roleId: "role123",
    permissions: ["perm1", "perm2", "perm3"]
  });
};
```

### Checking Permissions
```typescript
const canEditRoles = hasPermission('roles', 'update');
const canDeleteRoles = hasPermission('roles', 'delete');
const canManagePermissions = hasPermission('roles', 'update');
```

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="mysql://..."
JWT_SECRET="your-jwt-secret"
```

### Dependencies
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@hookform/resolvers": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "react-hot-toast": "^2.0.0",
  "lucide-react": "^0.300.0"
}
```

## 📈 Performance Optimizations

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Query Optimization**: Efficient joins and includes
3. **Caching**: React Query for client-side caching
4. **Pagination**: Server-side pagination for large datasets
5. **Lazy Loading**: Modal components loaded on demand
6. **Debounced Search**: Prevents excessive API calls

## 🔮 Future Enhancements

1. **Role Hierarchy**: Support for role inheritance
2. **Permission Templates**: Predefined permission sets
3. **Bulk Operations**: Mass role/permission updates
4. **Advanced Filtering**: More granular search options
5. **Audit Trail**: Detailed permission change history
6. **Role Analytics**: Usage statistics and insights
7. **API Rate Limiting**: Enhanced security measures
8. **Real-time Updates**: WebSocket integration for live updates

## 🧪 Testing Strategy

### Unit Tests
- API endpoint validation
- Permission checking logic
- Form validation schemas
- Component rendering

### Integration Tests
- End-to-end role creation flow
- Permission assignment workflow
- Tenant isolation verification
- Error handling scenarios

### Performance Tests
- Large dataset handling
- Concurrent user scenarios
- Database query optimization

## 📚 Best Practices

1. **Security First**: Always validate permissions before operations
2. **Tenant Isolation**: Never mix data between tenants
3. **Input Validation**: Validate all user inputs
4. **Error Handling**: Provide meaningful error messages
5. **Audit Logging**: Track all permission changes
6. **Performance**: Use efficient queries and caching
7. **User Experience**: Provide clear feedback and loading states
8. **Accessibility**: Ensure keyboard navigation and screen reader support

This implementation provides a robust, scalable, and secure role and permission management system that can handle complex multi-tenant scenarios while maintaining excellent user experience and performance. 