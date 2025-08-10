import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tenant/[tenantSlug]/roles/route';

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

describe('Tenant Roles API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/roles',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/roles')
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
    prisma.role.findMany.mockResolvedValue([]);
    prisma.role.count.mockResolvedValue(0);
    prisma.role.findUnique.mockResolvedValue(null);
    prisma.role.create.mockResolvedValue({});
    prisma.role.update.mockResolvedValue({});
    prisma.role.delete.mockResolvedValue({});
    prisma.permission.findMany.mockResolvedValue([]);
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
  });

  describe('GET /api/tenant/[tenantSlug]/roles', () => {
    it('should return roles list with permissions', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'Admin',
          description: 'Administrator role',
          isActive: true,
          isDefault: false,
          isSystem: false,
          priority: 1,
          createdAt: new Date(),
          permissions: [
            { permission: { name: 'users:view', action: 'view', moduleKey: 'users' } },
            { permission: { name: 'users:edit', action: 'edit', moduleKey: 'users' } }
          ]
        },
        {
          id: 'role-2',
          name: 'Manager',
          description: 'Manager role',
          isActive: true,
          isDefault: false,
          isSystem: false,
          priority: 2,
          createdAt: new Date(),
          permissions: [
            { permission: { name: 'users:view', action: 'view', moduleKey: 'users' } }
          ]
        }
      ];

      prisma.role.findMany.mockResolvedValue(mockRoles);
      prisma.role.count.mockResolvedValue(2);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.roles).toHaveLength(2);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.totalRecords).toBe(2);
    });

    it('should filter roles by search term', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/roles?search=admin');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'admin', mode: 'insensitive' } },
              { description: { contains: 'admin', mode: 'insensitive' } }
            ]
          })
        })
      );
    });

    it('should filter roles by status', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/roles?status=active');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true
          })
        })
      );
    });

    it('should filter system roles', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/roles?isSystem=true');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isSystem: true
          })
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/roles?page=2&limit=5&sortBy=name&sortOrder=asc');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit
          take: 5,
          orderBy: {
            name: 'asc'
          }
        })
      );
    });

    it('should return empty list when no roles found', async () => {
      prisma.role.findMany.mockResolvedValue([]);
      prisma.role.count.mockResolvedValue(0);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.roles).toHaveLength(0);
      expect(data.data.pagination.totalRecords).toBe(0);
    });

    it('should include role statistics', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'Admin',
          userRoles: [{ user: { id: 'user-1' } }, { user: { id: 'user-2' } }]
        }
      ];

      prisma.role.findMany.mockResolvedValue(mockRoles);
      prisma.role.count.mockResolvedValue(1);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.roles[0].userCount).toBe(2);
    });
  });

  describe('POST /api/tenant/[tenantSlug]/roles', () => {
    it('should create a new role successfully', async () => {
      const newRole = {
        name: 'Editor',
        description: 'Editor role with limited permissions',
        permissions: ['users:view', 'content:edit'],
        color: '#3B82F6',
        priority: 3
      };

      mockRequest.json.mockResolvedValue(newRole);
      
      const createdRole = {
        id: 'role-3',
        name: 'Editor',
        description: 'Editor role with limited permissions',
        isActive: true,
        isDefault: false,
        isSystem: false,
        color: '#3B82F6',
        priority: 3,
        createdAt: new Date()
      };

      prisma.role.create.mockResolvedValue(createdRole);
      prisma.role.findUnique.mockResolvedValue(null); // No existing role with same name

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidRole = {
        name: '',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(invalidRole);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Name is required');
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

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should validate role name format', async () => {
      const invalidRole = {
        name: 'Invalid Role Name With Special Characters!@#',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(invalidRole);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should assign permissions to new role', async () => {
      const newRole = {
        name: 'Moderator',
        description: 'Moderator role',
        permissions: ['users:view', 'content:moderate', 'reports:view']
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        id: 'role-4',
        name: 'Moderator'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate permission existence', async () => {
      const newRole = {
        name: 'Test Role',
        description: 'Test role',
        permissions: ['nonexistent:permission']
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.permission.findMany.mockResolvedValue([]); // No permissions found

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid permissions');
    });
  });

  describe('PUT /api/tenant/[tenantSlug]/roles/[id]', () => {
    it('should update role successfully', async () => {
      const updateData = {
        name: 'Updated Admin',
        description: 'Updated administrator role',
        permissions: ['users:view', 'users:edit', 'roles:view'],
        color: '#10B981',
        priority: 1
      };

      mockRequest.json.mockResolvedValue(updateData);
      
      const updatedRole = {
        id: 'role-1',
        ...updateData,
        updatedAt: new Date()
      };

      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'Admin'
      });
      prisma.role.update.mockResolvedValue(updatedRole);

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should handle role not found', async () => {
      const updateData = {
        name: 'Updated Role'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.role.findUnique.mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Role not found');
    });

    it('should prevent updating system roles', async () => {
      const updateData = {
        name: 'Modified System Role'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'System Role',
        isSystem: true
      });

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot modify system role');
    });

    it('should prevent name duplication on update', async () => {
      const updateData = {
        name: 'Existing Role'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 'role-1', name: 'Admin' }) // Current role
        .mockResolvedValueOnce({ id: 'role-2', name: 'Existing Role' }); // Existing role with same name

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should update role permissions', async () => {
      const updateData = {
        permissions: ['users:view', 'content:edit']
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'Editor'
      });
      prisma.role.update.mockResolvedValue({
        id: 'role-1',
        ...updateData
      });

      const response = await PUT(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('DELETE /api/tenant/[tenantSlug]/roles/[id]', () => {
    it('should delete role successfully', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-2',
        name: 'Manager',
        isSystem: false
      });
      prisma.role.delete.mockResolvedValue({ id: 'role-2' });

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'role-2' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should prevent deletion of system roles', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'System Role',
        isSystem: true
      });

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot delete system role');
    });

    it('should prevent deletion of roles with assigned users', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'Admin',
        isSystem: false,
        userRoles: [{ user: { id: 'user-1' } }]
      });

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'role-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot delete role with assigned users');
    });

    it('should handle role not found for deletion', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: { ...mockParams, id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Role not found');
    });
  });

  describe('Role Assignment Tests', () => {
    it('should assign role to user successfully', async () => {
      const assignmentData = {
        userId: 'user-1',
        roleId: 'role-1'
      };

      mockRequest.json.mockResolvedValue(assignmentData);
      prisma.userRole.create.mockResolvedValue({
        id: 'userRole-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date()
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should prevent duplicate role assignment', async () => {
      const assignmentData = {
        userId: 'user-1',
        roleId: 'role-1'
      };

      mockRequest.json.mockResolvedValue(assignmentData);
      prisma.userRole.findUnique.mockResolvedValue({
        id: 'existing-assignment',
        userId: 'user-1',
        roleId: 'role-1'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already assigned');
    });

    it('should remove role from user successfully', async () => {
      const removalData = {
        userId: 'user-1',
        roleId: 'role-1',
        action: 'remove'
      };

      mockRequest.json.mockResolvedValue(removalData);
      prisma.userRole.delete.mockResolvedValue({
        id: 'userRole-1'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Permission Management Tests', () => {
    it('should return available permissions', async () => {
      const mockPermissions = [
        { id: 'perm-1', name: 'users:view', action: 'view', moduleKey: 'users' },
        { id: 'perm-2', name: 'users:edit', action: 'edit', moduleKey: 'users' },
        { id: 'perm-3', name: 'roles:view', action: 'view', moduleKey: 'roles' }
      ];

      prisma.permission.findMany.mockResolvedValue(mockPermissions);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/roles?include=permissions');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.permissions).toBeDefined();
    });

    it('should validate permission assignments', async () => {
      const newRole = {
        name: 'Test Role',
        permissions: ['invalid:permission']
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.permission.findMany.mockResolvedValue([]);

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
      const newRole = {
        name: 'Test Role',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.create.mockRejectedValue(new Error('Transaction failed'));

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle concurrent role creation requests', async () => {
      const newRole = {
        name: 'Concurrent Role',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        id: 'role-concurrent',
        name: 'Concurrent Role'
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

    it('should handle large permission lists efficiently', async () => {
      const largePermissionList = Array(100).fill(null).map((_, i) => ({
        id: `perm-${i}`,
        name: `module${i}:action${i}`,
        action: `action${i}`,
        moduleKey: `module${i}`
      }));

      prisma.permission.findMany.mockResolvedValue(largePermissionList);

      const newRole = {
        name: 'Large Permission Role',
        permissions: largePermissionList.map(p => p.name)
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        id: 'role-large',
        name: 'Large Permission Role'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle special characters in role names', async () => {
      const newRole = {
        name: 'Role with Special Chars & Numbers 123',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        id: 'role-special',
        name: 'Role with Special Chars & Numbers 123'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle role name case sensitivity', async () => {
      const newRole = {
        name: 'ADMIN',
        description: 'Test description'
      };

      mockRequest.json.mockResolvedValue(newRole);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        id: 'role-case',
        name: 'ADMIN'
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
}); 