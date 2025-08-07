import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';


// GET /api/superadmin/users/export - Export users to CSV
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Exporting users data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const tenantId = searchParams.get('tenantId') || '';
  const roleId = searchParams.get('roleId') || '';
  const status = searchParams.get('status') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (roleId) {
    where.roleId = roleId;
  }

  if (status) {
    where.isActive = status === 'active';
  }

  try {
    // Get all users matching filters
    const users = await prisma.user.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        role: {
          select: { name: true, description: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Name',
      'Email',
      'Status',
      'Tenant',
      'Role',
      'Last Login',
      'Created At',
      'Updated At'
    ];

    const csvRows = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.isActive ? 'Active' : 'Inactive',
      user.tenant?.name || 'No Tenant',
      user.role?.name || 'No Role',
      user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Never',
      new Date(user.createdAt).toISOString(),
      new Date(user.updatedAt).toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Users exported successfully:', users.length);
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting users:', error);
    }
    throw error;
  }
}); 