import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';


// GET /api/superadmin/audit-logs/export - Export audit logs
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 Exporting audit logs');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const tenantName = searchParams.get('tenantName') || '';
  const userEmail = searchParams.get('userEmail') || '';
  const actionType = searchParams.get('actionType') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

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

  try {
    // Get all audit logs matching filters
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

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Audit logs fetched for export:', auditLogs.length);
    }

    // Transform data for export
    const exportData = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      details: log.details ? JSON.stringify(log.details) : '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      actorName: log.superAdmin?.name || log.user?.name || 'Unknown',
      actorEmail: log.superAdmin?.email || log.user?.email || 'Unknown',
      actorRole: log.superAdmin ? 'Super Admin' : 'User',
      tenantName: log.tenant?.name || 'System',
      tenantSlug: log.tenant?.slug || '',
    }));

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    // CSV format
    const csvHeaders = [
      'ID',
      'Timestamp',
      'Action',
      'Details',
      'IP Address',
      'User Agent',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Tenant Name',
      'Tenant Slug'
    ];

    const csvRows = exportData.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.details,
      log.ipAddress,
      log.userAgent,
      log.actorName,
      log.actorEmail,
      log.actorRole,
      log.tenantName,
      log.tenantSlug
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting audit logs:', error);
    }
    throw error;
  }
}); 