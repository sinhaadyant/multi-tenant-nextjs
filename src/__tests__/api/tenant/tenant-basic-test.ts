import { NextRequest } from 'next/server';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');
jest.mock('@/lib/audit');

// Import mocked modules
const { prisma } = require('@/lib/prisma');
const { withTenantAuth } = require('@/lib/authMiddleware');
const { createSuccessResponse, createErrorResponse } = require('@/lib/apiResponse');

describe('Basic API Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Prisma responses
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
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

    // Mock withTenantAuth to return a simple handler
    withTenantAuth.mockImplementation((handler) => {
      return async (req: any, params: any) => {
        try {
          // Mock authenticated user
          req.user = {
            id: 'user-1',
            email: 'admin@techcorp.com',
            tenantId: 'tenant-1',
            roles: ['admin']
          };
          
          // Call the handler directly
          return await handler(req, params);
        } catch (error) {
          console.error('Handler error:', error);
          return createErrorResponse(error.message, 500);
        }
      };
    });
  });

  it('should handle basic GET request', async () => {
    // Mock successful Prisma response
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@techcorp.com',
        isActive: true,
        createdAt: new Date(),
        userRoles: [{ role: { name: 'Admin' } }]
      }
    ]);
    prisma.user.count.mockResolvedValue(1);
    prisma.user.aggregate.mockResolvedValue({
      _count: { id: 1 },
      _sum: { isActive: 1 }
    });

    // Create mock request
    const mockRequest = {
      url: 'http://localhost:3000/api/tenant/techcorp/users',
      headers: new Map([
        ['authorization', 'Bearer mock-token']
      ]),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/tenant/techcorp/users')
    } as any;

    const mockParams = { tenantSlug: 'techcorp' };

    // Import the GET handler directly
    const { GET } = require('@/app/api/tenant/[tenantSlug]/users/route');

    // Call the handler
    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (response.status !== 200) {
      console.error('Error response:', data);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
}); 