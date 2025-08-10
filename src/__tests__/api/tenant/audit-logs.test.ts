import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenant/[tenantSlug]/audit-logs/route';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogFromRequest: jest.fn(),
}));

jest.mock('@/lib/auditRetention', () => ({
  getAuditLogStats: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCreateAuditLog = createAuditLogFromRequest as jest.MockedFunction<typeof createAuditLogFromRequest>;

describe('Tenant Audit Logs API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as const,
    tenantId: 'tenant-123',
  };

  const mockRequest = {
    url: 'http://localhost:3000/api/tenant/test-tenant/audit-logs',
    headers: new Map([
      ['x-forwarded-for', '192.168.1.1'],
      ['user-agent', 'Mozilla/5.0 Test Browser'],
    ]),
  } as unknown as NextRequest;

  const mockParams = Promise.resolve({ tenantSlug: 'test-tenant' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAuditLog.mockResolvedValue();
  });

  describe('GET /api/tenant/[tenantSlug]/audit-logs', () => {
    it('should fetch audit logs with basic parameters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'user.login',
          details: '{"email": "user@example.com", "success": true}',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          status: 'success',
          severity: 'info',
          resourceType: 'user',
          resourceId: 'user-123',
          oldValues: null,
          newValues: null,
          sessionId: 'session-123',
          requestId: 'request-123',
          isArchived: false,
          archivedAt: null,
          retentionExpiry: new Date('2025-01-01T10:00:00Z'),
          tenantId: 'tenant-123',
          userId: 'user-123',
          superAdminId: null,
          tenant: {
            name: 'Test Tenant',
            slug: 'test-tenant',
          },
          user: {
            email: 'user@example.com',
            name: 'Test User',
          },
          superAdmin: null,
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 1,
        archived: 0,
        expired: 0,
        bySeverity: { info: 1 },
        byStatus: { success: 1 },
        actionBreakdown: [{ action: 'user.login', count: 1 }],
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.auditLogs).toHaveLength(1);
      expect(data.data.auditLogs[0].action).toBe('user.login');
      expect(data.data.pagination.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(100);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 100,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '25');
      const paginatedRequest = { ...mockRequest, url: url.toString() };

      const response = await GET(paginatedRequest, { params: mockParams });
      const data = await response.json();

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        })
      );
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.totalPages).toBe(4);
    });

    it('should filter by user email', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('userEmail', 'test@example.com');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: {
              email: { contains: 'test@example.com', mode: 'insensitive' },
            },
          }),
        })
      );
    });

    it('should filter by action type', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('actionType', 'login');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { contains: 'login', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('status', 'failure');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'failure',
          }),
        })
      );
    });

    it('should filter by severity', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('severity', 'critical');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: 'critical',
          }),
        })
      );
    });

    it('should filter by resource type', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('resourceType', 'user');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType: 'user',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('startDate', '2024-01-01');
      url.searchParams.set('endDate', '2024-01-31');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31T23:59:59.999Z'),
            },
          }),
        })
      );
    });

    it('should include archived logs when requested', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('includeArchived', 'true');
      const filteredRequest = { ...mockRequest, url: url.toString() };

      await GET(filteredRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            isArchived: false,
          }),
        })
      );
    });

    it('should exclude archived logs by default', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      await GET(mockRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        })
      );
    });

    it('should sort by different fields', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('sortBy', 'action');
      url.searchParams.set('sortOrder', 'asc');
      const sortedRequest = { ...mockRequest, url: url.toString() };

      await GET(sortedRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            action: 'asc',
          },
        })
      );
    });

    it('should handle invalid sort parameters gracefully', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const url = new URL(mockRequest.url);
      url.searchParams.set('sortBy', 'invalid_field');
      url.searchParams.set('sortOrder', 'invalid_order');
      const invalidRequest = { ...mockRequest, url: url.toString() };

      await GET(invalidRequest, { params: mockParams });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch audit logs');
    });

    it('should create audit log for viewing action', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 0,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      await GET(mockRequest, { params: mockParams });

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          role: 'user',
        }),
        'audit.view',
        expect.objectContaining({
          tenantId: 'tenant-123',
          logsCount: 0,
          filters: expect.any(Object),
        })
      );
    });

    it('should return enhanced statistics', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(100);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 100,
        archived: 10,
        expired: 5,
        bySeverity: { info: 50, warning: 30, error: 15, critical: 5 },
        byStatus: { success: 80, failure: 15, warning: 5 },
        actionBreakdown: [
          { action: 'user.login', count: 30 },
          { action: 'user.update', count: 20 },
        ],
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(data.data.stats).toEqual({
        total: 100,
        archived: 10,
        expired: 5,
        bySeverity: { info: 50, warning: 30, error: 15, critical: 5 },
        byStatus: { success: 80, failure: 15, warning: 5 },
        actionBreakdown: [
          { action: 'user.login', count: 30 },
          { action: 'user.update', count: 20 },
        ],
      });
    });

    it('should transform audit log data correctly', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'user.login',
          details: '{"email": "user@example.com"}',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          status: 'success',
          severity: 'info',
          resourceType: 'user',
          resourceId: 'user-123',
          oldValues: null,
          newValues: null,
          sessionId: 'session-123',
          requestId: 'request-123',
          isArchived: false,
          archivedAt: null,
          retentionExpiry: new Date('2025-01-01T10:00:00Z'),
          tenantId: 'tenant-123',
          userId: 'user-123',
          superAdminId: null,
          tenant: {
            name: 'Test Tenant',
            slug: 'test-tenant',
          },
          user: {
            email: 'user@example.com',
            name: 'Test User',
          },
          superAdmin: null,
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const { getAuditLogStats } = require('@/lib/auditRetention');
      getAuditLogStats.mockResolvedValue({
        total: 1,
        archived: 0,
        expired: 0,
        bySeverity: {},
        byStatus: {},
        actionBreakdown: [],
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      const transformedLog = data.data.auditLogs[0];
      expect(transformedLog.id).toBe('log-1');
      expect(transformedLog.action).toBe('user.login');
      expect(transformedLog.status).toBe('success');
      expect(transformedLog.severity).toBe('info');
      expect(transformedLog.resourceType).toBe('user');
      expect(transformedLog.resourceId).toBe('user-123');
      expect(transformedLog.sessionId).toBe('session-123');
      expect(transformedLog.requestId).toBe('request-123');
      expect(transformedLog.isArchived).toBe(false);
      expect(transformedLog.createdAt).toBe('2024-01-01T10:00:00.000Z');
      expect(transformedLog.retentionExpiry).toBe('2025-01-01T10:00:00.000Z');
      expect(transformedLog.tenant).toEqual({
        id: 'tenant-123',
        name: 'Test Tenant',
        slug: 'test-tenant',
      });
      expect(transformedLog.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      });
    });
  });
}); 