import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const tenantId = params.id;

      // Extract query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // Build where clause
      const where: any = {
        tenantId: tenantId
      };

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      // Add status filter
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'name') {
        orderBy.name = sortOrder;
      } else if (sortBy === 'email') {
        orderBy.email = sortOrder;
      } else if (sortBy === 'lastLogin') {
        orderBy.lastLogin = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users with pagination
      const [users, totalUsers, activeUsers, inactiveUsers] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, isActive: true } }),
        prisma.user.count({ where: { ...where, isActive: false } })
      ]);

      // Transform users to match expected format
      const transformedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.userRoles[0]?.role || null
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalUsers / limit);

      const response = {
        data: {
          users: transformedUsers,
          stats: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers
          }
        },
        meta: {
          pagination: {
            page,
            limit,
            totalPages,
            totalRecords: totalUsers
          }
        }
      };

      return createSuccessResponse(response, 'Users retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching tenant users:', error);
      return createErrorResponse('Failed to fetch users', 500);
    }
  })(req);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const tenantId = params.id;
      const body = await req.json();

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // For now, return a placeholder response
      // TODO: Implement user creation logic
      return createSuccessResponse({ message: 'User creation endpoint - to be implemented' }, 'Success');
    } catch (error: any) {
      console.error('Error creating tenant user:', error);
      return createErrorResponse('Failed to create user', 500);
    }
  })(req);
}
