import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/notifications/export - Export notifications to CSV
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 Exporting notifications data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const priority = searchParams.get('priority') || '';
  const isRead = searchParams.get('isRead') || '';
  const targetType = searchParams.get('targetType') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { message: { contains: search } }
    ];
  }

  if (priority) {
    where.priority = priority;
  }

  if (isRead !== '') {
    where.isRead = isRead === 'true';
  }

  if (targetType) {
    where.targetType = targetType;
  }

  try {
    // Get all notifications matching filters
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        super_admins: {
          select: { name: true, email: true }
        },
        tenants: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Title',
      'Message',
      'Priority',
      'Is Read',
      'Is Active',
      'Target Type',
      'Created By',
      'Target Tenant',
      'Created At',
      'Updated At'
    ];

    const csvRows = notifications.map(notification => [
      notification.id,
      notification.title,
      notification.message.replace(/"/g, '""'), // Escape quotes
      notification.priority,
      notification.isRead ? 'Yes' : 'No',
      notification.isActive ? 'Yes' : 'No',
      notification.targetType,
      notification.super_admins?.name || 'System',
      notification.tenants?.name || 'All Tenants',
      new Date(notification.createdAt).toISOString(),
      new Date(notification.updatedAt).toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notifications exported successfully:', notifications.length);
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="notifications-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting notifications:', error);
    }
    throw error;
  }
}); 