# DataScopeService Usage Guide

This document provides comprehensive examples and usage patterns for the DataScopeService implementation.

## Overview

The DataScopeService provides utilities to apply data scope filters to database queries, ensuring proper data isolation based on user permissions. It supports Prisma queries, raw SQL, and complex joins with comprehensive table configurations.

## Basic Usage

### 1. Applying Data Scope to Prisma Queries

```typescript
import { dataScopeService } from './DataScopeService';
import { prisma } from '@prisma/client';

// Get users with data scope applied
const getUsers = async (userId: string, filters: any = {}) => {
  const query = {
    where: { ...filters },
    include: { roles: true },
  };

  const scopedQuery = await dataScopeService.applyDataScopeFilter(
    query,
    userId,
    'Users',
    'users'
  );

  return await prisma.user.findMany(scopedQuery);
};

// Get support tickets with data scope
const getSupportTickets = async (userId: string, status?: string) => {
  const query = {
    where: { status: status || 'open' },
    include: { user: true, replies: true },
  };

  const scopedQuery = await dataScopeService.applyDataScopeFilter(
    query,
    userId,
    'Support',
    'support_tickets'
  );

  return await prisma.supportTicket.findMany(scopedQuery);
};
```

### 2. Getting Scope Where Clauses

```typescript
// Get where clause for a specific scope
const getWhereClause = async (
  userId: string,
  moduleKey: string,
  tableName: string
) => {
  const dataScope = await permissionService.getDataScope(userId, moduleKey);
  return dataScopeService.getScopeWhereClause(dataScope, tableName);
};

// Example usage
const whereClause = await getWhereClause('user123', 'Users', 'users');
console.log(whereClause);
// Output: { tenantId: 'tenant456' } or { userId: 'user123', tenantId: 'tenant456' }
```

### 3. Raw SQL Query Filtering

```typescript
// Apply data scope to raw SQL
const getUsersSQL = async (userId: string) => {
  const baseSQL = 'SELECT * FROM users WHERE is_active = ?';
  const params = [true];

  const dataScope = await permissionService.getDataScope(userId, 'Users');
  const { sql, params: scopedParams } = dataScopeService.applyDataScopeToSQL(
    baseSQL,
    dataScope,
    'users',
    params
  );

  return await prisma.$queryRawUnsafe(sql, ...scopedParams);
};
```

## Advanced Usage

### 1. Data Access Validation

```typescript
// Validate if user can access a specific record
const validateUserAccess = async (userId: string, recordId: string) => {
  const record = await prisma.user.findUnique({ where: { id: recordId } });

  if (!record) {
    throw new Error('Record not found');
  }

  const canAccess = await dataScopeService.validateDataAccess(
    userId,
    record,
    'Users',
    'users'
  );

  if (!canAccess) {
    throw new Error('Access denied');
  }

  return record;
};

// Bulk validation
const validateBulkAccess = async (userId: string, recordIds: string[]) => {
  const records = await prisma.user.findMany({
    where: { id: { in: recordIds } },
  });

  const { valid, validRecords, invalidRecords } =
    await dataScopeService.validateBulkDataAccess(
      userId,
      records,
      'Users',
      'users'
    );

  return { valid, validRecords, invalidRecords };
};
```

### 2. Filtered Record Retrieval

```typescript
// Get filtered records with data scope
const getFilteredUsers = async (userId: string, filters: any = {}) => {
  return await dataScopeService.getFilteredRecords(
    prisma.user,
    userId,
    'Users',
    'users',
    filters
  );
};

// Count filtered records
const countFilteredUsers = async (userId: string, filters: any = {}) => {
  return await dataScopeService.countFilteredRecords(
    prisma.user,
    userId,
    'Users',
    'users',
    filters
  );
};
```

### 3. Complex Query Filtering

```typescript
// Apply data scope to complex queries with joins
const getUsersWithRoles = async (userId: string) => {
  const query = {
    where: { isActive: true },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: true,
            },
          },
        },
      },
    },
  };

  const scopedQuery = await dataScopeService.applyDataScopeToComplexQuery(
    query,
    userId,
    'Users',
    'users',
    ['user_roles', 'roles', 'role_permissions']
  );

  return await prisma.user.findMany(scopedQuery);
};
```

## Integration Examples

### 1. Express Route Integration

```typescript
import { Request, Response } from 'express';
import { dataScopeService } from '../services/DataScopeService';
import { prisma } from '@prisma/client';

// Route handler with data scope filtering
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status, limit = 10, offset = 0 } = req.query;

    const query = {
      where: {
        isActive: true,
        ...(status && { status: status as string }),
      },
      take: Number(limit),
      skip: Number(offset),
      include: { roles: true },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      'Users',
      'users'
    );

    const users = await prisma.user.findMany(scopedQuery);
    const total = await prisma.user.count({ where: scopedQuery.where });

    res.json({
      users,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
```

### 2. Service Layer Integration

```typescript
export class UserService {
  async getUsers(userId: string, filters: any = {}) {
    const query = {
      where: { ...filters },
      include: { roles: true },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      'Users',
      'users'
    );

    return await prisma.user.findMany(scopedQuery);
  }

  async getUserById(userId: string, targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roles: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const canAccess = await dataScopeService.validateDataAccess(
      userId,
      user,
      'Users',
      'users'
    );

    if (!canAccess) {
      throw new Error('Access denied');
    }

    return user;
  }

  async updateUser(userId: string, targetUserId: string, data: any) {
    // First validate access
    await this.getUserById(userId, targetUserId);

    // Then update
    return await prisma.user.update({
      where: { id: targetUserId },
      data,
    });
  }
}
```

### 3. Repository Pattern Integration

```typescript
export class UserRepository {
  async findAll(userId: string, options: any = {}) {
    const query = {
      where: { ...options.filters },
      include: options.include || { roles: true },
      orderBy: options.orderBy || { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      'Users',
      'users'
    );

    return await prisma.user.findMany(scopedQuery);
  }

  async findById(userId: string, targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roles: true },
    });

    if (!user) {
      return null;
    }

    const canAccess = await dataScopeService.validateDataAccess(
      userId,
      user,
      'Users',
      'users'
    );

    return canAccess ? user : null;
  }

  async count(userId: string, filters: any = {}) {
    return await dataScopeService.countFilteredRecords(
      prisma.user,
      userId,
      'Users',
      'users',
      filters
    );
  }
}
```

## Table Configuration

### 1. Default Table Configurations

The service comes with pre-configured table mappings:

```typescript
const TABLE_CONFIGS = {
  users: {
    hasUserId: true,
    hasTenantId: true,
    userIdField: 'id',
    tenantIdField: 'tenantId',
  },
  roles: {
    hasUserId: false,
    hasTenantId: true,
    tenantIdField: 'tenantId',
  },
  support_tickets: {
    hasUserId: true,
    hasTenantId: true,
    userIdField: 'userId',
    tenantIdField: 'tenantId',
  },
  // ... more configurations
};
```

### 2. Registering Custom Table Configurations

```typescript
// Register a custom table configuration
dataScopeService.registerTableConfig('custom_table', {
  hasUserId: true,
  hasTenantId: true,
  userIdField: 'created_by',
  tenantIdField: 'organization_id',
});

// Get table configuration
const config = dataScopeService.getTableConfig('users');
console.log(config);

// Get all configurations
const allConfigs = dataScopeService.getAllTableConfigs();
```

## Error Handling

### 1. Graceful Error Handling

```typescript
const safeDataScopeFilter = async (
  query: any,
  userId: string,
  moduleKey: string
) => {
  try {
    return await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      moduleKey,
      'users'
    );
  } catch (error) {
    console.error('Data scope filter failed:', error);
    // Apply most restrictive filter on error
    return {
      ...query,
      where: { ...query.where, userId, tenantId: 'restricted' },
    };
  }
};
```

### 2. Fallback Strategies

```typescript
const getUsersWithFallback = async (userId: string) => {
  try {
    const query = { where: { isActive: true } };
    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      userId,
      'Users',
      'users'
    );
    return await prisma.user.findMany(scopedQuery);
  } catch (error) {
    // Fallback to user's own data only
    return await prisma.user.findMany({
      where: { id: userId, isActive: true },
    });
  }
};
```

## Performance Considerations

### 1. Query Optimization

```typescript
// Use indexes effectively
const getUsersOptimized = async (userId: string) => {
  const query = {
    where: { isActive: true },
    select: { id: true, name: true, email: true }, // Only select needed fields
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit results
  };

  const scopedQuery = await dataScopeService.applyDataScopeFilter(
    query,
    userId,
    'Users',
    'users'
  );

  return await prisma.user.findMany(scopedQuery);
};
```

### 2. Batch Operations

```typescript
// Validate multiple records efficiently
const validateMultipleUsers = async (userId: string, userIds: string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  const { validRecords } = await dataScopeService.validateBulkDataAccess(
    userId,
    users,
    'Users',
    'users'
  );

  return validRecords;
};
```

## Testing

### 1. Unit Testing

```typescript
import { dataScopeService } from '../services/DataScopeService';

describe('DataScopeService', () => {
  beforeEach(() => {
    dataScopeService.clearTableConfigs();
  });

  it('should apply tenant scope filter', async () => {
    const dataScope = { scope: 'tenant', tenantId: 'tenant123' };
    const whereClause = dataScopeService.getScopeWhereClause(
      dataScope,
      'users'
    );

    expect(whereClause.tenantId).toBe('tenant123');
  });

  it('should apply own scope filter', async () => {
    const dataScope = {
      scope: 'own',
      userId: 'user123',
      tenantId: 'tenant123',
    };
    const whereClause = dataScopeService.getScopeWhereClause(
      dataScope,
      'users'
    );

    expect(whereClause.userId).toBe('user123');
    expect(whereClause.tenantId).toBe('tenant123');
  });
});
```

### 2. Integration Testing

```typescript
describe('DataScopeService Integration', () => {
  it('should filter users by scope', async () => {
    const query = { where: { isActive: true } };
    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      query,
      'user123',
      'Users',
      'users'
    );

    expect(scopedQuery.where).toHaveProperty('tenantId');
  });
});
```

## Best Practices

1. **Always validate data access** before performing operations
2. **Use table configurations** for consistent field mapping
3. **Handle errors gracefully** with fallback strategies
4. **Optimize queries** by selecting only needed fields
5. **Use bulk operations** for multiple record validation
6. **Cache permission data** to avoid repeated database calls
7. **Log access violations** for security monitoring
8. **Test thoroughly** with different scope scenarios

## Security Considerations

1. **Fail secure** - apply most restrictive filters on errors
2. **Validate all inputs** before applying filters
3. **Log access attempts** for audit trails
4. **Use parameterized queries** to prevent SQL injection
5. **Regular security audits** of data access patterns
6. **Monitor performance** of scope filtering operations
