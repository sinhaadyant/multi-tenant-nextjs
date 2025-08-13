# Validation Schemas and Middleware

This directory contains comprehensive Zod validation schemas for all API endpoints in the multi-tenant platform.

## Overview

The validation system provides:

- **Type-safe validation** using Zod schemas
- **Comprehensive coverage** for all API endpoints
- **Reusable middleware** for request validation
- **Consistent error handling** across the application

## File Structure

```
validation-schemas/
├── index.ts              # Main export file
├── authSchemas.ts        # Authentication & authorization schemas
├── userSchemas.ts        # User management schemas
├── tenantSchemas.ts      # Tenant management schemas
├── roleSchemas.ts        # Role & permission schemas
├── moduleSchemas.ts      # Module & menu schemas
├── supportSchemas.ts     # Support ticket schemas
└── README.md            # This documentation
```

## Usage Examples

### 1. Basic Route Validation

```typescript
import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '@/middleware/validation';
import {
  createUserSchema,
  userIdParamSchema,
  userListQuerySchema,
} from '@/validation-schemas';

const router = Router();

// Validate request body
router.post(
  '/users',
  validateBody(createUserSchema),
  userController.createUser
);

// Validate path parameters
router.get(
  '/users/:id',
  validateParams(userIdParamSchema),
  userController.getUser
);

// Validate query parameters
router.get(
  '/users',
  validateQuery(userListQuerySchema),
  userController.listUsers
);
```

### 2. Multiple Validation Targets

```typescript
import { validateMultiple } from '@/middleware/validation';
import { updateUserSchema, userIdParamSchema } from '@/validation-schemas';

router.put(
  '/users/:id',
  validateMultiple([
    { target: 'params', schema: userIdParamSchema },
    { target: 'body', schema: updateUserSchema },
  ]),
  userController.updateUser
);
```

### 3. Authentication Routes

```typescript
import { validateBody } from '@/middleware/validation';
import {
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from '@/validation-schemas';

// Login endpoint
router.post('/auth/login', validateBody(loginSchema), authController.login);

// Refresh token endpoint
router.post(
  '/auth/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Reset password endpoint
router.post(
  '/auth/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);
```

### 4. Tenant Management

```typescript
import { validateBody, validateParams } from '@/middleware/validation';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantIdParamSchema,
} from '@/validation-schemas';

// Create tenant
router.post(
  '/tenants',
  validateBody(createTenantSchema),
  tenantController.createTenant
);

// Update tenant
router.put(
  '/tenants/:id',
  validateParams(tenantIdParamSchema),
  validateBody(updateTenantSchema),
  tenantController.updateTenant
);
```

### 5. Role and Permission Management

```typescript
import { validateBody, validateParams } from '@/middleware/validation';
import {
  createRoleSchema,
  updateRolePermissionsSchema,
  roleIdParamSchema,
} from '@/validation-schemas';

// Create role
router.post(
  '/roles',
  validateBody(createRoleSchema),
  roleController.createRole
);

// Update role permissions
router.put(
  '/roles/:id/permissions',
  validateParams(roleIdParamSchema),
  validateBody(updateRolePermissionsSchema),
  roleController.updateRolePermissions
);
```

### 6. Module Management

```typescript
import { validateBody, validateParams } from '@/middleware/validation';
import {
  createModuleSchema,
  reorderModulesSchema,
  moduleIdParamSchema,
} from '@/validation-schemas';

// Create module
router.post(
  '/modules',
  validateBody(createModuleSchema),
  moduleController.createModule
);

// Reorder modules
router.post(
  '/modules/reorder',
  validateBody(reorderModulesSchema),
  moduleController.reorderModules
);
```

### 7. Support System

```typescript
import { validateBody, validateParams } from '@/middleware/validation';
import {
  createTicketSchema,
  createReplySchema,
  ticketIdParamSchema,
} from '@/validation-schemas';

// Create support ticket
router.post(
  '/support/tickets',
  validateBody(createTicketSchema),
  supportController.createTicket
);

// Add reply to ticket
router.post(
  '/support/tickets/:id/replies',
  validateParams(ticketIdParamSchema),
  validateBody(createReplySchema),
  supportController.createReply
);
```

## Schema Categories

### Authentication Schemas (`authSchemas.ts`)

- **Login/Logout**: `loginSchema`, `logoutSchema`
- **Token Management**: `refreshTokenSchema`, `revokeDeviceSchema`
- **Password Management**: `requestPasswordResetSchema`, `resetPasswordSchema`, `changePasswordSchema`
- **Email Verification**: `verifyEmailSchema`, `resendVerificationSchema`
- **Two-Factor Auth**: `enable2FASchema`, `verify2FASchema`, `disable2FASchema`
- **Session Management**: `getSessionsSchema`, `revokeSessionSchema`
- **Device Management**: `getDevicesSchema`, `updateDeviceSchema`

### User Management Schemas (`userSchemas.ts`)

- **User CRUD**: `createUserSchema`, `updateUserSchema`, `updateProfileSchema`
- **User Listing**: `userListQuerySchema`, `userSearchSchema`
- **Bulk Operations**: `bulkUserOperationSchema`
- **Import/Export**: `userImportSchema`, `userExportSchema`
- **Statistics**: `userStatsQuerySchema`, `userActivityQuerySchema`
- **Permissions**: `userPermissionsQuerySchema`, `userRolesQuerySchema`
- **Preferences**: `userPreferencesSchema`

### Tenant Management Schemas (`tenantSchemas.ts`)

- **Tenant CRUD**: `createTenantSchema`, `updateTenantSchema`
- **Tenant Listing**: `tenantListQuerySchema`
- **Settings Management**: `updateTenantSettingsSchema`
- **Subscription Management**: `updateTenantSubscriptionSchema`
- **Login Restrictions**: `updateTenantLoginRestrictionsSchema`
- **Statistics**: `tenantStatsQuerySchema`
- **Import/Export**: `tenantImportSchema`, `tenantExportSchema`
- **Backup/Restore**: `tenantBackupSchema`, `tenantRestoreSchema`

### Role Management Schemas (`roleSchemas.ts`)

- **Role CRUD**: `createRoleSchema`, `updateRoleSchema`
- **Role Listing**: `roleListQuerySchema`
- **Permission Management**: `updateRolePermissionsSchema`
- **User Assignment**: `assignUsersToRoleSchema`, `removeUsersFromRoleSchema`
- **Permission Queries**: `rolePermissionsQuerySchema`, `userEffectivePermissionsSchema`
- **Statistics**: `roleStatsQuerySchema`
- **Import/Export**: `roleImportSchema`, `roleExportSchema`
- **Advanced Features**: `permissionMatrixSchema`, `roleHierarchySchema`, `roleTemplateSchema`

### Module Management Schemas (`moduleSchemas.ts`)

- **Module CRUD**: `createModuleSchema`, `updateModuleSchema`
- **Submodule CRUD**: `createSubmoduleSchema`, `updateSubmoduleSchema`
- **Module Listing**: `moduleListQuerySchema`
- **Ordering**: `reorderModulesSchema`, `reorderSubmodulesSchema`
- **Menu Management**: `menuTreeQuerySchema`
- **Permission Management**: `modulePermissionsSchema`, `submodulePermissionsSchema`
- **Statistics**: `moduleStatsQuerySchema`
- **Import/Export**: `moduleImportSchema`, `moduleExportSchema`
- **Advanced Features**: `moduleCacheSchema`, `moduleDependencySchema`, `moduleHealthCheckSchema`

### Support System Schemas (`supportSchemas.ts`)

- **Ticket CRUD**: `createTicketSchema`, `updateTicketSchema`
- **Ticket Listing**: `ticketListQuerySchema`
- **Reply Management**: `createReplySchema`, `updateReplySchema`
- **Attachment Management**: `uploadAttachmentSchema`
- **Bulk Operations**: `ticketBulkOperationSchema`
- **Templates**: `ticketTemplateSchema`
- **Categories**: `ticketCategorySchema`
- **SLA Management**: `ticketSLASchema`
- **Notifications**: `ticketNotificationSchema`
- **Escalations**: `ticketEscalationSchema`
- **Statistics**: `ticketStatsQuerySchema`
- **Import/Export**: `ticketExportSchema`

## Validation Middleware Functions

### Core Functions

- `validateRequest(options)` - Generic validation middleware
- `validateBody(schema, options)` - Validate request body
- `validateQuery(schema, options)` - Validate query parameters
- `validateParams(schema, options)` - Validate path parameters
- `validateMultiple(validations)` - Validate multiple targets at once

### Utility Functions

- `validatePagination()` - Validate pagination parameters
- `validateSearch()` - Validate search parameters
- `validateId()` - Validate ID parameter
- `validateUUID()` - Validate UUID parameter
- `validateEmail()` - Validate email parameter
- `validateFileUpload(options)` - Validate file uploads
- `validateHeaders(schema)` - Validate request headers
- `sanitizeAndValidate(schema, sanitizers)` - Sanitize and validate input

### Advanced Functions

- `createCustomValidator(schema, transform)` - Create custom validation with transformation
- `conditionalValidation(condition, validation)` - Conditional validation
- `validateRequest(options)` - Full validation with options

## Error Handling

The validation middleware automatically handles validation errors and returns consistent error responses:

```typescript
// Example error response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "too_small"
    }
  ]
}
```

## Type Safety

All schemas include TypeScript type exports for full type safety:

```typescript
import type {
  CreateUserRequest,
  UpdateUserRequest,
} from '@/validation-schemas';

// Type-safe controller
export const createUser = async (
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
) => {
  // req.body is fully typed based on the schema
  const { email, firstName, lastName } = req.body;
  // ...
};
```

## Best Practices

1. **Always validate input** - Use validation middleware for all endpoints
2. **Import from index** - Use `@/validation-schemas` for clean imports
3. **Use appropriate schemas** - Choose the right schema for each endpoint
4. **Handle errors gracefully** - The middleware handles validation errors automatically
5. **Type your controllers** - Use the exported types for full type safety
6. **Test validation** - Include validation tests in your test suite

## Integration with Existing Code

The validation system integrates seamlessly with the existing middleware stack:

```typescript
router.post(
  '/users',
  authMiddleware, // Authentication
  requireTenant, // Tenant resolution
  requireCreate('users'), // Permission check
  validateBody(createUserSchema), // Input validation
  asyncHandler(userController.createUser) // Request handler
);
```

This ensures that requests are properly authenticated, authorized, and validated before reaching the controller logic.
