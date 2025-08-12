import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/tenants/[id]/users/export - Export users to CSV
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Exporting users for tenant:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const tenantId = params.id;

  // Extract query parameters
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Validate tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Build where clause
  const where: any = {
    tenantId: tenantId
  };

  // Add search filter
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  // Add status filter
  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  // Build order by clause
  const orderBy: any = {};
  if (sortBy === 'name') {
    orderBy.name = sortOrder;
  } else if (sortBy === 'email') {
    orderBy.email = sortOrder;
  } else if (sortBy === 'lastLogin') {
    orderBy.lastLogin = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  try {
    // Get all users matching filters
    const users = await prisma.user.findMany({
      where,
      orderBy,
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Name',
      'Email',
      'Status',
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
      user.userRoles.length > 0 ? user.userRoles[0].role.name : 'No Role',
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
        'Content-Disposition': `attachment; filename="users-${tenant.slug}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting users:', error);
    }
    throw error;
  }
});
