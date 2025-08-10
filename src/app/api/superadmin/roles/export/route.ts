import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/roles/export - Export roles to CSV
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Exporting roles data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const isActive = searchParams.get('isActive') || '';
  const isDefault = searchParams.get('isDefault') || '';
  const tenantId = searchParams.get('tenantId') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ];
  }

  if (isActive !== '') {
    where.isActive = isActive === 'true';
  }

  if (isDefault !== '') {
    where.isDefault = isDefault === 'true';
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  try {
    // Get all roles matching filters
    const roles = await prisma.role.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Name',
      'Description',
      'Is Active',
      'Is Default',
      'Is Template',
      'Tenant',
      'Permissions Count',
      'Users Count',
      'Created At',
      'Updated At'
    ];

    const csvRows = roles.map(role => [
      role.id,
      role.name,
      role.description || '',
      role.isActive ? 'Yes' : 'No',
      role.isDefault ? 'Yes' : 'No',
      role.isTemplate ? 'Yes' : 'No',
      role.tenant?.name || 'Global',
      role.permissions.length,
      role._count.userRoles,
      new Date(role.createdAt).toISOString(),
      new Date(role.updatedAt).toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Roles exported successfully:', roles.length);
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="roles-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting roles:', error);
    }
    throw error;
  }
}); 