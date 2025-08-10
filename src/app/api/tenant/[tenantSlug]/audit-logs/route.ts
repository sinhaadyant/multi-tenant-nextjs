import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';

// GET /api/tenant/[tenantSlug]/audit-logs - Get audit logs for specific tenant
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true
      }
    });

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Note: Audit logs are already filtered by tenant, so we don't need additional permission checks
    // The user can only see logs for their own tenant

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userEmail = searchParams.get('userEmail') || '';
    const actionType = searchParams.get('actionType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause - only show logs for this tenant
    const where: any = {
      tenantId: user.tenant.id
    };
    
    if (userEmail) {
      where.user = {
        email: { contains: userEmail }
      };
    }

    if (actionType) {
      where.action = { contains: actionType };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    try {
      // Get audit logs with pagination
      const [auditLogs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            tenant: {
              select: { name: true, slug: true }
            },
            user: {
              select: { email: true, name: true }
            },
            superAdmin: {
              select: { email: true, name: true }
            }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      // Get statistics by action type for this tenant
      const actionStats = await prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          id: true
        },
        where: {
          tenantId: user.tenant.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Tenant audit logs fetched successfully:', auditLogs.length);
      }

      return createSuccessResponse({
        auditLogs: auditLogs.map(log => {
          return {
            id: log.id,
            action: log.action,
            details: log.details,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
            tenant: log.tenant ? {
              id: log.tenantId,
              name: log.tenant.name,
              slug: log.tenant.slug
            } : null,
            user: log.user ? {
              id: log.userId,
              email: log.user.email,
              name: log.user.name
            } : null,
            superAdmin: log.superAdmin ? {
              id: log.superAdminId,
              email: log.superAdmin.email,
              name: log.superAdmin.name
            } : null
          };
        }),
        stats: {
          total: totalCount,
          actionBreakdown: actionStats.map(stat => ({
            action: stat.action,
            count: stat._count.id
          }))
        }
      }, 'Tenant audit logs fetched successfully', 200, {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error fetching tenant audit logs:', error);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error fetching tenant audit logs:', error);
    return createErrorResponse('Failed to fetch tenant audit logs', 500);
  }
}); 