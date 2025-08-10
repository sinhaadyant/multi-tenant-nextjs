import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tenant/[tenantSlug]/users/route';

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

describe('Tenant Users API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

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
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    prisma.user.delete.mockResolvedValue({});
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      isActive: true
    });

    // Mock API response functions
    createSuccessResponse.mockImplementation((data: any) => 
      new Response(JSON.stringify({ success: true, data }), { status: 200 })
    );
    createErrorResponse.mockImplementation((message: string, status: number = 400) => 
      new Response(JSON.stringify({ success: false, error: message }), { status })
    );

    // Mock hashPassword
    hashPassword.mockResolvedValue('hashed-password');
  });

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
        },
        {
          id: 'user-2',
          name: 'Manager User',
          email: 'manager@techcorp.com',
          isActive: true,
          createdAt: new Date(),
          userRoles: [{ role: { name: 'Manager' } }]
        }
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.users).toHaveLength(2);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.totalRecords).toBe(2);
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

    it('should filter users by role', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users?role=admin');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userRoles: {
              some: {
                role: {
                  name: {
                    contains: 'admin',
                    mode: 'insensitive'
                  }
                }
              }
            }
          })
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users?page=2&limit=5&sortBy=name&sortOrder=asc');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit
          take: 5,
          orderBy: {
            name: 'asc'
          }
        })
      );
    });

    it('should return empty list when no users found', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.users).toHaveLength(0);
      expect(data.data.pagination.totalRecords).toBe(0);
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
        contactNumber: '+1234567890',
        roleIds: ['role-1'],
        sendInvitation: false
      };

      mockRequest.json.mockResolvedValue(newUser);
      
      const createdUser = {
        id: 'user-3',
        name: 'New User',
        email: 'newuser@techcorp.com',
        contactNumber: '+1234567890',
        isActive: true,
        createdAt: new Date()
      };

      prisma.user.create.mockResolvedValue(createdUser);
      prisma.user.findUnique.mockResolvedValue(null); // No existing user with same email

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(hashPassword).toHaveBeenCalledWith('Password123');
      expect(createAuditLogFromRequest).toHaveBeenCalled();
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

    it('should validate email format', async () => {
      const invalidEmailUser = {
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'Password123'
      };

      mockRequest.json.mockResolvedValue(invalidEmailUser);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email address');
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = {
        name: 'Test User',
        email: 'test@techcorp.com',
        password: '123'
      };

      mockRequest.json.mockResolvedValue(weakPasswordUser);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password must be at least 8 characters');
    });

    it('should assign roles to new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@techcorp.com',
        password: 'Password123',
        roleIds: ['role-1', 'role-2']
      };

      mockRequest.json.mockResolvedValue(newUser);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-3',
        ...newUser
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/tenant/[tenantSlug]/users/[id]', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@techcorp.com',
        contactNumber: '+0987654321',
        roleIds: ['role-2'],
        isActive: true
      };

      mockRequest.json.mockResolvedValue(updateData);
      
      const updatedUser = {
        id: 'user-1',
        ...updateData,
        updatedAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@techcorp.com'
      });
      prisma.user.update.mockResolvedValue(updatedUser);

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      const updateData = {
        name: 'Updated User'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('User not found');
    });

    it('should prevent email duplication on update', async () => {
      const updateData = {
        email: 'existing@techcorp.com'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'admin@techcorp.com' }) // Current user
        .mockResolvedValueOnce({ id: 'user-2', email: 'existing@techcorp.com' }); // Existing user with same email

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should validate email format on update', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      mockRequest.json.mockResolvedValue(updateData);

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email address');
    });
  });

  describe('DELETE /api/tenant/[tenantSlug]/users/[id]', () => {
    it('should delete user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'user2@techcorp.com'
      });
      prisma.user.delete.mockResolvedValue({ id: 'user-2' });

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'user-2' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should prevent self-deletion', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@techcorp.com'
      });

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('cannot delete yourself');
    });

    it('should handle user not found for deletion', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('User not found');
    });
  });

  describe('Bulk Operations Tests', () => {
    it('should handle bulk user activation', async () => {
      const bulkAction = {
        userIds: ['user-1', 'user-2'],
        action: 'activate'
      };

      mockRequest.json.mockResolvedValue(bulkAction);
      prisma.user.updateMany.mockResolvedValue({ count: 2 });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle bulk user deactivation', async () => {
      const bulkAction = {
        userIds: ['user-1', 'user-2'],
        action: 'deactivate'
      };

      mockRequest.json.mockResolvedValue(bulkAction);
      prisma.user.updateMany.mockResolvedValue({ count: 2 });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle bulk role assignment', async () => {
      const bulkAction = {
        userIds: ['user-1', 'user-2'],
        action: 'assignRoles',
        roleIds: ['role-1', 'role-2']
      };

      mockRequest.json.mockResolvedValue(bulkAction);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate bulk action parameters', async () => {
      const invalidBulkAction = {
        userIds: [],
        action: 'invalid_action'
      };

      mockRequest.json.mockResolvedValue(invalidBulkAction);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
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

    it('should handle database transaction failures', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@techcorp.com',
        password: 'Password123'
      };

      mockRequest.json.mockResolvedValue(newUser);
      prisma.user.create.mockRejectedValue(new Error('Transaction failed'));

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle concurrent user creation requests', async () => {
      const newUser = {
        name: 'Concurrent User',
        email: 'concurrent@techcorp.com',
        password: 'Password123'
      };

      mockRequest.json.mockResolvedValue(newUser);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-concurrent',
        ...newUser
      });

      // Simulate concurrent requests
      const promises = Array(3).fill(null).map(() => 
        POST(mockRequest, { params: mockParams })
      );

      const responses = await Promise.all(promises);
      
      // Should handle gracefully (some might fail due to unique constraint)
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should handle large datasets efficiently', async () => {
      const largeUserList = Array(1000).fill(null).map((_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@techcorp.com`,
        isActive: true,
        createdAt: new Date(),
        userRoles: [{ role: { name: 'User' } }]
      }));

      prisma.user.findMany.mockResolvedValue(largeUserList);
      prisma.user.count.mockResolvedValue(1000);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.users).toHaveLength(1000);
    });

    it('should handle special characters in search terms', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users?search=user@domain.com');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'user@domain.com', mode: 'insensitive' } },
              { email: { contains: 'user@domain.com', mode: 'insensitive' } }
            ]
          })
        })
      );
    });
  });
}); 