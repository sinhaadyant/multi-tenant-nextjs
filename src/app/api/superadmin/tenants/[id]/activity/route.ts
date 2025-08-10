import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/tenants/[id]/activity - Get tenant activity logs
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Fetching tenant activity logs:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  try {
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!tenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', params.id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Build where clause
    const where: any = { tenantId: params.id };
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (action) {
      where.action = action;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get activity logs with pagination and statistics in parallel
    const [auditLogs, totalCount, stats] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { tenantId: params.id },
        _count: { id: true }
      })
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Tenant activity logs fetched successfully: ${auditLogs.length} logs found`);
    }

    return createSuccessResponse({
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email
        } : null,
        superAdmin: log.superAdmin ? {
          id: log.superAdmin.id,
          name: log.superAdmin.name,
          email: log.superAdmin.email
        } : null
      })),
      stats: {
        total: totalCount,
        actionBreakdown: stats.reduce((acc, stat) => {
          acc[stat.action] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount
      }
    }, 'Tenant activity logs fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching tenant activity logs:', error);
    }
    throw error;
  }
}); 