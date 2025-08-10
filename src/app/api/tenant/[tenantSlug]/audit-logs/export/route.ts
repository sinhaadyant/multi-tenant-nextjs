import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';

// GET /api/tenant/[tenantSlug]/audit-logs/export - Export audit logs for specific tenant
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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const userEmail = searchParams.get('userEmail') || '';
    const actionType = searchParams.get('actionType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

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
        tenant: user.tenant.name,
        exportDate: new Date().toISOString(),
        totalRecords: auditLogs.length,
        auditLogs: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
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
        'IP Address',
        'User Agent',
        'Created At',
        'User Email',
        'User Name',
        'Super Admin Email',
        'Super Admin Name'
      ];

      const csvRows = auditLogs.map(log => [
        log.id,
        log.action,
        log.details || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.createdAt.toISOString(),
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