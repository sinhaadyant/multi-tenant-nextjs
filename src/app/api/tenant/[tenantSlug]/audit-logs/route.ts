import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/audit-logs - Get audit logs for tenant
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check user permissions for audit logs
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              where: { moduleKey: 'audit-logs' }
            }
          }
        }
      }
    });

    const hasViewPermission = userRoles.some(userRole => 
      userRole.role.permissions.some(permission => permission.canRead)
    );

    const hasViewAllPermission = userRoles.some(userRole => 
      userRole.role.permissions.some(permission => permission.canViewAll)
    );

    if (!hasViewPermission) {
      return createErrorResponse('You do not have permission to view audit logs', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const action = url.searchParams.get('action') || '';
    const userId_filter = url.searchParams.get('userId') || '';

    // Build where clause - only show audit logs from this tenant
    const where: any = {
      tenantId: tenantId
    };

    // If user doesn't have viewAll permission, only show their own audit logs
    if (!hasViewAllPermission) {
      where.userId = userId;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { ipAddress: { contains: search } }
      ];
    }

    // Add action filter
    if (action) {
      where.action = { contains: action };
    }

    // Add user filter
    if (userId_filter) {
      where.userId = userId_filter;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch audit logs with pagination and stats
    const [logs, totalLogs] = await Promise.all([
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
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    console.log('🔍 API Debug - Found logs:', logs.length);
    console.log('🔍 API Debug - Total logs:', totalLogs);
    console.log('🔍 API Debug - Where clause:', where);

    // Calculate statistics
    const logStats = {
      total: totalLogs,
      today: await prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      thisWeek: await prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    };

    // Calculate action breakdown
    const actionBreakdown = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      },
      take: 10
    });

    const stats = {
      ...logStats,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: item._count.action
      }))
    };

    console.log('🔍 API Debug - Stats:', stats);
    console.log('🔍 API Debug - Action breakdown:', actionBreakdown);

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      status: log.status,
      severity: log.severity,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      createdAt: log.createdAt,
      user: log.user
    }));

    const responseData = {
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        hasNext: page * limit < totalLogs,
        hasPrev: page > 1
      },
      stats: stats,
      permissions: {
        canView: hasViewPermission,
        canViewAll: hasViewAllPermission,
        canExport: hasViewPermission,
        canDelete: false, // Disable delete for audit logs
        canCreate: false, // Disable create for audit logs
        canUpdate: false  // Disable update for audit logs
      }
    };

    console.log('🔍 API Debug - Final response data:', responseData);

    return createSuccessResponse(responseData, 'Audit logs retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch audit logs',
      error.status || 500
    );
  }
}); 