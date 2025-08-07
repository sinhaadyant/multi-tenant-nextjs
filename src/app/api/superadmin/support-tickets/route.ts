import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
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
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
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

    return NextResponse.json({
      tickets: ticketsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { title, description, category, priority, tenantId, userId } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
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

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 