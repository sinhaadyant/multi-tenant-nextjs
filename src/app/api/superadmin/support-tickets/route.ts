import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

// Validation schemas
const supportFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['open', 'pending', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']).optional(),
  search: z.string().optional(),
  tenantSlug: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isForwarded: z.coerce.boolean().optional()
});

export const GET = asyncHandler(async (request: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Fetching support tickets list for SuperAdmin');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  
  // Parse and validate query parameters
  const filters = supportFiltersSchema.parse(Object.fromEntries(searchParams));
  
  const skip = (filters.page - 1) * filters.limit;

  // Build where clause
  const where: any = {};

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.isForwarded !== undefined) where.isForwarded = filters.isForwarded;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Filter by tenant if specified
  if (filters.tenantSlug) {
    where.tenant = {
      slug: filters.tenantSlug
    };
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
            isActive: true,
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
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.limit,
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

  const totalPages = Math.ceil(total / filters.limit);

  // Get statistics
  const stats = await prisma.supportTicket.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  const statusStats = {
    open: 0,
    pending: 0,
    closed: 0,
    total: total
  };

  stats.forEach(stat => {
    statusStats[stat.status as keyof typeof statusStats] = stat._count.status;
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Support tickets fetched successfully:', ticketsWithCounts.length);
  }

  return createSuccessResponse({
    tickets: ticketsWithCounts,
    stats: statusStats
  }, 'Support tickets fetched successfully', 200, {
    page: filters.page,
    limit: filters.limit,
    totalPages,
    totalRecords: total
  });
});

export const POST = asyncHandler(async (request: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Creating support ticket as SuperAdmin');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const { title, description, category, priority, tenantId, userId } = body;

  // Validate required fields
  if (!title || !description || !tenantId) {
    return createErrorResponse(
      'Title, description, and tenantId are required',
      400,
      [
        { field: 'title', message: 'Title is required' },
        { field: 'description', message: 'Description is required' },
        { field: 'tenantId', message: 'Tenant ID is required' }
      ]
    );
  }

  // Verify tenant exists and is active
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found or inactive', 404);
  }

  // Verify user exists if provided
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId, tenantId, isActive: true }
    });

    if (!user) {
      return createErrorResponse('User not found or not associated with tenant', 404);
    }
  }

  // Create ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      title,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      tenantId,
      userId: userId || null,
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