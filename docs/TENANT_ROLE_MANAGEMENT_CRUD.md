# Tenant Role Management CRUD Implementation

## Overview

This document describes the implementation of dynamic CRUD (Create, Read, Update, Delete) operations for tenant role management, with proper validations and similar functionality to the superadmin implementation.

## Features Implemented

### ✅ **Core CRUD Operations**
- **Create**: Add new roles with custom permissions
- **Read**: View role details, list all roles with filtering and pagination
- **Update**: Edit existing roles and their permissions
- **Delete**: Remove roles with proper validation

### ✅ **Advanced Features**
- **Role Assignment**: Assign/remove roles from users
- **Bulk Operations**: Delete multiple roles at once
- **Status Management**: Activate/deactivate roles
- **Permission Management**: Granular permission control per module

### ✅ **Validation & Security**
- **Form Validation**: Client-side and server-side validation
- **Permission Checks**: Role-based access control
- **System Role Protection**: Prevent modification of system roles
- **User Assignment Validation**: Check for active users before deletion

## Architecture

### 1. API Layer (`src/hooks/useTenantRolesAPI.ts`)

```typescript
// Main hook providing all CRUD operations
export const useTenantRolesAPI = () => {
  // Queries
  const useRoles = (page, limit, search, status) => { ... }
  const useAllRoles = () => { ... }
  const useModules = () => { ... }
  const useUsers = () => { ... }
  
  // Mutations
  const useCreateRole = () => { ... }
  const useUpdateRole = () => { ... }
  const useDeleteRole = () => { ... }
  const useBulkDeleteRoles = () => { ... }
  const useToggleRoleStatus = () => { ... }
  const useAssignRole = () => { ... }
  const useRemoveRole = () => { ... }
  
  // Validation
  const validateCreateRole = (data) => { ... }
  const validateUpdateRole = (data) => { ... }
}
```

### 2. Main Component (`src/components/tenant/TenantRolesClient.tsx`)

The main client component that orchestrates all role management operations:

```typescript
const TenantRolesClient: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete' | 'assign' | null>(null);
  
  // API hooks
  const { useRoles, useCreateRole, useUpdateRole, useDeleteRole } = useTenantRolesAPI();
  
  // Event handlers
  const handleCreateRole = async (roleData) => { ... }
  const handleEditRole = async (roleData) => { ... }
  const handleDeleteRole = async () => { ... }
  const handleBulkDelete = async () => { ... }
}
```

### 3. Modal Components

#### Create Role Modal (`src/components/tenant/roles/CreateRoleModal.tsx`)
- Form validation with real-time feedback
- Permission selection with visual indicators
- Color picker for role customization
- Module-based permission organization

#### Edit Role Modal (`src/components/tenant/roles/EditRoleModal.tsx`)
- Pre-populated form with existing role data
- Permission modification with validation
- System role protection

#### View Role Modal (`src/components/tenant/roles/ViewRoleModal.tsx`)
- Read-only display of role information
- Permission summary with visual badges
- User assignment statistics

#### Delete Role Modal (`src/components/tenant/roles/DeleteRoleModal.tsx`)
- Confirmation dialog with warnings
- User assignment validation
- System role protection warnings

#### Role Assignment Modal (`src/components/tenant/roles/RoleAssignmentModal.tsx`)
- User search and filtering
- Bulk role assignment
- Visual distinction between assigned/unassigned users

## Validation Rules

### Create Role Validation
```typescript
const validateCreateRole = (data: CreateRoleData) => {
  const errors: string[] = [];
  
  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Role name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Role name must be at least 2 characters long');
  } else if (data.name.trim().length > 50) {
    errors.push('Role name must be less than 50 characters');
  }
  
  // Description validation
  if (data.description && data.description.length > 200) {
    errors.push('Description must be less than 200 characters');
  }
  
  // Color validation
  if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Valid color is required');
  }
  
  // Permission validation
  if (!data.permissions || data.permissions.length === 0) {
    errors.push('At least one permission is required');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### Update Role Validation
```typescript
const validateUpdateRole = (data: UpdateRoleData) => {
  const errors: string[] = [];
  
  // Conditional name validation
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Role name is required');
    } else if (data.name.trim().length < 2) {
      errors.push('Role name must be at least 2 characters long');
    } else if (data.name.trim().length > 50) {
      errors.push('Role name must be less than 50 characters');
    }
  }
  
  // Other validations...
  return { isValid: errors.length === 0, errors };
};
```

## API Endpoints

### Role Management
- `GET /api/tenant/{tenantSlug}/roles` - List roles with pagination and filters
- `POST /api/tenant/{tenantSlug}/roles` - Create new role
- `PUT /api/tenant/{tenantSlug}/roles/{roleId}` - Update existing role
- `DELETE /api/tenant/{tenantSlug}/roles/{roleId}` - Delete role
- `PATCH /api/tenant/{tenantSlug}/roles/{roleId}/status` - Toggle role status
- `POST /api/tenant/{tenantSlug}/roles/bulk-delete` - Bulk delete roles

### Role Assignment
- `POST /api/tenant/{tenantSlug}/roles/{roleId}/assign` - Assign role to user
- `DELETE /api/tenant/{tenantSlug}/roles/{roleId}/assign/{userId}` - Remove role from user

### Supporting Endpoints
- `GET /api/tenant/{tenantSlug}/modules` - Get available modules for permissions
- `GET /api/tenant/{tenantSlug}/users` - Get users for role assignment

## UI/UX Features

### 1. **Responsive Design**
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

### 2. **Visual Feedback**
- Loading states with spinners
- Success/error toast notifications
- Color-coded status indicators
- Progress indicators for bulk operations

### 3. **Search & Filtering**
- Real-time search across role names and descriptions
- Status filtering (Active/Inactive/All)
- Role type filtering (System/Custom/All)
- Sortable columns (Name, Created Date, User Count)

### 4. **Bulk Operations**
- Multi-select with checkboxes
- Select all functionality
- Bulk delete with confirmation
- Visual selection indicators

### 5. **Permission Management**
- Module-based permission organization
- Visual permission indicators
- Select all permissions per module
- Permission summary display

## Security Considerations

### 1. **Permission-Based Access**
```typescript
// Check user permissions before showing actions
{permissions?.canCreate && (
  <Button onClick={() => setModalType('create')}>
    Create Role
  </Button>
)}

{permissions?.canUpdate && !role.isSystem && (
  <Button onClick={() => handleEditClick(role)}>
    Edit
  </Button>
)}
```

### 2. **System Role Protection**
```typescript
// Prevent editing system roles
const handleEditClick = (role: Role) => {
  if (role.isSystem) {
    toast.error('System roles cannot be edited');
    return;
  }
  setSelectedRole(role);
  setModalType('edit');
};
```

### 3. **User Assignment Validation**
```typescript
// Check for active users before deletion
{role.userCount > 0 && (
  <div className="warning-message">
    This role is assigned to {role.userCount} user(s)
  </div>
)}
```

## Error Handling

### 1. **API Error Handling**
```typescript
const useCreateRole = () => {
  return useMutation({
    mutationFn: async (roleData) => {
      // Validate data first
      const validation = validateCreateRole(roleData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const response = await api.post(`/tenant/${tenantSlug}/roles`, roleData);
      return response.data.data;
    },
    onSuccess: (newRole) => {
      // Optimistic updates
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create role');
    }
  });
};
```

### 2. **Form Validation**
```typescript
// Real-time validation feedback
const [errors, setErrors] = useState<string[]>([]);
const [touched, setTouched] = useState<Record<string, boolean>>({});

const handleInputChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setTouched(prev => ({ ...prev, [field]: true }));
  
  // Clear errors when user starts typing
  if (errors.length > 0) {
    setErrors([]);
  }
};
```

## Performance Optimizations

### 1. **React Query Integration**
- Automatic caching and background updates
- Optimistic updates for better UX
- Stale-while-revalidate pattern
- Automatic retry on failure

### 2. **Debounced Search**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Use debounced term for API calls
const { data: rolesData } = useRoles(currentPage, itemsPerPage, debouncedSearchTerm, statusFilter);
```

### 3. **Virtual Scrolling** (Future Enhancement)
- For large role lists
- Improved performance with thousands of roles

## Testing Strategy

### 1. **Unit Tests**
- Validation functions
- API hooks
- Utility functions

### 2. **Integration Tests**
- Modal interactions
- Form submissions
- API responses

### 3. **E2E Tests**
- Complete role management workflows
- Permission scenarios
- Error handling

## Future Enhancements

### 1. **Role Templates**
- Pre-defined role templates
- Quick role creation from templates
- Template management

### 2. **Advanced Permissions**
- Conditional permissions
- Time-based permissions
- IP-based restrictions

### 3. **Audit Trail**
- Role change history
- Permission modification logs
- User assignment tracking

### 4. **Role Hierarchy**
- Parent-child role relationships
- Inherited permissions
- Role inheritance management

## Usage Examples

### Creating a New Role
```typescript
const handleCreateRole = async (roleData: CreateRoleData) => {
  try {
    await createRoleMutation.mutateAsync(roleData);
    setModalType(null);
    toast.success('Role created successfully');
  } catch (error) {
    // Error is handled by the mutation
  }
};
```

### Updating a Role
```typescript
const handleEditRole = async (roleData: UpdateRoleData) => {
  if (!selectedRole) return;
  
  try {
    await updateRoleMutation.mutateAsync({ 
      roleId: selectedRole.id, 
      roleData 
    });
    setModalType(null);
    setSelectedRole(null);
  } catch (error) {
    // Error is handled by the mutation
  }
};
```

### Deleting a Role
```typescript
const handleDeleteRole = async () => {
  if (!selectedRole) return;

  try {
    await deleteRoleMutation.mutateAsync(selectedRole.id);
    setModalType(null);
    setSelectedRole(null);
  } catch (error) {
    // Error is handled by the mutation
  }
};
```

## Conclusion

This implementation provides a comprehensive, secure, and user-friendly role management system for tenants. It includes all necessary CRUD operations with proper validation, error handling, and performance optimizations. The modular design makes it easy to extend and maintain, while the consistent UI/UX patterns ensure a smooth user experience.
