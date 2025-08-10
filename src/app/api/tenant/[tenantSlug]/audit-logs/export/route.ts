import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET /api/tenant/[tenantSlug]/audit-logs/export - Export audit logs for specific tenant
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const userEmail = searchParams.get('userEmail') || '';
    const actionType = searchParams.get('actionType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build where clause - only show logs for this tenant
    const where: any = {
      tenantId: tenantId
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

    // Get all audit logs for export (no pagination)
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    });

    if (format === 'json') {
      const jsonData = JSON.stringify({
        tenant: tenantSlug,
        exportDate: new Date().toISOString(),
        totalRecords: auditLogs.length,
        logs: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          createdAt: log.createdAt,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          user: log.user ? {
            email: log.user.email,
            name: log.user.name
          } : null,
          superAdmin: log.superAdmin ? {
            email: log.superAdmin.email,
            name: log.superAdmin.name
          } : null
        }))
      }, null, 2);

      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${tenantSlug}-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    } else {
      // CSV format
      const csvHeaders = [
        'ID',
        'Action',
        'Details',
        'Created At',
        'IP Address',
        'User Agent',
        'User Email',
        'User Name',
        'Super Admin Email',
        'Super Admin Name'
      ];

      const csvRows = auditLogs.map(log => [
        log.id,
        log.action,
        log.details || '',
        log.createdAt.toISOString(),
        log.ipAddress || '',
        log.userAgent || '',
        log.user?.email || '',
        log.user?.name || '',
        log.superAdmin?.email || '',
        log.superAdmin?.name || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${tenantSlug}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
  } catch (error: any) {
    console.error('Error exporting tenant audit logs:', error);
    return createErrorResponse('Failed to export tenant audit logs', 500);
  }
});