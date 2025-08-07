import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse } from '@/lib/apiResponse';

// GET /api/superadmin/audit-logs - Get audit logs with filters
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Fetching audit logs');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const tenantName = searchParams.get('tenantName') || '';
  const userEmail = searchParams.get('userEmail') || '';
  const actionType = searchParams.get('actionType') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
      if (tenantName) {
      where.tenant = {
        name: { contains: tenantName }
      };
    }

    if (userEmail) {
      where.OR = [
        { user: { email: { contains: userEmail } } },
        { superAdmin: { email: { contains: userEmail } } }
      ];
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

    // Get statistics by action type
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Audit logs fetched successfully:', auditLogs.length);
    }

    return createSuccessResponse({
      auditLogs: auditLogs.map(log => {
        // Safely handle details field - just return it as is since Prisma handles JSON
        return {
          id: log.id,
          action: log.action,
          details: log.details, // Prisma already handles JSON serialization
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
    }, 'Audit logs fetched successfully', 200, {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalRecords: totalCount
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching audit logs:', error);
    }
    throw error;
  }
}); 