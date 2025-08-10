import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/jwt';
import { hashPassword } from '@/lib/jwt';

// Test data interfaces
export interface TestTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  tenantId: string;
}

export interface TestRole {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
}

export interface TestPermission {
  id: string;
  moduleKey: string;
  action: string;
  description?: string;
}

// Global test data
export let testTenant: TestTenant;
export let testUser: TestUser;
export let testAdminUser: TestUser;
export let testRole: TestRole;
export let testPermissions: TestPermission[];
export let validToken: string;
export let adminToken: string;
export let invalidToken: string;

// Setup function to create test data
export const setupTestData = async () => {
  // Create test tenant
  testTenant = await prisma.tenant.create({
    data: {
      name: 'Test Tenant',
      slug: 'test-tenant',
      isActive: true,
      plan: 'professional',
      region: 'us-east-1',
      features: ['users', 'roles', 'support', 'audit-logs'],
      description: 'Test tenant for API testing'
    }
  });

  // Create test permissions
  testPermissions = await Promise.all([
    prisma.permission.create({
      data: {
        moduleKey: 'users',
        action: 'read',
        description: 'View users'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'users',
        action: 'write',
        description: 'Create/update users'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'roles',
        action: 'read',
        description: 'View roles'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'roles',
        action: 'write',
        description: 'Create/update roles'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'support',
        action: 'read',
        description: 'View support tickets'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'support',
        action: 'write',
        description: 'Create/update support tickets'
      }
    }),
    prisma.permission.create({
      data: {
        moduleKey: 'audit-logs',
        action: 'read',
        description: 'View audit logs'
      }
    })
  ]);

  // Create test role with permissions
  testRole = await prisma.role.create({
    data: {
      name: 'Test Role',
      description: 'Test role for API testing',
      tenantId: testTenant.id,
      isDefault: false,
      color: '#3B82F6',
      priority: 1,
      permissions: {
        create: testPermissions.map(permission => ({
          permissionId: permission.id
        }))
      }
    }
  });

  // Create test user
  const hashedPassword = await hashPassword('TestPassword123!');
  testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'testuser@testtenant.com',
      password: hashedPassword,
      isActive: true,
      tenantId: testTenant.id,
      userRoles: {
        create: {
          roleId: testRole.id
        }
      }
    }
  });

  // Create admin user with all permissions
  testAdminUser = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@testtenant.com',
      password: hashedPassword,
      isActive: true,
      tenantId: testTenant.id,
      userRoles: {
        create: {
          roleId: testRole.id
        }
      }
    }
  });

  // Create tokens
  validToken = await createToken({
    id: testUser.id,
    email: testUser.email,
    tenantId: testTenant.id,
    role: 'user'
  });

  adminToken = await createToken({
    id: testAdminUser.id,
    email: testAdminUser.email,
    tenantId: testTenant.id,
    role: 'admin'
  });

  invalidToken = 'invalid.jwt.token';
};

// Cleanup function to remove test data
export const cleanupTestData = async () => {
  // Delete in reverse order to handle foreign key constraints
  await prisma.userRole.deleteMany({
    where: {
      userId: { in: [testUser.id, testAdminUser.id] }
    }
  });

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: testRole.id
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: [testUser.id, testAdminUser.id] }
    }
  });

  await prisma.role.delete({
    where: { id: testRole.id }
  });

  await prisma.tenant.delete({
    where: { id: testTenant.id }
  });

  await prisma.permission.deleteMany({
    where: {
      id: { in: testPermissions.map(p => p.id) }
    }
  });
};

// Helper function to create authenticated request
export const createAuthenticatedRequest = (
  method: string,
  url: string,
  token: string = validToken,
  body?: any
): NextRequest => {
  const headers: Record<string, string> = {
    'authorization': `Bearer ${token}`,
    'content-type': 'application/json'
  };

  const request = new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return request;
};

// Helper function to create unauthenticated request
export const createUnauthenticatedRequest = (
  method: string,
  url: string,
  body?: any
): NextRequest => {
  const headers: Record<string, string> = {
    'content-type': 'application/json'
  };

  const request = new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return request;
};

// Helper function to create request with invalid token
export const createInvalidTokenRequest = (
  method: string,
  url: string,
  body?: any
): NextRequest => {
  return createAuthenticatedRequest(method, url, invalidToken, body);
};

// Helper function to create another tenant's data
export const createAnotherTenantData = async () => {
  const anotherTenant = await prisma.tenant.create({
    data: {
      name: 'Another Tenant',
      slug: 'another-tenant',
      isActive: true,
      plan: 'starter',
      region: 'us-west-1',
      features: ['users'],
      description: 'Another tenant for isolation testing'
    }
  });

  const anotherUser = await prisma.user.create({
    data: {
      name: 'Another User',
      email: 'user@anothertenant.com',
      password: await hashPassword('Password123!'),
      isActive: true,
      tenantId: anotherTenant.id
    }
  });

  return { anotherTenant, anotherUser };
};

// Helper function to validate response structure
export const validateSuccessResponse = (response: any) => {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('message');
  expect(typeof response.message).toBe('string');
};

export const validateErrorResponse = (response: any, expectedStatus: number = 400) => {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('message');
  expect(response).toHaveProperty('status', expectedStatus);
  expect(typeof response.message).toBe('string');
};

// Helper function to validate pagination structure
export const validatePagination = (pagination: any) => {
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('totalPages');
  expect(typeof pagination.page).toBe('number');
  expect(typeof pagination.limit).toBe('number');
  expect(typeof pagination.total).toBe('number');
  expect(typeof pagination.totalPages).toBe('number');
};

// Helper function to validate list response structure
export const validateListResponse = (response: any, itemValidator?: (item: any) => void) => {
  validateSuccessResponse(response);
  expect(response.data).toHaveProperty('items');
  expect(Array.isArray(response.data.items)).toBe(true);
  
  if (itemValidator && response.data.items.length > 0) {
    itemValidator(response.data.items[0]);
  }
};

// Performance test helper
export const measureResponseTime = async (requestFn: () => Promise<any>): Promise<number> => {
  const start = Date.now();
  await requestFn();
  const end = Date.now();
  return end - start;
};

// Test constants
export const TEST_CONSTANTS = {
  MAX_PAGINATION_LIMIT: 100,
  REASONABLE_RESPONSE_TIME_MS: 2000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500
}; 