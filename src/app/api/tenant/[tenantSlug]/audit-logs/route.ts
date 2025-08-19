import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';

// GET /api/tenant/[tenantSlug]/audit-logs - Get audit logs with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId, 'audit.view');
    const hasViewAllPermission = await checkTenantPermission(req.user!, tenantId, 'audit.viewAll');

    if (!hasViewPermission && !hasViewAllPermission) {
      return createErrorResponse('Insufficient permissions to view audit logs', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const action = url.searchParams.get('action') || '';
    const resource = url.searchParams.get('resource') || '';
    const userId_filter = url.searchParams.get('userId') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const severity = url.searchParams.get('severity') || '';

    // Build where clause
    const where: any = {
      tenantId: tenantId
    };

    // If user doesn't have viewAll permission, only show their own logs
    if (!hasViewAllPermission) {
      where.userId = userId;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { userAgent: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add action filter
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    // Add resource filter
    if (resource) {
      where.resource = { contains: resource, mode: 'insensitive' };
    }

    // Add user filter
    if (userId_filter) {
      where.userId = userId_filter;
    }

    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Add severity filter
    if (severity) {
      where.severity = severity;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch audit logs with pagination and stats
    const [auditLogs, totalLogs, stats] = await Promise.all([
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
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        where: { tenantId },
        _count: { severity: true }
      })
    ]);

    // Calculate statistics
    const auditStats = {
      total: totalLogs,
      info: stats.find(s => s.severity === 'info')?._count.severity || 0,
      warning: stats.find(s => s.severity === 'warning')?._count.severity || 0,
      error: stats.find(s => s.severity === 'error')?._count.severity || 0,
      critical: stats.find(s => s.severity === 'critical')?._count.severity || 0
    };

    // Get recent activity summary
    const recentActivity = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { 
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 5
    });

    // Format response
    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      resource: log.resource,
      resourceId: log.resourceId,
      severity: log.severity,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: log.user ? {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email
      } : null
    }));

    return createSuccessResponse({
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        hasNext: page * limit < totalLogs,
        hasPrev: page > 1
      },
      stats: auditStats,
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        count: activity._count.action
      })),
      permissions: {
        canView: hasViewPermission,
        canViewAll: hasViewAllPermission,
        canExport: await checkTenantPermission(req.user!, tenantId, 'audit.export')
      }
    }, 'Audit logs retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch audit logs',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/audit-logs - Create audit log (for testing or manual logging)
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check create permission
    const hasCreatePermission = await checkTenantPermission(req.user!, tenantId, 'audit.create');
    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create audit logs', 403);
    }

    const body = await req.json();
    const { action, details, resource, resourceId, severity = 'info' } = body;

    // Validate required fields
    if (!action || !details) {
      return createErrorResponse('Action and details are required', 400);
    }

    // Create audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: userId,
        tenantId: tenantId,
        action: action,
        details: details,
        resource: resource || null,
        resourceId: resourceId || null,
        severity: severity,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return createSuccessResponse({
      auditLog: {
        id: auditLog.id,
        action: auditLog.action,
        details: auditLog.details,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        severity: auditLog.severity,
        createdAt: auditLog.createdAt,
        user: auditLog.user
      }
    }, 'Audit log created successfully');

  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return createErrorResponse(
      error.message || 'Failed to create audit log',
      error.status || 500
    );
  }
}); 