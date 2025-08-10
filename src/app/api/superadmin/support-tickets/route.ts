import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = asyncHandler(async (request: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Fetching support tickets list');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const isForwarded = searchParams.get('isForwarded');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isForwarded: isForwarded === 'true' ? true : undefined,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get tickets with related data
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          attachments: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    // Transform data to include counts
    const ticketsWithCounts = tickets.map(ticket => ({
      ...ticket,
      _count: {
        comments: ticket.comments.length,
        attachments: ticket.attachments.length,
      },
      comments: undefined,
      attachments: undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Support tickets fetched successfully:', ticketsWithCounts.length);
    }

    return createSuccessResponse({
      tickets: ticketsWithCounts
    }, 'Support tickets fetched successfully', 200, {
      page,
      limit,
      totalPages,
      totalRecords: total
    });
});

export const POST = asyncHandler(async (request: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Creating support ticket');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

    const body = await request.json();
    const { title, description, category, priority, tenantId, userId } = body;

    // Validate required fields
    if (!title || !description) {
      return createErrorResponse(
        'Title and description are required',
        400,
        [
          { field: 'title', message: 'Title is required' },
          { field: 'description', message: 'Description is required' }
        ]
      );
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        tenantId,
        userId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Support ticket created successfully:', ticket.id);
    }

    return createSuccessResponse({
      ticket
    }, 'Support ticket created successfully', 201);
}); 