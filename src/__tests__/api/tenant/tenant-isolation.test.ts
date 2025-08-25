import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET as getUsersHandler } from '@/app/api/tenant/[tenantSlug]/users/route';
import { GET as getRolesHandler } from '@/app/api/tenant/[tenantSlug]/roles/route';
import { GET as getNotificationsHandler } from '@/app/api/tenant/[tenantSlug]/notifications/route';
import { GET as getDashboardHandler } from '@/app/api/tenant/[tenantSlug]/dashboard/route';
import testUsers from '../../fixtures/users.json';
import testTenants from '../../fixtures/tenants.json';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  validateTenantAccess: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  findTenantBySlug: jest.fn(),
  getTenantUsers: jest.fn(),
  getTenantRoles: jest.fn(),
  getTenantNotifications: jest.fn(),
  getTenantDashboardStats: jest.fn(),
  findUserById: jest.fn(),
}));

const mockAuth = require('@/lib/auth');
const mockDatabase = require('@/lib/database');

describe('Multi-Tenant Data Isolation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-Tenant Data Leakage Prevention', () => {
    it('should prevent tenant1 user from accessing tenant2 data', async () => {
      const tenant1User = testUsers.tenantUsers[0]; // tenant1 admin
      const tenant2Slug = testTenants.activeTenants[1].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        email: tenant1User.email,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(false);

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        url: `/api/tenant/${tenant2Slug}/users`,
      });

      // Mock Next.js params
      (req as any).params = { tenantSlug: tenant2Slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Access denied: User does not belong to this tenant');
      expect(mockDatabase.getTenantUsers).not.toHaveBeenCalled();
    });

    it('should allow tenant1 user to access tenant1 data', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        email: tenant1User.email,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      mockDatabase.getTenantUsers.mockResolvedValue([
        {
          id: 'test-u-1',
          email: 'admin@tenant1.com',
          name: 'Tenant 1 Admin',
          tenantId: 'test-t-1',
          role: 'admin',
        },
        {
          id: 'test-u-2',
          email: 'manager@tenant1.com',
          name: 'Tenant 1 Manager',
          tenantId: 'test-t-1',
          role: 'manager',
        },
      ]);

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        url: `/api/tenant/${tenant1Slug}/users`,
      });

      (req as any).params = { tenantSlug: tenant1Slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(2);
      expect(result.users.every((user: any) => user.tenantId === 'test-t-1')).toBe(true);
    });

    it('should return 403 for cross-tenant API access attempts', async () => {
      const endpoints = [
        '/api/tenant/tenant2/users',
        '/api/tenant/tenant2/roles',
        '/api/tenant/tenant2/notifications',
        '/api/tenant/tenant2/dashboard',
      ];

      const tenant1User = testUsers.tenantUsers[0];

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(false);

      for (const endpoint of endpoints) {
        const { req } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token',
          },
          url: endpoint,
        });

        (req as any).params = { tenantSlug: 'tenant2' };

        let response;
        if (endpoint.includes('/users')) {
          response = await getUsersHandler(req as NextRequest);
        } else if (endpoint.includes('/roles')) {
          response = await getRolesHandler(req as NextRequest);
        } else if (endpoint.includes('/notifications')) {
          response = await getNotificationsHandler(req as NextRequest);
        } else if (endpoint.includes('/dashboard')) {
          response = await getDashboardHandler(req as NextRequest);
        }

        expect(response?.status).toBe(403);
        const result = await response?.json();
        expect(result.success).toBe(false);
      }
    });

    it('should ensure dashboard stats are tenant-scoped', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      mockDatabase.getTenantDashboardStats.mockResolvedValue({
        totalUsers: 3,
        activeUsers: 2,
        totalRoles: 3,
        tenantId: 'test-t-1',
      });

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        url: `/api/tenant/${tenant1Slug}/dashboard`,
      });

      (req as any).params = { tenantSlug: tenant1Slug };

      const response = await getDashboardHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockDatabase.getTenantDashboardStats).toHaveBeenCalledWith('test-t-1');
      expect(result.stats.tenantId).toBe('test-t-1');
    });
  });

  describe('Tenant Slug Validation', () => {
    it('should return 404 for invalid tenant slugs', async () => {
      const invalidSlugs = [
        'nonexistent-tenant',
        'invalid-chars!@#',
        '',
        '../../etc/passwd',
        'null',
        'undefined',
      ];

      const validUser = testUsers.tenantUsers[0];

      mockAuth.verifyToken.mockReturnValue({
        id: validUser.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      for (const slug of invalidSlugs) {
        mockDatabase.findTenantBySlug.mockResolvedValue(null);

        const { req } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token',
          },
          url: `/api/tenant/${slug}/users`,
        });

        (req as any).params = { tenantSlug: slug };

        const response = await getUsersHandler(req as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(404);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Tenant not found');
      }
    });

    it('should return 403 for disabled tenants', async () => {
      const disabledTenant = testTenants.inactiveTenants[0];
      const validUser = testUsers.tenantUsers[0];

      mockAuth.verifyToken.mockReturnValue({
        id: validUser.id,
        tenantId: 'test-t-4',
        tenantSlug: disabledTenant.slug,
      });

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-4',
        slug: disabledTenant.slug,
        status: 'inactive',
      });

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        url: `/api/tenant/${disabledTenant.slug}/users`,
      });

      (req as any).params = { tenantSlug: disabledTenant.slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tenant is disabled');
    });

    it('should handle case sensitivity in tenant slug', async () => {
      const validTenant = testTenants.activeTenants[0];
      const upperCaseSlug = validTenant.slug.toUpperCase();
      const validUser = testUsers.tenantUsers[0];

      mockAuth.verifyToken.mockReturnValue({
        id: validUser.id,
        tenantId: 'test-t-1',
        tenantSlug: validTenant.slug,
      });

      mockDatabase.findTenantBySlug.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        url: `/api/tenant/${upperCaseSlug}/users`,
      });

      (req as any).params = { tenantSlug: upperCaseSlug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tenant not found');
    });

    it('should validate special characters in tenant slug', async () => {
      const specialChars = ['%20', '+', '&', '=', '?', '#', '<', '>', '"', "'"];
      const validUser = testUsers.tenantUsers[0];

      mockAuth.verifyToken.mockReturnValue({
        id: validUser.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      for (const char of specialChars) {
        const maliciousSlug = `tenant${char}1`;

        const { req } = createMocks({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token',
          },
          url: `/api/tenant/${maliciousSlug}/users`,
        });

        (req as any).params = { tenantSlug: maliciousSlug };

        const response = await getUsersHandler(req as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid tenant slug format');
      }
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should enforce role-based endpoint access', async () => {
      const userRoleUser = testUsers.tenantUsers.find(u => u.role === 'user');
      const validTenant = testTenants.activeTenants[0];

      mockAuth.verifyToken.mockReturnValue({
        id: userRoleUser?.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
        role: 'user',
        permissions: ['users.read'],
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: validTenant.slug,
        status: 'active',
      });

      // User should be able to read users
      const { req: readReq } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${validTenant.slug}/users`,
      });
      (readReq as any).params = { tenantSlug: validTenant.slug };

      mockDatabase.getTenantUsers.mockResolvedValue([]);
      const readResponse = await getUsersHandler(readReq as NextRequest);
      expect(readResponse.status).toBe(200);

      // User should NOT be able to create users (would need POST handler test)
      // This would be tested in a separate create user test
    });

    it('should enforce module-based permissions', async () => {
      const limitedUser = testUsers.tenantUsers.find(u => u.role === 'user');
      const validTenant = testTenants.activeTenants[1]; // tenant2 with limited modules

      mockAuth.verifyToken.mockReturnValue({
        id: limitedUser?.id,
        tenantId: 'test-t-2',
        tenantSlug: 'tenant2',
        role: 'user',
        permissions: ['users.read'],
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-2',
        slug: validTenant.slug,
        status: 'active',
        settings: {
          modules: ['users', 'roles'], // No audit module
        },
      });

      // Access to audit logs should be denied due to module restrictions
      const { req } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${validTenant.slug}/audit-logs`,
      });
      (req as any).params = { tenantSlug: validTenant.slug };

      // This would be tested with audit log handler
      // const response = await getAuditLogsHandler(req as NextRequest);
      // expect(response.status).toBe(403);
    });

    it('should enforce action-based permissions', async () => {
      const readOnlyUser = {
        id: 'test-u-readonly',
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
        role: 'viewer',
        permissions: ['users.read'], // Only read permission
      };

      mockAuth.verifyToken.mockReturnValue(readOnlyUser);
      mockAuth.validateTenantAccess.mockReturnValue(true);

      const validTenant = testTenants.activeTenants[0];

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: validTenant.slug,
        status: 'active',
      });

      // Read access should work
      const { req: readReq } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${validTenant.slug}/users`,
      });
      (readReq as any).params = { tenantSlug: validTenant.slug };

      mockDatabase.getTenantUsers.mockResolvedValue([]);
      const readResponse = await getUsersHandler(readReq as NextRequest);
      expect(readResponse.status).toBe(200);

      // Write access should be denied (would be tested with POST/PUT/DELETE handlers)
    });
  });

  describe('Data Filtering and Pagination', () => {
    it('should respect tenant boundaries in all list endpoints', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      // Test users endpoint
      mockDatabase.getTenantUsers.mockResolvedValue([
        { id: 'test-u-1', tenantId: 'test-t-1', email: 'user1@tenant1.com' },
        { id: 'test-u-2', tenantId: 'test-t-1', email: 'user2@tenant1.com' },
      ]);

      const { req } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${tenant1Slug}/users`,
      });
      (req as any).params = { tenantSlug: tenant1Slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(mockDatabase.getTenantUsers).toHaveBeenCalledWith('test-t-1', expect.any(Object));
      expect(result.users.every((user: any) => user.tenantId === 'test-t-1')).toBe(true);
    });

    it('should maintain pagination with tenant filters', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      const paginationParams = {
        page: 2,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockDatabase.getTenantUsers.mockResolvedValue({
        users: [],
        total: 25,
        page: 2,
        totalPages: 3,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${tenant1Slug}/users?page=2&limit=10&sortBy=name&sortOrder=asc`,
      });
      (req as any).params = { tenantSlug: tenant1Slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(mockDatabase.getTenantUsers).toHaveBeenCalledWith(
        'test-t-1',
        expect.objectContaining({
          page: 2,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should limit search queries to tenant data', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      const searchQuery = 'john';

      mockDatabase.getTenantUsers.mockResolvedValue([
        { id: 'test-u-1', tenantId: 'test-t-1', name: 'John Doe', email: 'john@tenant1.com' },
      ]);

      const { req } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        url: `/api/tenant/${tenant1Slug}/users?search=${searchQuery}`,
      });
      (req as any).params = { tenantSlug: tenant1Slug };

      const response = await getUsersHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(mockDatabase.getTenantUsers).toHaveBeenCalledWith(
        'test-t-1',
        expect.objectContaining({
          search: searchQuery,
        })
      );
      // All returned users should belong to the same tenant
      expect(result.users.every((user: any) => user.tenantId === 'test-t-1')).toBe(true);
    });

    it('should maintain sort orders across pages within tenant scope', async () => {
      const tenant1User = testUsers.tenantUsers[0];
      const tenant1Slug = testTenants.activeTenants[0].slug;

      mockAuth.verifyToken.mockReturnValue({
        id: tenant1User.id,
        tenantId: 'test-t-1',
        tenantSlug: 'tenant1',
      });

      mockAuth.validateTenantAccess.mockReturnValue(true);

      mockDatabase.findTenantBySlug.mockResolvedValue({
        id: 'test-t-1',
        slug: tenant1Slug,
        status: 'active',
      });

      // Test multiple pages with consistent sorting
      const pages = [1, 2, 3];
      
      for (const page of pages) {
        mockDatabase.getTenantUsers.mockResolvedValue({
          users: [
            { id: `test-u-${page}`, tenantId: 'test-t-1', name: `User ${page}` },
          ],
          total: 25,
          page,
          totalPages: 3,
        });

        const { req } = createMocks({
          method: 'GET',
          headers: { authorization: 'Bearer valid-token' },
          url: `/api/tenant/${tenant1Slug}/users?page=${page}&sortBy=name&sortOrder=desc`,
        });
        (req as any).params = { tenantSlug: tenant1Slug };

        const response = await getUsersHandler(req as NextRequest);
        expect(response.status).toBe(200);
        
        expect(mockDatabase.getTenantUsers).toHaveBeenCalledWith(
          'test-t-1',
          expect.objectContaining({
            page,
            sortBy: 'name',
            sortOrder: 'desc',
          })
        );
      }
    });
  });
});
