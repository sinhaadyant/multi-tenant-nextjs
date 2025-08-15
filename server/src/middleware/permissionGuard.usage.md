# Enhanced Permission Guard Middleware Usage Guide

This document provides comprehensive examples and usage patterns for the enhanced permission guard middleware implementation.

## Overview

The enhanced permission guard middleware provides comprehensive permission checking and data scope validation for Express routes. It supports basic permissions, record-level access control, bulk operations, and conditional permission checking.

## Basic Permission Guard

### 1. Simple Permission Checking

```typescript
import {
  permissionGuard,
  requireRead,
  requireCreate,
} from '../middleware/permissionGuard';

// Basic permission check
app.get(
  '/users',
  permissionGuard({ moduleKey: 'Users', action: 'read' }),
  async (req, res) => {
    // Route handler
  }
);

// Using convenience functions
app.get('/users', requireRead('Users'), async (req, res) => {
  // Route handler
});

app.post('/users', requireCreate('Users'), async (req, res) => {
  // Route handler
});
```

### 2. Permission Guard with Options

```typescript
// Permission guard with table name for data scope validation
app.get(
  '/users',
  permissionGuard({
    moduleKey: 'Users',
    action: 'read',
    tableName: 'users',
    requireTenant: true,
    allowSuperadmin: true,
  }),
  async (req, res) => {
    // Data scope is available in req.dataScope
    const dataScope = (req as any).dataScope;
    console.log('User data scope:', dataScope);

    // Route handler
  }
);
```

### 3. Different Permission Actions

```typescript
import {
  requireCreate,
  requireRead,
  requireUpdate,
  requireDelete,
  requireViewAll,
} from '../middleware/permissionGuard';

// CRUD operations
app.post('/users', requireCreate('Users'), async (req, res) => {
  // Create user
});

app.get('/users', requireRead('Users'), async (req, res) => {
  // Read users
});

app.put('/users/:id', requireUpdate('Users'), async (req, res) => {
  // Update user
});

app.delete('/users/:id', requireDelete('Users'), async (req, res) => {
  // Delete user
});

// View all records (for admin users)
app.get('/users/all', requireViewAll('Users'), async (req, res) => {
  // Get all users regardless of scope
});
```

## Record-Level Permission Guard

### 1. Basic Record-Level Guard

```typescript
import {
  recordLevelGuard,
  requireRecordRead,
} from '../middleware/permissionGuard';

// Check access to specific record
app.get(
  '/users/:id',
  recordLevelGuard({
    moduleKey: 'Users',
    action: 'read',
    recordIdParam: 'id',
    tableName: 'users',
  }),
  async (req, res) => {
    // Record is available in req.targetRecord
    const user = (req as any).targetRecord;
    res.json({ user });
  }
);

// Using convenience function
app.get('/users/:id', requireRecordRead('Users'), async (req, res) => {
  const user = (req as any).targetRecord;
  res.json({ user });
});
```

### 2. Record-Level Guard with Custom Model

```typescript
import { prisma } from '@prisma/client';

app.put(
  '/users/:id',
  recordLevelGuard({
    moduleKey: 'Users',
    action: 'update',
    recordIdParam: 'id',
    model: prisma.user,
  }),
  async (req, res) => {
    const user = (req as any).targetRecord;
    const updateData = req.body;

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    res.json({ user: updatedUser });
  }
);
```

### 3. Different Record Parameters

```typescript
// Using different parameter names
app.get(
  '/support/tickets/:ticketId',
  recordLevelGuard({
    moduleKey: 'Support',
    action: 'read',
    recordIdParam: 'ticketId',
    tableName: 'support_tickets',
  }),
  async (req, res) => {
    const ticket = (req as any).targetRecord;
    res.json({ ticket });
  }
);
```

## Bulk Permission Guard

### 1. Basic Bulk Operations

```typescript
import {
  bulkPermissionGuard,
  requireBulkUpdate,
} from '../middleware/permissionGuard';

// Bulk update users
app.put(
  '/users/bulk',
  bulkPermissionGuard({
    moduleKey: 'Users',
    action: 'update',
    recordIdsParam: 'userIds',
    tableName: 'users',
  }),
  async (req, res) => {
    // Valid records are available in req.targetRecords
    const validUsers = (req as any).targetRecords;
    const updateData = req.body.updateData;

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: { id: { in: validUsers.map(u => u.id) } },
      data: updateData,
    });

    res.json({
      message: `Updated ${result.count} users`,
      updatedCount: result.count,
    });
  }
);

// Using convenience function
app.delete('/users/bulk', requireBulkDelete('Users'), async (req, res) => {
  const validUsers = (req as any).targetRecords;
  // Perform bulk delete
});
```

### 2. Bulk Operations with Custom Model

```typescript
app.put(
  '/support/tickets/bulk',
  bulkPermissionGuard({
    moduleKey: 'Support',
    action: 'update',
    recordIdsParam: 'ticketIds',
    model: prisma.supportTicket,
  }),
  async (req, res) => {
    const validTickets = (req as any).targetRecords;
    const updateData = req.body.updateData;

    // Perform bulk update
    const result = await prisma.supportTicket.updateMany({
      where: { id: { in: validTickets.map(t => t.id) } },
      data: updateData,
    });

    res.json({
      message: `Updated ${result.count} tickets`,
      updatedCount: result.count,
    });
  }
);
```

## Silent Permission Checking

### 1. Conditional UI Logic

```typescript
import {
  checkPermissionSilently,
  checkDataScopeSilently,
} from '../middleware/permissionGuard';

// Check permissions without throwing errors
app.get('/users/permissions', async (req, res) => {
  const user = req.user as AuthenticatedUser;

  const canCreate = await checkPermissionSilently(user.id, 'Users', 'create');
  const canUpdate = await checkPermissionSilently(user.id, 'Users', 'update');
  const canDelete = await checkPermissionSilently(user.id, 'Users', 'delete');

  const dataScope = await checkDataScopeSilently(user.id, 'Users');

  res.json({
    permissions: {
      canCreate,
      canUpdate,
      canDelete,
    },
    dataScope: dataScope.scope,
    hasAccess: dataScope.hasAccess,
  });
});
```

### 2. Conditional Route Logic

```typescript
app.get('/users/:id', async (req, res) => {
  const user = req.user as AuthenticatedUser;
  const { id } = req.params;

  // Check if user can access this specific record
  const canAccess = await validateRecordOwnership(
    user.id,
    { id },
    'Users',
    'users'
  );

  if (!canAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Proceed with the request
  const targetUser = await prisma.user.findUnique({ where: { id } });
  res.json({ user: targetUser });
});
```

## Advanced Usage Patterns

### 1. Multiple Permission Checks

```typescript
// Check multiple permissions in sequence
app.post(
  '/users/:id/roles',
  requireRead('Users'),
  requireCreate('Roles'),
  async (req, res) => {
    // User has both read permission on Users and create permission on Roles
    const { id } = req.params;
    const roleData = req.body;

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId: id,
        roleId: roleData.roleId,
      },
    });

    res.json({ userRole });
  }
);
```

### 2. Conditional Permissions Based on Record Ownership

```typescript
app.put('/users/:id', requireRecordUpdate('Users'), async (req, res) => {
  const user = req.user as AuthenticatedUser;
  const targetUser = (req as any).targetRecord;
  const updateData = req.body;

  // Check if user is updating their own profile
  const isOwnProfile = user.id === targetUser.id;

  // Apply different validation rules for own profile vs others
  if (isOwnProfile) {
    // Allow updating own profile with fewer restrictions
    delete updateData.roleId; // Prevent role escalation
    delete updateData.isActive; // Prevent self-deactivation
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUser.id },
    data: updateData,
  });

  res.json({ user: updatedUser });
});
```

### 3. Debugging Permission Issues

```typescript
import { getPermissionDetails } from '../middleware/permissionGuard';

app.get('/debug/permissions/:moduleKey', async (req, res) => {
  const user = req.user as AuthenticatedUser;
  const { moduleKey } = req.params;

  try {
    const details = await getPermissionDetails(user.id, moduleKey);

    res.json({
      userId: user.id,
      moduleKey,
      permissions: details.permissions,
      dataScope: details.dataScope,
      accessibleModules: details.accessibleModules,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get permission details' });
  }
});
```

## Error Handling

### 1. Custom Error Responses

```typescript
// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Access Denied',
      message: error.message,
      code: 'PERMISSION_DENIED',
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Not Found',
      message: error.message,
      code: 'RECORD_NOT_FOUND',
    });
  }

  next(error);
});
```

### 2. Detailed Error Information

```typescript
// Bulk operation with detailed error information
app.put('/users/bulk', requireBulkUpdate('Users'), async (req, res) => {
  try {
    // Handle bulk update
  } catch (error) {
    if (error instanceof AuthorizationError && error.details) {
      return res.status(403).json({
        error: 'Bulk Update Failed',
        message: error.message,
        invalidRecordIds: error.details.invalidRecordIds,
        validRecordIds: error.details.validRecordIds,
      });
    }
    throw error;
  }
});
```

## Integration Examples

### 1. Express Route Integration

```typescript
import express from 'express';
import {
  requireRead,
  requireRecordUpdate,
  requireBulkDelete,
} from '../middleware/permissionGuard';

const router = express.Router();

// User routes with permission guards
router.get('/', requireRead('Users'), async (req, res) => {
  // Get users list
});

router.get('/:id', requireRecordRead('Users'), async (req, res) => {
  const user = (req as any).targetRecord;
  res.json({ user });
});

router.put('/:id', requireRecordUpdate('Users'), async (req, res) => {
  const user = (req as any).targetRecord;
  const updateData = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  res.json({ user: updatedUser });
});

router.delete('/bulk', requireBulkDelete('Users'), async (req, res) => {
  const validUsers = (req as any).targetRecords;

  const result = await prisma.user.updateMany({
    where: { id: { in: validUsers.map(u => u.id) } },
    data: { isActive: false },
  });

  res.json({ message: `Deleted ${result.count} users` });
});

export default router;
```

### 2. Service Layer Integration

```typescript
export class UserService {
  async getUsers(userId: string, filters: any = {}) {
    // Check permission silently
    const canRead = await checkPermissionSilently(userId, 'Users', 'read');
    if (!canRead) {
      throw new AuthorizationError('Read permission required');
    }

    // Apply data scope filtering
    const query = { where: { ...filters } };
    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      'Users',
      'users'
    );

    return await prisma.user.findMany(scopedQuery);
  }

  async updateUser(userId: string, targetUserId: string, data: any) {
    // Check permission silently
    const canUpdate = await checkPermissionSilently(userId, 'Users', 'update');
    if (!canUpdate) {
      throw new AuthorizationError('Update permission required');
    }

    // Validate record access
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    const canAccess = await validateRecordOwnership(
      userId,
      targetUser,
      'Users',
      'users'
    );
    if (!canAccess) {
      throw new AuthorizationError('Access denied to this user');
    }

    return await prisma.user.update({
      where: { id: targetUserId },
      data,
    });
  }
}
```

## Best Practices

### 1. Permission Guard Order

```typescript
// Always check authentication first, then permissions
app.use('/api', authMiddleware); // Apply to all routes

app.get('/users', requireRead('Users'), async (req, res) => {
  // Route handler
});
```

### 2. Error Handling

```typescript
// Use try-catch blocks in route handlers
app.put('/users/:id', requireRecordUpdate('Users'), async (req, res) => {
  try {
    const user = (req as any).targetRecord;
    const updateData = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    res.json({ user: updatedUser });
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Failed to update user' });
  }
});
```

### 3. Logging and Monitoring

```typescript
// Log permission checks for monitoring
app.use((req, res, next) => {
  const user = req.user as AuthenticatedUser;
  if (user) {
    logger.info(`User ${user.id} accessing ${req.method} ${req.path}`);
  }
  next();
});
```

## Security Considerations

1. **Always validate permissions** before performing operations
2. **Use record-level guards** for sensitive operations
3. **Validate data scope** to ensure proper data isolation
4. **Log permission failures** for security monitoring
5. **Use silent checks** for conditional logic, not security
6. **Handle errors gracefully** with appropriate status codes
7. **Regular security audits** of permission usage
8. **Monitor permission patterns** for suspicious activity

The enhanced permission guard middleware provides comprehensive security and access control for your application while maintaining flexibility and ease of use.
