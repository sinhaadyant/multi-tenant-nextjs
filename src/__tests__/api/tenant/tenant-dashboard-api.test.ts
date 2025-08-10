import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenant/[tenantSlug]/dashboard/route';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');
jest.mock('@/lib/audit');

// Import mocked modules
const { prisma } = require('@/lib/prisma');
const { withTenantAuth } = require('@/lib/authMiddleware');
const { createSuccessResponse, createErrorResponse } = require('@/lib/apiResponse');

describe('Tenant Dashboard API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/dashboard',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/dashboard')
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
    prisma.user.count.mockResolvedValue(0);
    prisma.role.count.mockResolvedValue(0);
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.supportTicket.count.mockResolvedValue(0);
    prisma.notification.count.mockResolvedValue(0);
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

  describe('GET /api/tenant/[tenantSlug]/dashboard', () => {
    it('should return dashboard statistics', async () => {
      // Mock statistics data
      prisma.user.count.mockResolvedValue(25);
      prisma.role.count.mockResolvedValue(5);
      prisma.auditLog.count.mockResolvedValue(150);
      prisma.supportTicket.count.mockResolvedValue(8);
      prisma.notification.count.mockResolvedValue(12);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats).toBeDefined();
      expect(data.data.stats.totalUsers).toBe(25);
      expect(data.data.stats.totalRoles).toBe(5);
      expect(data.data.stats.totalAuditLogs).toBe(150);
      expect(data.data.stats.totalSupportTickets).toBe(8);
      expect(data.data.stats.totalNotifications).toBe(12);
    });

    it('should return recent activity data', async () => {
      const mockRecentActivity = [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          description: 'User logged in successfully',
          createdAt: new Date(),
          user: { name: 'Admin User', email: 'admin@techcorp.com' }
        },
        {
          id: 'audit-2',
          action: 'USER_CREATED',
          description: 'New user created',
          createdAt: new Date(),
          user: { name: 'Manager User', email: 'manager@techcorp.com' }
        }
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockRecentActivity);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.recentActivity).toBeDefined();
      expect(data.data.recentActivity).toHaveLength(2);
    });

    it('should return user activity chart data', async () => {
      const mockUserActivity = [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 12 }
      ];

      // Mock raw data that would be processed into chart format
      prisma.auditLog.groupBy.mockResolvedValue([
        { date: '2024-01-01', _count: { id: 5 } },
        { date: '2024-01-02', _count: { id: 8 } },
        { date: '2024-01-03', _count: { id: 12 } }
      ]);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.charts).toBeDefined();
      expect(data.data.charts.userActivity).toBeDefined();
    });

    it('should return role distribution data', async () => {
      const mockRoleDistribution = [
        { role: 'Admin', count: 3 },
        { role: 'Manager', count: 5 },
        { role: 'User', count: 17 }
      ];

      prisma.userRole.groupBy.mockResolvedValue([
        { role: { name: 'Admin' }, _count: { userId: 3 } },
        { role: { name: 'Manager' }, _count: { userId: 5 } },
        { role: { name: 'User' }, _count: { userId: 17 } }
      ]);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.charts).toBeDefined();
      expect(data.data.charts.roleDistribution).toBeDefined();
    });

    it('should return system health metrics', async () => {
      const mockSystemHealth = {
        databaseConnections: 15,
        activeSessions: 8,
        cpuUsage: 45,
        memoryUsage: 60,
        uptime: 99.9
      };

      // Mock system health data
      prisma.user.count.mockResolvedValue(25);
      prisma.auditLog.count.mockResolvedValue(150);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.systemHealth).toBeDefined();
    });

    it('should return top users by activity', async () => {
      const mockTopUsers = [
        {
          id: 'user-1',
          name: 'Admin User',
          email: 'admin@techcorp.com',
          activityCount: 45
        },
        {
          id: 'user-2',
          name: 'Manager User',
          email: 'manager@techcorp.com',
          activityCount: 32
        }
      ];

      prisma.auditLog.groupBy.mockResolvedValue([
        { userId: 'user-1', user: { name: 'Admin User', email: 'admin@techcorp.com' }, _count: { id: 45 } },
        { userId: 'user-2', user: { name: 'Manager User', email: 'manager@techcorp.com' }, _count: { id: 32 } }
      ]);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topUsers).toBeDefined();
      expect(data.data.topUsers).toHaveLength(2);
    });

    it('should handle date range filters', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard?startDate=2024-01-01&endDate=2024-01-31');
      
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

    it('should return empty data when no activity exists', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.role.count.mockResolvedValue(0);
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.totalUsers).toBe(0);
      expect(data.data.recentActivity).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      prisma.user.count.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Dashboard Stats Endpoint', () => {
    it('should return detailed statistics', async () => {
      // Mock detailed stats
      prisma.user.count.mockResolvedValue(25);
      prisma.user.count.mockResolvedValueOnce(20); // Active users
      prisma.role.count.mockResolvedValue(5);
      prisma.auditLog.count.mockResolvedValue(150);
      prisma.supportTicket.count.mockResolvedValue(8);
      prisma.supportTicket.count.mockResolvedValueOnce(3); // Open tickets
      prisma.notification.count.mockResolvedValue(12);
      prisma.notification.count.mockResolvedValueOnce(5); // Unread notifications

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/stats');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats).toBeDefined();
      expect(data.data.stats.activeUsers).toBe(20);
      expect(data.data.stats.openTickets).toBe(3);
      expect(data.data.stats.unreadNotifications).toBe(5);
    });

    it('should return growth metrics', async () => {
      // Mock growth data
      const mockGrowthData = {
        userGrowth: 15,
        activityGrowth: 25,
        ticketGrowth: -5
      };

      // Mock previous period data for growth calculation
      prisma.user.count.mockResolvedValue(25);
      prisma.auditLog.count.mockResolvedValue(150);
      prisma.supportTicket.count.mockResolvedValue(8);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.growth).toBeDefined();
    });
  });

  describe('Dashboard Charts Endpoint', () => {
    it('should return user activity chart data', async () => {
      const mockChartData = [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 12 }
      ];

      prisma.auditLog.groupBy.mockResolvedValue([
        { date: '2024-01-01', _count: { id: 5 } },
        { date: '2024-01-02', _count: { id: 8 } },
        { date: '2024-01-03', _count: { id: 12 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/charts?type=userActivity');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chartData).toBeDefined();
    });

    it('should return role distribution chart data', async () => {
      const mockRoleData = [
        { role: 'Admin', count: 3 },
        { role: 'Manager', count: 5 },
        { role: 'User', count: 17 }
      ];

      prisma.userRole.groupBy.mockResolvedValue([
        { role: { name: 'Admin' }, _count: { userId: 3 } },
        { role: { name: 'Manager' }, _count: { userId: 5 } },
        { role: { name: 'User' }, _count: { userId: 17 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/charts?type=roleDistribution');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chartData).toBeDefined();
    });

    it('should return support ticket status chart data', async () => {
      const mockTicketData = [
        { status: 'open', count: 3 },
        { status: 'in_progress', count: 2 },
        { status: 'resolved', count: 8 }
      ];

      prisma.supportTicket.groupBy.mockResolvedValue([
        { status: 'open', _count: { id: 3 } },
        { status: 'in_progress', _count: { id: 2 } },
        { status: 'resolved', _count: { id: 8 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/charts?type=ticketStatus');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chartData).toBeDefined();
    });
  });

  describe('Dashboard Analytics Endpoint', () => {
    it('should return performance analytics', async () => {
      const mockAnalytics = {
        averageResponseTime: 250,
        systemUptime: 99.9,
        errorRate: 0.1,
        activeUsers: 15
      };

      // Mock analytics data
      prisma.auditLog.count.mockResolvedValue(150);
      prisma.user.count.mockResolvedValue(25);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/analytics');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.analytics).toBeDefined();
    });

    it('should return trend analysis', async () => {
      const mockTrends = {
        userGrowth: 15,
        activityGrowth: 25,
        ticketGrowth: -5,
        performanceTrend: 'improving'
      };

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard/analytics?include=trends');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trends).toBeDefined();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle invalid date ranges', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard?startDate=invalid&endDate=invalid');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle very large date ranges', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard?startDate=2020-01-01&endDate=2024-12-31');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle database timeout gracefully', async () => {
      prisma.user.count.mockRejectedValue(new Error('Query timeout'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle concurrent dashboard requests', async () => {
      // Simulate concurrent requests
      const promises = Array(5).fill(null).map(() => 
        GET(mockRequest, { params: mockParams })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle missing chart data gracefully', async () => {
      prisma.auditLog.groupBy.mockResolvedValue([]);
      prisma.userRole.groupBy.mockResolvedValue([]);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.charts).toBeDefined();
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      prisma.user.count.mockResolvedValue(10000);
      prisma.auditLog.count.mockResolvedValue(100000);
      prisma.auditLog.findMany.mockResolvedValue(Array(100).fill(null).map((_, i) => ({
        id: `audit-${i}`,
        action: 'USER_LOGIN',
        createdAt: new Date(),
        user: { name: `User ${i}`, email: `user${i}@techcorp.com` }
      })));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.totalUsers).toBe(10000);
    });

    it('should handle timezone differences', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/dashboard?timezone=UTC');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should deny access to users without dashboard permissions', async () => {
      // Mock user without dashboard permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-2',
            email: 'viewer@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['viewer'],
            permissions: [] // No dashboard permissions
          };
          return handler(req, params);
        };
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should allow access to users with dashboard permissions', async () => {
      // Mock user with dashboard permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-1',
            email: 'admin@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['admin'],
            permissions: ['dashboard:view'] // Has dashboard permission
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