# Module and Menu Management System

## Overview

This implementation provides a complete module and menu management system for the multi-tenant Next.js application. The system allows administrators to create, manage, and organize application modules and submodules with hierarchical structure, drag-and-drop reordering, and dynamic menu generation.

## Features

### Module Management

- ✅ Hierarchical module structure with parent-child relationships
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Module activation/deactivation
- ✅ Icon assignment for menu items
- ✅ Order index management
- ✅ Drag-and-drop reordering support
- ✅ Permission-based access control

### Submodule Management

- ✅ Submodule creation within modules
- ✅ CRUD operations for submodules
- ✅ Submodule activation/deactivation
- ✅ Order index management
- ✅ Parent module association
- ✅ Permission-based access control

### Menu System

- ✅ Dynamic menu generation from active modules
- ✅ Hierarchical menu structure
- ✅ Icon support for menu items
- ✅ Order-based menu arrangement
- ✅ Permission-based menu visibility

## Database Schema

### Module Table

```sql
model Module {
  id          String    @id @default(cuid())
  name        String
  description String?
  icon        String?   @default("FileText")
  parentId    String?   @map("parent_id")
  isActive    Boolean   @default(true) @map("is_active")
  orderIndex  Int       @default(0) @map("order_index")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  parent            Module?           @relation("ModuleHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children          Module[]          @relation("ModuleHierarchy")
  submodules        Submodule[]
  rolePermissions   RolePermission[]
}
```

### Submodule Table

```sql
model Submodule {
  id          String    @id @default(cuid())
  moduleId    String    @map("module_id")
  name        String
  description String?
  orderIndex  Int       @default(0) @map("order_index")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  module            Module            @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  rolePermissions   RolePermission[]
}
```

## API Endpoints

### Module Endpoints

#### GET /api/modules

- **Description**: Get all modules with hierarchical structure
- **Permissions**: `modules:read`
- **Response**: Array of modules with children and submodules

#### GET /api/modules/menu

- **Description**: Get active modules for menu generation
- **Permissions**: None (public endpoint)
- **Response**: Array of active modules for menu

#### GET /api/modules/:id

- **Description**: Get single module by ID
- **Permissions**: `modules:read`
- **Response**: Single module with children and submodules

#### POST /api/modules

- **Description**: Create new module
- **Permissions**: `modules:create`
- **Body**: `{ name, description, icon, parentId, orderIndex }`

#### PUT /api/modules/:id

- **Description**: Update module
- **Permissions**: `modules:update`
- **Body**: `{ name, description, icon, parentId, orderIndex }`

#### DELETE /api/modules/:id

- **Description**: Delete module
- **Permissions**: `modules:delete`
- **Validation**: Cannot delete modules with children or submodules

#### PATCH /api/modules/:id/toggle

- **Description**: Toggle module active status
- **Permissions**: `modules:update`

#### POST /api/modules/reorder

- **Description**: Reorder modules
- **Permissions**: `modules:update`
- **Body**: `{ modules: [{ id, orderIndex }] }`

### Submodule Endpoints

#### GET /api/submodules

- **Description**: Get all submodules
- **Permissions**: `submodules:read`
- **Response**: Array of submodules with module information

#### GET /api/submodules/module/:moduleId

- **Description**: Get submodules by module ID
- **Permissions**: `submodules:read`
- **Response**: Array of submodules for specific module

#### GET /api/submodules/:id

- **Description**: Get single submodule by ID
- **Permissions**: `submodules:read`
- **Response**: Single submodule with module information

#### POST /api/submodules

- **Description**: Create new submodule
- **Permissions**: `submodules:create`
- **Body**: `{ name, description, moduleId, orderIndex }`

#### PUT /api/submodules/:id

- **Description**: Update submodule
- **Permissions**: `submodules:update`
- **Body**: `{ name, description, moduleId, orderIndex }`

#### DELETE /api/submodules/:id

- **Description**: Delete submodule
- **Permissions**: `submodules:delete`

#### PATCH /api/submodules/:id/toggle

- **Description**: Toggle submodule active status
- **Permissions**: `submodules:update`

#### POST /api/submodules/reorder

- **Description**: Reorder submodules
- **Permissions**: `submodules:update`
- **Body**: `{ submodules: [{ id, orderIndex }] }`

## Frontend Implementation

### Pages

#### `/admin/modules`

- **Component**: `client/src/app/(admin)/modules/page.tsx`
- **Features**:
  - Hierarchical module display
  - Create/Edit/Delete modules
  - Toggle module status
  - Icon selection
  - Parent module selection
  - Order index management
  - Visual hierarchy with indentation

#### `/admin/submodules`

- **Component**: `client/src/app/(admin)/submodules/page.tsx`
- **Features**:
  - List all submodules
  - Create/Edit/Delete submodules
  - Toggle submodule status
  - Parent module selection
  - Order index management
  - Module association display

### Components Used

#### UI Components

- `Button` - Action buttons
- `Card` - Module/submodule containers
- `Modal` - Create/Edit forms
- `Input` - Form inputs
- `Textarea` - Description fields
- `Badge` - Status indicators
- `Label` - Form labels

#### Icons

- `Plus` - Add new items
- `Edit` - Edit items
- `Trash2` - Delete items
- `Eye/EyeOff` - Toggle status
- `GripVertical` - Drag handle
- `Folder/FileText` - Module icons

#### Hooks

- `useApi` - Data fetching
- `useApiMutation` - CRUD operations
- `toast` - Notifications

## Setup and Installation

### 1. Database Setup

```bash
cd server
npx prisma migrate dev --name add_module_hierarchy_fields
npx prisma generate
npx prisma db seed
```

### 2. Start Servers

```bash
# Start backend server
cd server
npm run dev

# Start frontend server
cd client
npm run dev
```

### 3. Test API

```bash
cd server
node test-modules.js
```

## Usage Examples

### Creating a Module Hierarchy

1. **Create Parent Module**

```javascript
const parentModule = await axios.post("/api/modules", {
  name: "User Management",
  description: "Manage users and permissions",
  icon: "Users",
  orderIndex: 1,
});
```

2. **Create Child Module**

```javascript
const childModule = await axios.post("/api/modules", {
  name: "User Profiles",
  description: "Manage user profiles",
  icon: "UserCircle",
  parentId: parentModule.id,
  orderIndex: 1,
});
```

3. **Create Submodule**

```javascript
const submodule = await axios.post("/api/submodules", {
  name: "User List",
  description: "View and manage user list",
  moduleId: parentModule.id,
  orderIndex: 1,
});
```

### Menu Generation

The menu system automatically generates navigation from active modules:

```javascript
const menuModules = await axios.get("/api/modules/menu");
// Returns hierarchical structure for menu rendering
```

## Security and Permissions

### Permission System

- All endpoints require authentication
- Permission-based access control using `permissionGuard`
- Module operations require `modules:*` permissions
- Submodule operations require `submodules:*` permissions

### Data Validation

- Required field validation
- Parent module existence validation
- Circular reference prevention
- Cascade deletion protection

## Error Handling

### Common Error Responses

- `400` - Validation errors (missing required fields)
- `404` - Resource not found
- `500` - Server errors

### Error Messages

- Clear, user-friendly error messages
- Toast notifications for user feedback
- Console logging for debugging

## Future Enhancements

### Planned Features

- [ ] Drag-and-drop reordering UI
- [ ] Bulk operations (activate/deactivate multiple items)
- [ ] Module templates
- [ ] Advanced icon picker
- [ ] Module import/export
- [ ] Menu preview functionality
- [ ] Module analytics and usage tracking

### Technical Improvements

- [ ] Caching for menu generation
- [ ] Real-time menu updates
- [ ] Advanced search and filtering
- [ ] Module versioning
- [ ] Audit logging for module changes

## Troubleshooting

### Common Issues

1. **Module not found errors**

   - Ensure module exists in database
   - Check module ID in requests

2. **Permission denied errors**

   - Verify user has required permissions
   - Check authentication status

3. **Circular reference errors**

   - Cannot set module as its own parent
   - Check parent-child relationships

4. **Deletion errors**
   - Cannot delete modules with children or submodules
   - Remove children/submodules first

### Debug Commands

```bash
# Check database state
npx prisma studio

# Reset database
npx prisma migrate reset

# View logs
npm run dev -- --verbose
```

## Contributing

When contributing to the module management system:

1. Follow existing code patterns
2. Add proper error handling
3. Include permission checks
4. Update documentation
5. Add tests for new features

## License

This module management system is part of the multi-tenant Next.js application and follows the same licensing terms.
