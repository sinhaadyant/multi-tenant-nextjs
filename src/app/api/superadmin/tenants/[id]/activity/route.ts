import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const { id: tenantId } = await params;

      // Extract query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const action = searchParams.get('action') || '';
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
          { action: { contains: search } },
          { details: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } }
        ];
      }

      // Add action filter
      if (action) {
        where.action = { contains: action };
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'action') {
        orderBy.action = sortOrder;
      } else if (sortBy === 'user') {
        orderBy.user = { name: sortOrder };
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get audit logs with pagination
      const [auditLogs, totalLogs] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            action: true,
            details: true,
            ipAddress: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalLogs / limit);

      const response = {
        data: {
          auditLogs
        },
        meta: {
          pagination: {
            page,
            limit,
            totalPages,
            totalRecords: totalLogs
          }
        }
      };

      return createSuccessResponse(response, 'Activity logs retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching tenant activity logs:', error);
      return createErrorResponse('Failed to fetch activity logs', 500);
    }
  })(req);
}

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
