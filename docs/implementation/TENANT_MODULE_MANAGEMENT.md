# Tenant Module Management System

A comprehensive module management system for multi-tenant applications with fine-grained permission controls and analytics tracking.

## Overview

The Tenant Module Management system allows tenant administrators to control which application features/modules are enabled or disabled for their organization. The system is built with security-first principles, ensuring that only authorized users can manage modules based on their roles and permissions.

## Key Features

- **Permission-Based Access Control**: Strict permission enforcement for all module management actions
- **Tenant-Specific Module Settings**: Each tenant can have different module configurations
- **Version Management**: Support for module versioning and compatibility checks
- **Usage Analytics**: Track module usage and access patterns
- **Audit Logging**: Complete audit trail for all module management actions
- **Bulk Operations**: Enable/disable multiple modules at once
- **Real-time Updates**: Immediate reflection of module changes across the application

## Permission System

### Permission Types

1. **View Modules Permission** (`modules.view`)
   - Allows users to see the list of available modules and their current enablement status
   - Usually granted to all tenant users with read access to settings

2. **Enable/Disable Module Permission** (`modules.enable_disable`)
   - Allows toggling modules ON or OFF for the tenant
   - Typically restricted to tenant administrators or roles with configuration privileges

3. **Manage Module Versions Permission** (`modules.manage_versions`)
   - Allows users to update, rollback, or configure module versions
   - Given to senior tenant admins or technical users

4. **View Module Usage Analytics Permission** (`modules.view_analytics`)
   - Allows viewing usage reports and analytics related to modules
   - Assigned to tenant managers or analysts

### Permission Enforcement

- **API Layer**: Middleware validates user permissions before processing any module management request
- **Frontend Layer**: UI controls are hidden/disabled based on user permissions
- **Audit Logging**: All permission-guarded actions are logged with user information

## Database Schema

### Core Models

#### Module
```sql
model Module {
  id              String           @id @default(cuid())
  moduleKey       String           @unique
  moduleName      String
  path            String?
  icon            String?
  description     String?
  version         String?
  minVersion      String?
  maxVersion      String?
  releaseNotes    String?
  isActive        Boolean          @default(true)
  isVisible       Boolean          @default(true)
  orderIndex      Int              @default(0)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  permissions     Permission[]
  tenantModules   TenantModule[]
}
```

#### TenantModule
```sql
model TenantModule {
  id              String           @id @default(cuid())
  tenantId        String
  moduleKey       String
  isEnabled       Boolean          @default(true)
  isVisible       Boolean          @default(true)
  version         String?
  settings        String?          @db.LongText
  enabledAt       DateTime?
  disabledAt      DateTime?
  enabledBy       String?
  disabledBy      String?
  lastAccessedAt  DateTime?
  accessCount     Int              @default(0)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  module          Module           @relation(fields: [moduleKey], references: [moduleKey])
  
  @@unique([tenantId, moduleKey])
}
```

## API Endpoints

### GET `/api/tenant/[tenantSlug]/modules`
Retrieve modules with tenant-specific settings and permission checks.

**Query Parameters:**
- `includeAnalytics` (boolean): Include usage analytics data

**Response:**
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "module_id",
        "moduleKey": "dashboard",
        "moduleName": "Dashboard",
        "description": "Main dashboard with overview and key metrics",
        "version": "1.0.0",
        "isEnabled": true,
        "isVisibleInTenant": true,
        "tenantVersion": "1.0.0",
        "analytics": {
          "lastAccessedAt": "2024-01-15T10:30:00Z",
          "accessCount": 150
        }
      }
    ],
    "permissions": {
      "canViewModules": true,
      "canEnableDisableModules": true,
      "canManageVersions": false,
      "canViewAnalytics": true
    }
  }
}
```

### POST `/api/tenant/[tenantSlug]/modules`
Perform module management actions.

**Request Body:**
```json
{
  "action": "enable|disable|update_settings|update_version",
  "moduleKey": "dashboard",
  "settings": {}, // Optional for update_settings
  "version": "1.2.0" // Optional for update_version
}
```

## React Hooks

### useModuleManagement

A comprehensive hook for managing tenant modules with built-in permission checks.

```typescript
import { useModuleManagement } from '@/hooks/useModuleManagement';

const ModuleManagementPage = () => {
  const {
    modules,
    permissions,
    loading,
    error,
    filteredModules,
    toggleModule,
    updateModuleSettings,
    updateModuleVersion,
    bulkEnableModules,
    bulkDisableModules
  } = useModuleManagement(tenantSlug);

  // Use the hook methods...
};
```

## Middleware

### Module Access Middleware

Automatically check module access and permissions for routes.

```typescript
import { createModuleAccessMiddleware, MODULE_ACCESS_CONFIGS } from '@/middleware/moduleAccess';

// In your page or API route
export const middleware = createModuleAccessMiddleware(MODULE_ACCESS_CONFIGS.USERS);
```

## Components

### ModuleCard
Displays individual module information with action buttons based on permissions.

### ModuleAnalytics
Shows usage statistics and performance metrics for modules.

## Usage Examples

### Basic Module Management

```typescript
// Enable a module
await enableModule('dashboard');

// Disable a module
await disableModule('reports');

// Update module settings
await updateModuleSettings('dashboard', {
  theme: 'dark',
  widgets: ['metrics', 'charts']
});

// Update module version
await updateModuleVersion('dashboard', '1.2.0');
```

### Permission Checks

```typescript
// Check if user can view modules
if (!permissions.canViewModules) {
  return <AccessDenied />;
}

// Check if user can enable/disable modules
if (permissions.canEnableDisableModules) {
  return <EnableDisableButtons />;
}
```

### Bulk Operations

```typescript
// Enable multiple modules
const results = await bulkEnableModules(['dashboard', 'users', 'reports']);

// Disable multiple modules
const results = await bulkDisableModules(['analytics', 'notifications']);
```

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the new tables:

```bash
npx prisma migrate dev --name add-tenant-module-management
```

### 2. Seed Permissions

Run the permission seeding script:

```bash
npx tsx scripts/seed-module-permissions.ts
```

### 3. Update Navigation

Add the module management link to your tenant navigation:

```typescript
{
  name: 'Module Management',
  href: `/${tenantSlug}/modules`,
  icon: Package,
  permission: 'modules.view'
}
```

### 4. Configure Middleware

Add module access middleware to protected routes:

```typescript
// In your page files
export const middleware = createModuleAccessMiddleware(MODULE_ACCESS_CONFIGS.MODULES);
```

## Security Considerations

### Permission Enforcement
- All module management actions require appropriate permissions
- API endpoints validate permissions before processing requests
- UI components hide/disable controls based on user permissions

### Audit Logging
- All module enable/disable actions are logged with user information
- Version updates are tracked with before/after values
- Access patterns are recorded for analytics

### Data Validation
- Version compatibility is checked before allowing updates
- Module settings are validated against schemas
- Tenant isolation ensures users can only manage their own modules

## Best Practices

### Role Configuration
1. Create dedicated permission sets for module management
2. Include module management permissions in default admin roles
3. Allow custom roles to selectively grant module management capabilities
4. Regularly audit roles to prevent privilege creep

### Module Management
1. Test modules in a staging environment before enabling in production
2. Use version management for controlled rollouts
3. Monitor module usage analytics to identify underutilized features
4. Document module dependencies and requirements

### User Experience
1. Provide clear feedback when modules are enabled/disabled
2. Show permission requirements in tooltips
3. Use bulk operations for efficiency
4. Include analytics to help users understand module usage

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required permissions
   - Verify role assignments are active
   - Ensure tenant context is correct

2. **Module Not Found**
   - Verify module exists in the database
   - Check if module is active
   - Confirm module key spelling

3. **Version Compatibility Issues**
   - Check minimum and maximum version constraints
   - Verify version format (semantic versioning)
   - Review release notes for breaking changes

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=module-management:*
```

## API Reference

### Error Codes

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Module or tenant not found
- `400 Bad Request`: Invalid action or parameters
- `500 Internal Server Error`: Server error

### Rate Limiting

Module management endpoints are rate-limited to prevent abuse:
- 100 requests per minute per user
- 1000 requests per hour per tenant

## Contributing

When adding new modules to the system:

1. Add the module to the database schema
2. Create appropriate permissions
3. Update the module access configurations
4. Add analytics tracking
5. Update documentation

## License

This module management system is part of the multi-tenant Next.js application and follows the same licensing terms. 