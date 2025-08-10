import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tenant/[tenantSlug]/users/route';
import { GET as GETRoles, POST as POSTRoles, PUT as PUTRoles, DELETE as DELETERoles } from '@/app/api/tenant/[tenantSlug]/roles/route';
import { GET as GETAuditLogs } from '@/app/api/tenant/[tenantSlug]/audit-logs/route';
import { GET as GETDashboard } from '@/app/api/tenant/[tenantSlug]/dashboard/route';
import { GET as GETSupport, POST as POSTSupport } from '@/app/api/tenant/[tenantSlug]/support/route';
import { GET as GETNotifications } from '@/app/api/tenant/[tenantSlug]/notifications/route';
import { GET as GETSettings } from '@/app/api/tenant/[tenantSlug]/settings/route';
import { GET as GETProfile, PUT as PUTProfile } from '@/app/api/tenant/[tenantSlug]/profile/route';
import { GET as GETPermissions } from '@/app/api/tenant/[tenantSlug]/permissions/route';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');
jest.mock('@/lib/audit');
jest.mock('@/lib/jwt');

// Import mocked modules
const { prisma } = require('@/lib/prisma');
const { withTenantAuth } = require('@/lib/authMiddleware');
const { createSuccessResponse, createErrorResponse } = require('@/lib/apiResponse');
const { createAuditLogFromRequest } = require('@/lib/audit');
const { hashPassword } = require('@/lib/jwt');

describe('Tenant API Comprehensive Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };
  
  // Test user credentials from the provided login details
  const testUsers = {
    admin: { email: 'admin@techcorp.com', password: 'AdminPass123' },
    manager: { email: 'manager@techcorp.com', password: 'AdminPass123' },
    user: { email: 'user@techcorp.com', password: 'AdminPass123' },
    viewer: { email: 'viewer@techcorp.com', password: 'AdminPass123' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/users',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/users')
    } as any;

    // Mock withTenantAuth to return a function that calls the handler
    withTenantAuth.mockImplementation((handler) => {
      return async (req: any, params: any) => {
        // Mock authenticated user
        req.user = {
          id: 'user-1',
          email: 'admin@techcorp.com',
          tenantId: 'tenant-1',
          roles: ['admin']
        };
        return handler(req, params);
      };
    });

    // Mock Prisma responses
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    prisma.role.findMany.mockResolvedValue([]);
    prisma.role.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.supportTicket.findMany.mockResolvedValue([]);
    prisma.supportTicket.count.mockResolvedValue(0);
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(0);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      isActive: true
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@techcorp.com',
      name: 'Admin User',
      isActive: true,
      tenantId: 'tenant-1'
    });

    // Mock API response functions
    createSuccessResponse.mockImplementation((data: any) => 
      new Response(JSON.stringify({ success: true, data }), { status: 200 })
    );
    createErrorResponse.mockImplementation((message: string, status: number = 400) => 
      new Response(JSON.stringify({ success: false, error: message }), { status })
    );
  });

  describe('Authentication & Authorization Tests', () => {
    it('should reject requests without authentication token', async () => {
      mockRequest.headers = new Map();
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject requests with invalid tenant slug', async () => {
      const response = await GET(mockRequest, { params: { tenantSlug: 'invalid-tenant' } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should reject requests for inactive tenants', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Inactive Tenant',
        slug: 'inactive-tenant',
        isActive: false
      });

      const response = await GET(mockRequest, { params: { tenantSlug: 'inactive-tenant' } });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Users API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/users', () => {
      it('should return users list with pagination', async () => {
        const mockUsers = [
          {
            id: 'user-1',
            name: 'Admin User',
            email: 'admin@techcorp.com',
            isActive: true,
            createdAt: new Date(),
            userRoles: [{ role: { name: 'Admin' } }]
          }
        ];

        prisma.user.findMany.mockResolvedValue(mockUsers);
        prisma.user.count.mockResolvedValue(1);

        const response = await GET(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.users).toHaveLength(1);
        expect(data.data.pagination).toBeDefined();
      });

      it('should filter users by search term', async () => {
        mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users?search=admin');
        
        const response = await GET(mockRequest, { params: mockParams });
        
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: [
                { name: { contains: 'admin', mode: 'insensitive' } },
                { email: { contains: 'admin', mode: 'insensitive' } }
              ]
            })
          })
        );
      });

      it('should filter users by status', async () => {
        mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users?status=active');
        
        const response = await GET(mockRequest, { params: mockParams });
        
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isActive: true
            })
          })
        );
      });

      it('should handle database errors gracefully', async () => {
        prisma.user.findMany.mockRejectedValue(new Error('Database connection failed'));

        const response = await GET(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('POST /api/tenant/[tenantSlug]/users', () => {
      it('should create a new user successfully', async () => {
        const newUser = {
          name: 'New User',
          email: 'newuser@techcorp.com',
          password: 'Password123',
          roleIds: ['role-1']
        };

        mockRequest.json.mockResolvedValue(newUser);
        prisma.user.create.mockResolvedValue({
          id: 'user-2',
          ...newUser,
          password: 'hashed-password'
        });

        const response = await POST(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(hashPassword).toHaveBeenCalledWith('Password123');
      });

      it('should validate required fields', async () => {
        const invalidUser = {
          name: '',
          email: 'invalid-email',
          password: '123'
        };

        mockRequest.json.mockResolvedValue(invalidUser);

        const response = await POST(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should prevent duplicate email addresses', async () => {
        const duplicateUser = {
          name: 'Duplicate User',
          email: 'admin@techcorp.com',
          password: 'Password123'
        };

        mockRequest.json.mockResolvedValue(duplicateUser);
        prisma.user.findUnique.mockResolvedValue({
          id: 'existing-user',
          email: 'admin@techcorp.com'
        });

        const response = await POST(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('already exists');
      });
    });

    describe('PUT /api/tenant/[tenantSlug]/users/[id]', () => {
      it('should update user successfully', async () => {
        const updateData = {
          name: 'Updated User',
          email: 'updated@techcorp.com'
        };

        mockRequest.json.mockResolvedValue(updateData);
        prisma.user.update.mockResolvedValue({
          id: 'user-1',
          ...updateData
        });

        const response = await PUT(mockRequest, { params: { ...mockParams, id: 'user-1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should handle user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const response = await PUT(mockRequest, { params: { ...mockParams, id: 'nonexistent' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
      });
    });

    describe('DELETE /api/tenant/[tenantSlug]/users/[id]', () => {
      it('should delete user successfully', async () => {
        prisma.user.delete.mockResolvedValue({ id: 'user-1' });

        const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'user-1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should prevent self-deletion', async () => {
        const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'user-1' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('cannot delete yourself');
      });
    });
  });

  describe('Roles API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/roles', () => {
      it('should return roles list with permissions', async () => {
        const mockRoles = [
          {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
            isActive: true,
            permissions: [{ permission: { name: 'users:view' } }]
          }
        ];

        prisma.role.findMany.mockResolvedValue(mockRoles);
        prisma.role.count.mockResolvedValue(1);

        const response = await GETRoles(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.roles).toHaveLength(1);
      });
    });

    describe('POST /api/tenant/[tenantSlug]/roles', () => {
      it('should create a new role successfully', async () => {
        const newRole = {
          name: 'Manager',
          description: 'Manager role',
          permissions: ['users:view', 'users:edit']
        };

        mockRequest.json.mockResolvedValue(newRole);
        prisma.role.create.mockResolvedValue({
          id: 'role-2',
          ...newRole
        });

        const response = await POSTRoles(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should prevent duplicate role names', async () => {
        const duplicateRole = {
          name: 'Admin',
          description: 'Duplicate role'
        };

        mockRequest.json.mockResolvedValue(duplicateRole);
        prisma.role.findUnique.mockResolvedValue({
          id: 'existing-role',
          name: 'Admin'
        });

        const response = await POSTRoles(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });
  });

  describe('Audit Logs API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/audit-logs', () => {
      it('should return audit logs with filters', async () => {
        const mockAuditLogs = [
          {
            id: 'audit-1',
            action: 'USER_LOGIN',
            description: 'User logged in',
            ipAddress: '127.0.0.1',
            userAgent: 'Jest Test Agent',
            createdAt: new Date(),
            user: { name: 'Admin User', email: 'admin@techcorp.com' }
          }
        ];

        prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
        prisma.auditLog.count.mockResolvedValue(1);

        const response = await GETAuditLogs(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.auditLogs).toHaveLength(1);
      });

      it('should filter audit logs by date range', async () => {
        mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?startDate=2024-01-01&endDate=2024-01-31');
        
        const response = await GETAuditLogs(mockRequest, { params: mockParams });
        
        expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date)
              })
            })
          })
        );
      });

      it('should filter audit logs by action type', async () => {
        mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?action=USER_LOGIN');
        
        const response = await GETAuditLogs(mockRequest, { params: mockParams });
        
        expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              action: 'USER_LOGIN'
            })
          })
        );
      });
    });
  });

  describe('Dashboard API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/dashboard', () => {
      it('should return dashboard statistics', async () => {
        const mockStats = {
          totalUsers: 10,
          activeUsers: 8,
          totalRoles: 3,
          recentActivity: []
        };

        prisma.user.count.mockResolvedValue(10);
        prisma.role.count.mockResolvedValue(3);
        prisma.auditLog.findMany.mockResolvedValue([]);

        const response = await GETDashboard(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.stats).toBeDefined();
      });
    });
  });

  describe('Support API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/support', () => {
      it('should return support tickets', async () => {
        const mockTickets = [
          {
            id: 'ticket-1',
            title: 'Technical Issue',
            description: 'Cannot access dashboard',
            status: 'open',
            priority: 'high',
            createdAt: new Date(),
            user: { name: 'User', email: 'user@techcorp.com' }
          }
        ];

        prisma.supportTicket.findMany.mockResolvedValue(mockTickets);
        prisma.supportTicket.count.mockResolvedValue(1);

        const response = await GETSupport(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.tickets).toHaveLength(1);
      });
    });

    describe('POST /api/tenant/[tenantSlug]/support', () => {
      it('should create a new support ticket', async () => {
        const newTicket = {
          title: 'New Issue',
          description: 'Description of the issue',
          priority: 'medium',
          category: 'technical'
        };

        mockRequest.json.mockResolvedValue(newTicket);
        prisma.supportTicket.create.mockResolvedValue({
          id: 'ticket-2',
          ...newTicket,
          status: 'open',
          createdAt: new Date()
        });

        const response = await POSTSupport(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Notifications API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/notifications', () => {
      it('should return user notifications', async () => {
        const mockNotifications = [
          {
            id: 'notification-1',
            title: 'System Alert',
            message: 'System maintenance scheduled',
            type: 'info',
            isRead: false,
            createdAt: new Date()
          }
        ];

        prisma.notification.findMany.mockResolvedValue(mockNotifications);
        prisma.notification.count.mockResolvedValue(1);

        const response = await GETNotifications(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.notifications).toHaveLength(1);
      });
    });
  });

  describe('Settings API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/settings', () => {
      it('should return tenant settings', async () => {
        const mockSettings = {
          theme: 'light',
          notifications: true,
          language: 'en'
        };

        prisma.systemSetting.findMany.mockResolvedValue([
          { key: 'theme', value: 'light' },
          { key: 'notifications', value: 'true' },
          { key: 'language', value: 'en' }
        ]);

        const response = await GETSettings(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.settings).toBeDefined();
      });
    });
  });

  describe('Profile API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/profile', () => {
      it('should return user profile', async () => {
        const mockProfile = {
          id: 'user-1',
          name: 'Admin User',
          email: 'admin@techcorp.com',
          avatar: null,
          contactNumber: '+1234567890',
          lastLogin: new Date()
        };

        prisma.user.findUnique.mockResolvedValue(mockProfile);

        const response = await GETProfile(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.profile).toBeDefined();
      });
    });

    describe('PUT /api/tenant/[tenantSlug]/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          contactNumber: '+0987654321'
        };

        mockRequest.json.mockResolvedValue(updateData);
        prisma.user.update.mockResolvedValue({
          id: 'user-1',
          ...updateData
        });

        const response = await PUTProfile(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Permissions API Tests', () => {
    describe('GET /api/tenant/[tenantSlug]/permissions/current-user', () => {
      it('should return current user permissions', async () => {
        const mockPermissions = {
          user: {
            id: 'user-1',
            name: 'Admin User',
            email: 'admin@techcorp.com',
            roles: [{ name: 'Admin' }]
          },
          permissions: ['users:view', 'users:edit', 'roles:view'],
          modulePermissions: {
            users: ['view', 'edit'],
            roles: ['view']
          },
          accessibleModules: ['users', 'roles', 'dashboard'],
          menuItems: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              path: '/dashboard',
              permissions: ['dashboard:view']
            }
          ],
          hasAccess: true,
          totalPermissions: 3,
          totalModules: 3
        };

        prisma.user.findUnique.mockResolvedValue(mockPermissions.user);
        prisma.permission.findMany.mockResolvedValue([
          { name: 'users:view' },
          { name: 'users:edit' },
          { name: 'roles:view' }
        ]);

        const response = await GETPermissions(mockRequest, { params: mockParams });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.permissions).toBeDefined();
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle database connection failures', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('Connection timeout'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle concurrent requests gracefully', async () => {
      // Simulate concurrent requests
      const promises = Array(5).fill(null).map(() => 
        GET(mockRequest, { params: mockParams })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@techcorp.com`
      }));

      prisma.user.findMany.mockResolvedValue(largeDataset);
      prisma.user.count.mockResolvedValue(1000);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.users).toHaveLength(1000);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should deny access to users without required permissions', async () => {
      // Mock user with limited permissions
      mockRequest.user = {
        id: 'user-2',
        email: 'viewer@techcorp.com',
        tenantId: 'tenant-1',
        roles: ['viewer']
      };

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should allow access to users with required permissions', async () => {
      // Mock user with admin permissions
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@techcorp.com',
        tenantId: 'tenant-1',
        roles: ['admin']
      };

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
}); 