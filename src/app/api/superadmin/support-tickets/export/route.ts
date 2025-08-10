import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/support-tickets/export - Export support tickets to CSV
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Exporting support tickets data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const category = searchParams.get('category') || '';
  const isForwarded = searchParams.get('isForwarded') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (category) {
    where.category = category;
  }

  if (isForwarded !== '') {
    where.isForwarded = isForwarded === 'true';
  }

  try {
    // Get all support tickets matching filters
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        user: {
          select: { name: true, email: true }
        },
        comments: {
          select: { id: true }
        },
        attachments: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Category',
      'Is Forwarded',
      'Tenant',
      'User',
      'Comments Count',
      'Attachments Count',
      'Created At',
      'Updated At'
    ];

    const csvRows = tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.description.replace(/"/g, '""'), // Escape quotes
      ticket.status,
      ticket.priority,
      ticket.category,
      ticket.isForwarded ? 'Yes' : 'No',
      ticket.tenant?.name || 'No Tenant',
      ticket.user?.name || 'No User',
      ticket.comments.length,
      ticket.attachments.length,
      new Date(ticket.createdAt).toISOString(),
      new Date(ticket.updatedAt).toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Support tickets exported successfully:', tickets.length);
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="support-tickets-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting support tickets:', error);
    }
    throw error;
  }
}); 