import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createAuditLogFromRequest } from '@/lib/audit';
import { getAuditLogStats } from '@/lib/auditRetention';

// GET /api/tenant/[tenantSlug]/audit-logs - Get audit logs for specific tenant
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userEmail = searchParams.get('userEmail') || '';
    const actionType = searchParams.get('actionType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || '';
    const severity = searchParams.get('severity') || '';
    const resourceType = searchParams.get('resourceType') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause - only show logs for this tenant
    const where: any = {
      tenantId: tenantId
    };
    
    if (!includeArchived) {
      where.isArchived = false;
    }
    
    if (userEmail) {
      where.user = {
        email: { contains: userEmail, mode: 'insensitive' }
      };
    }

    if (actionType) {
      where.action = { contains: actionType, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (resourceType) {
      where.resourceType = resourceType;
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

    // Validate sort parameters
    const validSortFields = ['createdAt', 'action', 'ipAddress', 'status', 'severity', 'resourceType'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // Build order by clause
    const orderBy: any = {};
    orderBy[finalSortBy] = finalSortOrder;

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

    // Get enhanced statistics
    const stats = await getAuditLogStats(tenantId);

    // Transform the data
    const transformedLogs = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      status: log.status,
      severity: log.severity,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      sessionId: log.sessionId,
      requestId: log.requestId,
      isArchived: log.isArchived,
      archivedAt: log.archivedAt?.toISOString(),
      retentionExpiry: log.retentionExpiry?.toISOString(),
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
    }));

    // Create audit log for this action
    await createAuditLogFromRequest(req, { id: userId, email: req.user!.email || '', role: 'user' }, 'audit.view', {
      tenantId: tenantId,
      logsCount: transformedLogs.length,
      filters: { userEmail, actionType, startDate, endDate, status, severity, resourceType, page, limit }
    });

    return createSuccessResponse({
      auditLogs: transformedLogs,
      stats: {
        total: totalCount,
        archived: stats.archived,
        expired: stats.expired,
        bySeverity: stats.bySeverity,
        byStatus: stats.byStatus,
        actionBreakdown: stats.actionBreakdown || []
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 'Audit logs fetched successfully');

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return createErrorResponse('Failed to fetch audit logs', 500);
  }
}); 