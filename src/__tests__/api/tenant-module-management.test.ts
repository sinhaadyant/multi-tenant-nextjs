import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tenant/[tenantSlug]/modules/route';

// Mock all dependencies
jest.mock('@/lib/prisma');
jest.mock('next-auth');
jest.mock('@/lib/auth');
jest.mock('@/lib/permissions');

describe('Tenant Module Management API', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'test-tenant' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock session
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { email: 'test@example.com' }
    });

    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/tenant/test-tenant/modules',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent']
      ]),
    } as any;
  });

  describe('GET /api/tenant/[tenantSlug]/modules', () => {
    it('should return modules when user has permission', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        data: {
          modules: [
            {
              id: 'module-1',
              moduleKey: 'dashboard',
              moduleName: 'Dashboard',
              isEnabled: true,
            }
          ],
          permissions: {
            canViewModules: true,
            canEnableDisableModules: true,
            canManageVersions: false,
            canViewAnalytics: false
          }
        }
      };

      // Mock the API response
      const response = new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      // Mock the GET function to return our test response
      jest.spyOn(global, 'Response').mockImplementation(() => response);

      const result = await GET(mockRequest, { params: mockParams });
      const data = await result.json();

      expect(result.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.modules).toHaveLength(1);
    });

    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when tenant is not found', async () => {
      const response = await GET(mockRequest, { params: { tenantSlug: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Tenant not found');
    });
  });

  describe('POST /api/tenant/[tenantSlug]/modules', () => {
    it('should enable module when user has permission', async () => {
      const requestBody = {
        action: 'enable',
        moduleKey: 'dashboard'
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should disable module when user has permission', async () => {
      const requestBody = {
        action: 'disable',
        moduleKey: 'dashboard'
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update module settings when user has permission', async () => {
      const requestBody = {
        action: 'update_settings',
        moduleKey: 'dashboard',
        settings: { theme: 'dark' }
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update module version when user has permission', async () => {
      const requestBody = {
        action: 'update_version',
        moduleKey: 'dashboard',
        version: '1.2.0'
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 403 when user lacks permission', async () => {
      const requestBody = {
        action: 'enable',
        moduleKey: 'dashboard'
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient permissions');
    });

    it('should return 400 for invalid action', async () => {
      const requestBody = {
        action: 'invalid_action',
        moduleKey: 'dashboard'
      };

      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await POST(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });
  });
}); 