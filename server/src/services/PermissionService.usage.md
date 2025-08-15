# PermissionService Usage Guide

This document provides comprehensive examples and usage patterns for the PermissionService implementation.

## Overview

The PermissionService provides a complete RBAC (Role-Based Access Control) system with granular permissions, multi-tenant support, and superadmin capabilities. It includes caching for performance optimization and comprehensive error handling.

## Basic Usage

### 1. Getting User Permissions

```typescript
import { permissionService } from '../services/PermissionService';

// Get all permissions for a user
const userPermissions = await permissionService.getUserPermissions(userId);

console.log('User ID:', userPermissions.userId);
console.log('Is Superadmin:', userPermissions.isSuperadmin);
console.log('Tenant ID:', userPermissions.tenantId);
console.log('Permissions:', userPermissions.permissions);
```

### 2. Checking Specific Permissions

```typescript
// Check if user can create in a module
const canCreate = await permissionService.hasPermission(
  userId,
  'Users',
  'create'
);

// Check if user can read a specific submodule
const canReadSubmodule = await permissionService.hasPermission(
  userId,
  'Users',
  'read',
  'User List'
);

// Check if user can view all records
const canViewAll = await permissionService.hasPermission(
  userId,
  'Support',
  'view_all'
);
```

### 3. Getting Data Scope

```typescript
// Get the scope of data a user can access
const dataScope = await permissionService.getDataScope(userId, 'Users');

switch (dataScope.scope) {
  case 'all':
    // User can see all data (superadmin)
    break;
  case 'tenant':
    // User can see all data in their tenant
    console.log('Tenant ID:', dataScope.tenantId);
    break;
  case 'own':
    // User can only see their own data
    console.log('User ID:', dataScope.userId);
    break;
}
```

## Advanced Usage

### 1. Permission Validation

```typescript
// Validate multiple permissions at once
const validation = await permissionService.validatePermissions(userId, [
  { moduleKey: 'Users', action: 'create' },
  { moduleKey: 'Users', action: 'read' },
  { moduleKey: 'Support', action: 'update', submoduleKey: 'Tickets' },
]);

if (validation.valid) {
  // All permissions are granted
  console.log('User has all required permissions');
} else {
  // Some permissions are missing
  console.log('Missing permissions:', validation.errors);
}
```

### 2. Superadmin Checks

```typescript
// Check if user is superadmin
const isSuperadmin = await permissionService.isUserSuperadmin(userId);

if (isSuperadmin) {
  // Superadmin bypass - grant all access
  console.log('User is superadmin - full access granted');
} else {
  // Check specific permissions
  const hasPermission = await permissionService.hasPermission(
    userId,
    'Users',
    'create'
  );
}
```

### 3. Getting User Roles

```typescript
// Get all roles assigned to a user with their permissions
const userRoles = await permissionService.getUserRoles(userId);

userRoles.forEach(role => {
  console.log(`Role: ${role.roleName}`);
  console.log(`Is Global: ${role.isGlobal}`);
  console.log(`Tenant ID: ${role.tenantId}`);
  console.log('Permissions:', role.permissions);
});
```

### 4. Accessible Modules

```typescript
// Get modules the user can access
const accessibleModules = await permissionService.getAccessibleModules(userId);

accessibleModules.forEach(module => {
  console.log(`Module: ${module.name}`);
  console.log(`Description: ${module.description}`);
  console.log('Submodules:', module.submodules);
});
```

### 5. Superadmin Tenant Access

```typescript
// Get all tenants a superadmin can access
const accessibleTenants = await permissionService.getAccessibleTenants(userId);

console.log('Accessible tenants:', accessibleTenants);
```

## Integration Examples

### 1. Express Middleware Integration

```typescript
import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../services/PermissionService';

// Middleware to check permissions
export const requirePermission = (
  moduleKey: string,
  action: string,
  submoduleKey?: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await permissionService.hasPermission(
        userId,
        moduleKey,
        action as any,
        submoduleKey
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Usage in routes
app.get('/users', requirePermission('Users', 'read'), async (req, res) => {
  // Handle request
});

app.post('/users', requirePermission('Users', 'create'), async (req, res) => {
  // Handle request
});
```

### 2. Data Filtering Based on Scope

```typescript
import { permissionService } from '../services/PermissionService';

export class UserService {
  async getUsers(userId: string, filters: any = {}) {
    const dataScope = await permissionService.getDataScope(userId, 'Users');

    let whereClause: any = { ...filters };

    switch (dataScope.scope) {
      case 'all':
        // No additional filtering needed for superadmin
        break;
      case 'tenant':
        whereClause.tenantId = dataScope.tenantId;
        break;
      case 'own':
        whereClause.id = dataScope.userId;
        break;
    }

    return await prisma.user.findMany({ where: whereClause });
  }
}
```

### 3. Role-Based UI Rendering

```typescript
// Frontend permission checking
export class PermissionChecker {
  private userPermissions: any = null;

  async initialize(userId: string) {
    this.userPermissions = await permissionService.getUserPermissions(userId);
  }

  can(moduleKey: string, action: string, submoduleKey?: string): boolean {
    if (this.userPermissions.isSuperadmin) {
      return true;
    }

    const permission = this.userPermissions.permissions.find(p => {
      const moduleMatch =
        p.moduleId === moduleKey || p.moduleName === moduleKey;

      if (submoduleKey) {
        return (
          moduleMatch &&
          (p.submoduleId === submoduleKey || p.submoduleName === submoduleKey)
        );
      }

      return moduleMatch && !p.submoduleId;
    });

    if (!permission) return false;

    switch (action) {
      case 'create':
        return permission.canCreate;
      case 'read':
        return permission.canRead;
      case 'update':
        return permission.canUpdate;
      case 'delete':
        return permission.canDelete;
      case 'view_all':
        return permission.canViewAll;
      default:
        return false;
    }
  }

  getDataScope(moduleKey: string) {
    if (this.userPermissions.isSuperadmin) {
      return { scope: 'all' };
    }

    const permission = this.userPermissions.permissions.find(
      p =>
        (p.moduleId === moduleKey || p.moduleName === moduleKey) &&
        !p.submoduleId
    );

    if (!permission) {
      return { scope: 'own', userId: this.userPermissions.userId };
    }

    if (permission.canViewAll) {
      return { scope: 'tenant', tenantId: this.userPermissions.tenantId };
    }

    return { scope: 'own', userId: this.userPermissions.userId };
  }
}
```

## Cache Management

### 1. Manual Cache Control

```typescript
// Clear cache for specific user
permissionService.clearUserCache(userId);

// Clear all cache
permissionService.clearAllCache();

// Get cache statistics
const stats = permissionService.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cache entries:', stats.entries);
```

### 2. Cache Invalidation Strategies

```typescript
// Clear cache when user permissions change
export const updateUserRole = async (userId: string, roleId: string) => {
  await prisma.userRole.create({
    data: { userId, roleId },
  });

  // Clear user's permission cache
  permissionService.clearUserCache(userId);
};

// Clear cache when role permissions change
export const updateRolePermission = async (roleId: string, permission: any) => {
  await prisma.rolePermission.upsert({
    where: {
      /* unique constraint */
    },
    update: permission,
    create: permission,
  });

  // Clear all cache since role changes affect multiple users
  permissionService.clearAllCache();
};
```

## Error Handling

### 1. Graceful Error Handling

```typescript
try {
  const permissions = await permissionService.getUserPermissions(userId);
  // Use permissions
} catch (error) {
  if (error.message.includes('User not found')) {
    // Handle user not found
    console.log('User does not exist');
  } else {
    // Handle other errors
    console.error('Permission service error:', error);
  }
}
```

### 2. Fallback Strategies

```typescript
// Fallback to deny-all if permission service fails
export const safePermissionCheck = async (
  userId: string,
  moduleKey: string,
  action: string
) => {
  try {
    return await permissionService.hasPermission(userId, moduleKey, action);
  } catch (error) {
    console.error('Permission check failed, denying access:', error);
    return false; // Deny access on error
  }
};
```

## Performance Considerations

### 1. Caching Benefits

```typescript
// First call - hits database
const start1 = Date.now();
await permissionService.getUserPermissions(userId);
const time1 = Date.now() - start1;

// Second call - uses cache
const start2 = Date.now();
await permissionService.getUserPermissions(userId);
const time2 = Date.now() - start2;

console.log(`First call: ${time1}ms`);
console.log(`Cached call: ${time2}ms`);
```

### 2. Batch Permission Checks

```typescript
// Instead of multiple individual checks
const permissions = await permissionService.getUserPermissions(userId);

// Check multiple permissions in memory
const canCreateUsers = permissions.permissions.some(
  p =>
    (p.moduleId === 'Users' || p.moduleName === 'Users') &&
    !p.submoduleId &&
    p.canCreate
);

const canReadSupport = permissions.permissions.some(
  p =>
    (p.moduleId === 'Support' || p.moduleName === 'Support') &&
    !p.submoduleId &&
    p.canRead
);
```

## Testing

### 1. Unit Testing

```typescript
import { permissionService } from '../services/PermissionService';

describe('PermissionService', () => {
  it('should return correct permissions for user', async () => {
    const permissions = await permissionService.getUserPermissions(testUserId);

    expect(permissions.userId).toBe(testUserId);
    expect(permissions.permissions).toBeDefined();
  });

  it('should handle superadmin bypass', async () => {
    const hasPermission = await permissionService.hasPermission(
      superadminUserId,
      'AnyModule',
      'create'
    );

    expect(hasPermission).toBe(true);
  });
});
```

### 2. Integration Testing

```typescript
describe('Permission Integration', () => {
  it('should work with real database', async () => {
    // Create test data
    const user = await createTestUser();
    const role = await createTestRole();
    const permission = await createTestPermission(role.id);

    // Test permission service
    const userPermissions = await permissionService.getUserPermissions(user.id);
    expect(userPermissions.permissions).toHaveLength(1);
  });
});
```

## Best Practices

1. **Always check permissions before performing actions**
2. **Use caching effectively** - the service automatically caches for 5 minutes
3. **Clear cache when permissions change** - to ensure consistency
4. **Handle errors gracefully** - permission checks can fail
5. **Use batch operations** - get all permissions once, check multiple times
6. **Validate permissions early** - check permissions before expensive operations
7. **Log permission failures** - for security monitoring
8. **Use TypeScript** - for better type safety and IDE support

## Security Considerations

1. **Never trust client-side permission checks** - always validate on the server
2. **Use HTTPS** - to protect permission data in transit
3. **Log permission failures** - for security auditing
4. **Implement rate limiting** - to prevent permission service abuse
5. **Validate user sessions** - ensure users are authenticated
6. **Use principle of least privilege** - grant minimum required permissions
7. **Regular permission audits** - review and clean up unused permissions
