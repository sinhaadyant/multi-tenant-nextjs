import request from 'supertest';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { POST as tenantLoginHandler } from '@/app/api/tenant/auth/login/route';
import { POST as tenantLogoutHandler } from '@/app/api/tenant/auth/logout/route';
import { POST as tenantRefreshHandler } from '@/app/api/tenant/auth/refresh/route';
import { POST as tenantForgotPasswordHandler } from '@/app/api/tenant/auth/forgot-password/route';
import testUsers from '../../fixtures/users.json';
import testTenants from '../../fixtures/tenants.json';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockReturnValue({ id: 'tu-1', email: 'admin@tenant1.com', tenantId: 't-1' }),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$mock-hash'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/database', () => ({
  findTenantBySlug: jest.fn(),
  findTenantUserByEmail: jest.fn(),
  updateUserLastLogin: jest.fn(),
  createPasswordResetToken: jest.fn(),
}));

jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

const mockDatabase = require('@/lib/database');
const mockAuth = require('@/lib/auth');
const mockRateLimit = require('@/lib/rate-limiter');

describe('Tenant Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tenant/auth/login', () => {
    it('should login tenant user successfully', async () => {
      const validUser = testUsers.tenantUsers[0];
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        password: '$2b$10$mock-hash',
        tenantId: validTenant.id,
        status: 'active',
        role: 'admin',
        permissions: validUser.permissions,
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
          password: validUser.password,
          tenantSlug: validUser.tenantSlug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(validUser.email);
      expect(result.user.tenantSlug).toBe(validUser.tenantSlug);
      expect(mockDatabase.updateUserLastLogin).toHaveBeenCalledWith(validUser.id);
    });

    it('should reject login for invalid tenant slug', async () => {
      mockDatabase.findTenantBySlug.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@tenant1.com',
          password: 'Test123!@#',
          tenantSlug: 'nonexistent-tenant',
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tenant not found');
    });

    it('should reject login for disabled tenant', async () => {
      const disabledTenant = testTenants.inactiveTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: disabledTenant.id,
        slug: disabledTenant.slug,
        status: 'inactive',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@disabled.com',
          password: 'Test123!@#',
          tenantSlug: disabledTenant.slug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tenant is disabled');
    });

    it('should prevent cross-tenant login attempts', async () => {
      const tenant1 = testTenants.activeTenants[0];
      const tenant2User = testUsers.tenantUsers[3]; // tenant2 user
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: tenant1.id,
        slug: tenant1.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: tenant2User.id,
        email: tenant2User.email,
        password: '$2b$10$mock-hash',
        tenantId: 't-2', // Different tenant ID
        status: 'active',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: tenant2User.email,
          password: tenant2User.password,
          tenantSlug: tenant1.slug, // Trying to login to wrong tenant
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('User does not belong to this tenant');
    });

    it('should reject login for disabled user', async () => {
      const disabledUser = testUsers.tenantUsers[4];
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: disabledUser.id,
        email: disabledUser.email,
        password: '$2b$10$mock-hash',
        tenantId: validTenant.id,
        status: 'inactive',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: disabledUser.email,
          password: disabledUser.password,
          tenantSlug: validTenant.slug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('User account is disabled');
    });

    it('should validate tenant slug format', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@tenant1.com',
          password: 'Test123!@#',
          tenantSlug: 'invalid-chars!@#',
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid tenant slug format');
    });

    it('should handle case sensitivity in tenant slug', async () => {
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@tenant1.com',
          password: 'Test123!@#',
          tenantSlug: validTenant.slug.toUpperCase(), // Wrong case
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tenant not found');
    });

    it('should include user permissions in response', async () => {
      const validUser = testUsers.tenantUsers[0];
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        password: '$2b$10$mock-hash',
        tenantId: validTenant.id,
        status: 'active',
        role: validUser.role,
        permissions: validUser.permissions,
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
          password: validUser.password,
          tenantSlug: validUser.tenantSlug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.role).toBe(validUser.role);
      expect(result.user.permissions).toEqual(validUser.permissions);
    });
  });

  describe('Tenant Security and Isolation', () => {
    it('should prevent URL manipulation attacks', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@tenant1.com',
          password: 'Test123!@#',
          tenantSlug: '../../../etc/passwd',
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid tenant slug format');
    });

    it('should sanitize tenant slug input', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@tenant1.com',
          password: 'Test123!@#',
          tenantSlug: '<script>alert("xss")</script>',
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(mockDatabase.findTenantBySlug).not.toHaveBeenCalled();
    });

    it('should validate API parameter tampering', async () => {
      const validUser = testUsers.tenantUsers[0];
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      // User tries to tamper with tenant ID in request
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
          password: validUser.password,
          tenantSlug: validUser.tenantSlug,
          tenantId: 'tampered-tenant-id', // Should be ignored
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      
      // Should use tenantSlug to lookup tenant, ignore tampered tenantId
      expect(mockDatabase.findTenantBySlug).toHaveBeenCalledWith(validUser.tenantSlug);
    });

    it('should handle special characters in tenant slug', async () => {
      const specialChars = ['%20', '+', '&', '=', '?', '#'];
      
      for (const char of specialChars) {
        const { req } = createMocks({
          method: 'POST',
          body: {
            email: 'admin@tenant1.com',
            password: 'Test123!@#',
            tenantSlug: `tenant${char}1`,
          },
        });

        const response = await tenantLoginHandler(req as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should include correct permissions for admin role', async () => {
      const adminUser = testUsers.tenantUsers.find(u => u.role === 'admin');
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        password: '$2b$10$mock-hash',
        tenantId: validTenant.id,
        status: 'active',
        role: 'admin',
        permissions: adminUser.permissions,
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: adminUser.email,
          password: adminUser.password,
          tenantSlug: adminUser.tenantSlug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.permissions).toContain('users.create');
      expect(result.user.permissions).toContain('users.update');
      expect(result.user.permissions).toContain('users.delete');
    });

    it('should include limited permissions for user role', async () => {
      const regularUser = testUsers.tenantUsers.find(u => u.role === 'user');
      const validTenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: validTenant.id,
        slug: validTenant.slug,
        status: 'active',
      });
      
      mockDatabase.findTenantUserByEmail.mockResolvedValue({
        id: regularUser.id,
        email: regularUser.email,
        password: '$2b$10$mock-hash',
        tenantId: validTenant.id,
        status: 'active',
        role: 'user',
        permissions: regularUser.permissions,
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: regularUser.email,
          password: regularUser.password,
          tenantSlug: regularUser.tenantSlug,
        },
      });

      const response = await tenantLoginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.permissions).toContain('users.read');
      expect(result.user.permissions).not.toContain('users.create');
      expect(result.user.permissions).not.toContain('users.delete');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent tenant logins', async () => {
      const users = testUsers.tenantUsers.slice(0, 3);
      const tenant = testTenants.activeTenants[0];
      
      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: tenant.id,
        slug: tenant.slug,
        status: 'active',
      });

      const loginPromises = users.map((user) => {
        mockDatabase.findTenantUserByEmail.mockResolvedValue({
          id: user.id,
          email: user.email,
          password: '$2b$10$mock-hash',
          tenantId: tenant.id,
          status: 'active',
          role: user.role,
          permissions: user.permissions,
        });

        const { req } = createMocks({
          method: 'POST',
          body: {
            email: user.email,
            password: user.password,
            tenantSlug: user.tenantSlug,
          },
        });

        return tenantLoginHandler(req as NextRequest);
      });

      const responses = await Promise.all(loginPromises);
      
      responses.forEach(async (response) => {
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);
      });
    });
  });
});
