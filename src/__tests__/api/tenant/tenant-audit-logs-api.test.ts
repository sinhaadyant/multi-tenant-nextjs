import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenant/[tenantSlug]/audit-logs/route';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');
jest.mock('@/lib/audit');

// Import mocked modules
const { prisma } = require('@/lib/prisma');
const { withTenantAuth } = require('@/lib/authMiddleware');
const { createSuccessResponse, createErrorResponse } = require('@/lib/apiResponse');

describe('Tenant Audit Logs API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/audit-logs',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/audit-logs')
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
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
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

  describe('GET /api/tenant/[tenantSlug]/audit-logs', () => {
    it('should return audit logs with pagination', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          description: 'User logged in successfully',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-1',
          tenantId: 'tenant-1',
          createdAt: new Date(),
          user: { name: 'Admin User', email: 'admin@techcorp.com' }
        },
        {
          id: 'audit-2',
          action: 'USER_CREATED',
          description: 'New user created',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-2',
          tenantId: 'tenant-1',
          createdAt: new Date(),
          user: { name: 'Manager User', email: 'manager@techcorp.com' }
        }
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      prisma.auditLog.count.mockResolvedValue(2);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.auditLogs).toHaveLength(2);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.totalRecords).toBe(2);
    });

    it('should filter audit logs by action type', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?action=USER_LOGIN');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'USER_LOGIN'
          })
        })
      );
    });

    it('should filter audit logs by date range', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?startDate=2024-01-01&endDate=2024-01-31');
      
      const response = await GET(mockRequest, { params: mockParams });
      
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

    it('should filter audit logs by user', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?userId=user-1');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1'
          })
        })
      );
    });

    it('should filter audit logs by IP address', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?ipAddress=192.168.1.1');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ipAddress: '192.168.1.1'
          })
        })
      );
    });

    it('should search audit logs by description', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?search=login');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: {
              contains: 'login',
              mode: 'insensitive'
            }
          })
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?page=2&limit=5&sortBy=createdAt&sortOrder=desc');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        })
      );
    });

    it('should return empty list when no audit logs found', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.auditLogs).toHaveLength(0);
      expect(data.data.pagination.totalRecords).toBe(0);
    });

    it('should include user information in audit logs', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          description: 'User logged in',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            name: 'Admin User',
            email: 'admin@techcorp.com'
          }
        }
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      prisma.auditLog.count.mockResolvedValue(1);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.auditLogs[0].user).toBeDefined();
      expect(data.data.auditLogs[0].user.name).toBe('Admin User');
    });

    it('should handle database errors gracefully', async () => {
      prisma.auditLog.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Audit Log Export Tests', () => {
    it('should export audit logs as CSV', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          description: 'User logged in',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          user: { name: 'Admin User', email: 'admin@techcorp.com' }
        }
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?export=csv');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.exportUrl).toBeDefined();
    });

    it('should export audit logs as JSON', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?export=json');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.exportUrl).toBeDefined();
    });
  });

  describe('Audit Log Analytics Tests', () => {
    it('should return audit log statistics', async () => {
      const mockStats = {
        totalLogs: 150,
        todayLogs: 25,
        thisWeekLogs: 75,
        thisMonthLogs: 150,
        topActions: [
          { action: 'USER_LOGIN', count: 50 },
          { action: 'USER_CREATED', count: 30 }
        ]
      };

      prisma.auditLog.count.mockResolvedValue(150);
      prisma.auditLog.groupBy.mockResolvedValue([
        { action: 'USER_LOGIN', _count: { id: 50 } },
        { action: 'USER_CREATED', _count: { id: 30 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?include=stats');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats).toBeDefined();
    });

    it('should return activity trends', async () => {
      const mockTrends = [
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 15 },
        { date: '2024-01-03', count: 20 }
      ];

      prisma.auditLog.groupBy.mockResolvedValue([
        { date: '2024-01-01', _count: { id: 10 } },
        { date: '2024-01-02', _count: { id: 15 } },
        { date: '2024-01-03', _count: { id: 20 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?include=trends');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trends).toBeDefined();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle invalid date formats', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?startDate=invalid&endDate=invalid');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle very large date ranges', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/audit-logs?startDate=2020-01-01&endDate=2024-12-31');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle large datasets efficiently', async () => {
      const largeAuditLogList = Array(1000).fill(null).map((_, i) => ({
        id: `audit-${i}`,
        action: 'USER_LOGIN',
        description: `Login attempt ${i}`,
        ipAddress: '192.168.1.1',
        createdAt: new Date(),
        user: { name: `User ${i}`, email: `user${i}@techcorp.com` }
      }));

      prisma.auditLog.findMany.mockResolvedValue(largeAuditLogList);
      prisma.auditLog.count.mockResolvedValue(1000);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.auditLogs).toHaveLength(1000);
    });

    it('should handle concurrent requests', async () => {
      // Simulate concurrent requests
      const promises = Array(5).fill(null).map(() => 
        GET(mockRequest, { params: mockParams })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle database timeout gracefully', async () => {
      prisma.auditLog.findMany.mockRejectedValue(new Error('Query timeout'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should deny access to users without audit log permissions', async () => {
      // Mock user without audit log permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-2',
            email: 'viewer@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['viewer'],
            permissions: [] // No audit log permissions
          };
          return handler(req, params);
        };
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should allow access to users with audit log permissions', async () => {
      // Mock user with audit log permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-1',
            email: 'admin@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['admin'],
            permissions: ['audit:view'] // Has audit log permission
          };
          return handler(req, params);
        };
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
}); 