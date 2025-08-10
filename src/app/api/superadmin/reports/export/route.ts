import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/reports/export - Export reports to CSV
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Exporting reports data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const tenantId = searchParams.get('tenantId') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.name = { contains: search };
  }

  if (type) {
    where.type = type;
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  try {
    // Get all reports matching filters
    const reports = await prisma.report.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        superAdmin: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Name',
      'Type',
      'Tenant',
      'Created By',
      'Data Size (bytes)',
      'Created At'
    ];

    const csvRows = reports.map(report => [
      report.id,
      report.name,
      report.type,
      report.tenant?.name || 'System Report',
      report.superAdmin?.name || 'System',
      report.data.length,
      new Date(report.createdAt).toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Reports exported successfully:', reports.length);
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reports-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting reports:', error);
    }
    throw error;
  }
}); 