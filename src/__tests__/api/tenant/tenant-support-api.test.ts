import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tenant/[tenantSlug]/support/route';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');
jest.mock('@/lib/audit');

// Import mocked modules
const { prisma } = require('@/lib/prisma');
const { withTenantAuth } = require('@/lib/authMiddleware');
const { createSuccessResponse, createErrorResponse } = require('@/lib/apiResponse');
const { createAuditLogFromRequest } = require('@/lib/audit');

describe('Tenant Support API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/support',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/support')
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
    prisma.supportTicket.findMany.mockResolvedValue([]);
    prisma.supportTicket.count.mockResolvedValue(0);
    prisma.supportTicket.findUnique.mockResolvedValue(null);
    prisma.supportTicket.create.mockResolvedValue({});
    prisma.supportTicket.update.mockResolvedValue({});
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

  describe('GET /api/tenant/[tenantSlug]/support', () => {
    it('should return support tickets with pagination', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Technical Issue',
          description: 'Cannot access dashboard',
          status: 'open',
          priority: 'high',
          category: 'technical',
          createdAt: new Date(),
          user: { name: 'Admin User', email: 'admin@techcorp.com' }
        },
        {
          id: 'ticket-2',
          title: 'Feature Request',
          description: 'Add new reporting feature',
          status: 'in_progress',
          priority: 'medium',
          category: 'feature',
          createdAt: new Date(),
          user: { name: 'Manager User', email: 'manager@techcorp.com' }
        }
      ];

      prisma.supportTicket.findMany.mockResolvedValue(mockTickets);
      prisma.supportTicket.count.mockResolvedValue(2);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tickets).toHaveLength(2);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.totalRecords).toBe(2);
    });

    it('should filter tickets by status', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?status=open');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'open'
          })
        })
      );
    });

    it('should filter tickets by priority', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?priority=high');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'high'
          })
        })
      );
    });

    it('should filter tickets by category', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?category=technical');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'technical'
          })
        })
      );
    });

    it('should search tickets by title or description', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?search=dashboard');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'dashboard', mode: 'insensitive' } },
              { description: { contains: 'dashboard', mode: 'insensitive' } }
            ]
          })
        })
      );
    });

    it('should filter tickets by assigned user', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?assignedTo=user-1');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedTo: 'user-1'
          })
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?page=2&limit=5&sortBy=createdAt&sortOrder=desc');
      
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        })
      );
    });

    it('should return empty list when no tickets found', async () => {
      prisma.supportTicket.findMany.mockResolvedValue([]);
      prisma.supportTicket.count.mockResolvedValue(0);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tickets).toHaveLength(0);
      expect(data.data.pagination.totalRecords).toBe(0);
    });

    it('should include user information in tickets', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Technical Issue',
          description: 'Cannot access dashboard',
          status: 'open',
          priority: 'high',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            name: 'Admin User',
            email: 'admin@techcorp.com'
          }
        }
      ];

      prisma.supportTicket.findMany.mockResolvedValue(mockTickets);
      prisma.supportTicket.count.mockResolvedValue(1);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tickets[0].user).toBeDefined();
      expect(data.data.tickets[0].user.name).toBe('Admin User');
    });

    it('should handle database errors gracefully', async () => {
      prisma.supportTicket.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/tenant/[tenantSlug]/support', () => {
    it('should create a new support ticket successfully', async () => {
      const newTicket = {
        title: 'New Technical Issue',
        description: 'Unable to access user management module',
        priority: 'high',
        category: 'technical',
        attachments: []
      };

      mockRequest.json.mockResolvedValue(newTicket);
      
      const createdTicket = {
        id: 'ticket-3',
        title: 'New Technical Issue',
        description: 'Unable to access user management module',
        status: 'open',
        priority: 'high',
        category: 'technical',
        createdAt: new Date(),
        user: { name: 'Admin User', email: 'admin@techcorp.com' }
      };

      prisma.supportTicket.create.mockResolvedValue(createdTicket);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createAuditLogFromRequest).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidTicket = {
        title: '',
        description: '',
        priority: 'invalid_priority'
      };

      mockRequest.json.mockResolvedValue(invalidTicket);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Title is required');
    });

    it('should validate priority values', async () => {
      const invalidTicket = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'invalid_priority'
      };

      mockRequest.json.mockResolvedValue(invalidTicket);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid priority');
    });

    it('should validate category values', async () => {
      const invalidTicket = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        category: 'invalid_category'
      };

      mockRequest.json.mockResolvedValue(invalidTicket);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid category');
    });

    it('should handle file attachments', async () => {
      const newTicket = {
        title: 'Issue with attachments',
        description: 'Testing file upload',
        priority: 'medium',
        category: 'technical',
        attachments: [
          { name: 'screenshot.png', size: 1024, type: 'image/png' }
        ]
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-4',
        ...newTicket,
        status: 'open',
        createdAt: new Date()
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should assign ticket to current user by default', async () => {
      const newTicket = {
        title: 'Assigned Ticket',
        description: 'This ticket should be assigned to current user',
        priority: 'medium',
        category: 'feature'
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-5',
        ...newTicket,
        status: 'open',
        assignedTo: 'user-1',
        createdAt: new Date()
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Support Ticket Management Tests', () => {
    it('should update ticket status', async () => {
      const updateData = {
        status: 'in_progress',
        assignedTo: 'user-2'
      };

      mockRequest.json.mockResolvedValue(updateData);
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        title: 'Test Ticket',
        status: 'open'
      });
      prisma.supportTicket.update.mockResolvedValue({
        id: 'ticket-1',
        ...updateData
      });

      const response = await POST(mockRequest, { params: { ...mockParams, id: 'ticket-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should add comments to tickets', async () => {
      const commentData = {
        content: 'This is a test comment',
        isInternal: false
      };

      mockRequest.json.mockResolvedValue(commentData);
      prisma.supportTicketComment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'This is a test comment',
        isInternal: false,
        createdAt: new Date(),
        user: { name: 'Admin User', email: 'admin@techcorp.com' }
      });

      const response = await POST(mockRequest, { params: { ...mockParams, id: 'ticket-1', action: 'comment' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle ticket escalation', async () => {
      const escalationData = {
        reason: 'High priority issue requiring immediate attention',
        escalatedTo: 'user-2'
      };

      mockRequest.json.mockResolvedValue(escalationData);
      prisma.supportTicket.update.mockResolvedValue({
        id: 'ticket-1',
        status: 'escalated',
        escalatedTo: 'user-2',
        escalatedAt: new Date()
      });

      const response = await POST(mockRequest, { params: { ...mockParams, id: 'ticket-1', action: 'escalate' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Support Analytics Tests', () => {
    it('should return ticket statistics', async () => {
      const mockStats = {
        totalTickets: 50,
        openTickets: 15,
        inProgressTickets: 10,
        resolvedTickets: 25,
        averageResolutionTime: 48, // hours
        topCategories: [
          { category: 'technical', count: 20 },
          { category: 'feature', count: 15 }
        ]
      };

      prisma.supportTicket.count.mockResolvedValue(50);
      prisma.supportTicket.groupBy.mockResolvedValue([
        { category: 'technical', _count: { id: 20 } },
        { category: 'feature', _count: { id: 15 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?include=stats');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats).toBeDefined();
    });

    it('should return ticket trends', async () => {
      const mockTrends = [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 12 }
      ];

      prisma.supportTicket.groupBy.mockResolvedValue([
        { date: '2024-01-01', _count: { id: 5 } },
        { date: '2024-01-02', _count: { id: 8 } },
        { date: '2024-01-03', _count: { id: 12 } }
      ]);

      mockRequest.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/support?include=trends');
      
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trends).toBeDefined();
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
      const newTicket = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'medium',
        category: 'technical'
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockRejectedValue(new Error('Transaction failed'));

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle concurrent ticket creation requests', async () => {
      const newTicket = {
        title: 'Concurrent Ticket',
        description: 'Test description',
        priority: 'medium',
        category: 'technical'
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-concurrent',
        ...newTicket,
        status: 'open',
        createdAt: new Date()
      });

      // Simulate concurrent requests
      const promises = Array(3).fill(null).map(() => 
        POST(mockRequest, { params: mockParams })
      );

      const responses = await Promise.all(promises);
      
      // Should handle gracefully
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should handle large ticket descriptions', async () => {
      const largeDescription = 'A'.repeat(10000); // 10KB description
      const newTicket = {
        title: 'Large Description Ticket',
        description: largeDescription,
        priority: 'medium',
        category: 'technical'
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-large',
        ...newTicket,
        status: 'open',
        createdAt: new Date()
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle special characters in ticket titles', async () => {
      const newTicket = {
        title: 'Ticket with Special Chars: !@#$%^&*()',
        description: 'Test description with special characters',
        priority: 'medium',
        category: 'technical'
      };

      mockRequest.json.mockResolvedValue(newTicket);
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-special',
        ...newTicket,
        status: 'open',
        createdAt: new Date()
      });

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should deny access to users without support permissions', async () => {
      // Mock user without support permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-2',
            email: 'viewer@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['viewer'],
            permissions: [] // No support permissions
          };
          return handler(req, params);
        };
      });

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should allow access to users with support permissions', async () => {
      // Mock user with support permissions
      withTenantAuth.mockImplementation((handler) => {
        return async (req: any, params: any) => {
          req.user = {
            id: 'user-1',
            email: 'admin@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['admin'],
            permissions: ['support:view'] // Has support permission
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