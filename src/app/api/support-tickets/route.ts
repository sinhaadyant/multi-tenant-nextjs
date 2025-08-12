import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { authenticateJWT } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

export const GET = asyncHandler(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
    
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const skip = (page - 1) * limit;

      // Build where clause based on user role
      const where: any = {};

      if (user.role === 'superadmin') {
        // Superadmin can see all tickets
        // No additional filtering needed
      } else if (user.tenantId) {
        // Tenant user can only see tickets from their tenant
        where.tenantId = user.tenantId;
      } else {
        // User can only see their own tickets
        where.userId = user.id;
      }

      // Add filters
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

      return createSuccessResponse({
        tickets: ticketsWithCounts
      }, 'Support tickets fetched successfully', 200, {
        page,
        limit,
        totalPages,
        totalRecords: total
      });

    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      return createErrorResponse('Failed to fetch support tickets', 500);
    }
  });

export const POST = asyncHandler(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
  
  // Verify user exists in database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, tenantId: true }
  });

  // For superadmin, we don't need to verify user exists since they can create tickets for any tenant
  if (user.role !== 'superadmin' && !dbUser) {
    return createErrorResponse('User not found in database', 404);
  }
  
  try {
    const body = await request.json();
    const { title, description, priority = 'medium', category = 'general', attachments = [] } = body;

    // Validate required fields
    if (!title || !description) {
      return createErrorResponse('Title and description are required', 400);
    }

    // Create ticket with attachments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the ticket
      const ticket = await tx.supportTicket.create({
        data: {
          title,
          description,
          priority,
          category,
          userId: user.role === 'superadmin' ? null : dbUser?.id || null,
          tenantId: user.role === 'superadmin' ? null : dbUser?.tenantId || null,
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
          attachments: true,
        },
      });

      // Create attachments if provided
      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((att: any) => ({
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          path: att.path,
          ticketId: ticket.id,
        }));

        await tx.supportTicketAttachment.createMany({
          data: attachmentData,
        });
      }

      // Return the ticket with attachments
      return await tx.supportTicket.findUnique({
        where: { id: ticket.id },
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
          attachments: true,
        },
      });
    });

    return createSuccessResponse({ ticket: result }, 'Support ticket created successfully');
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return createErrorResponse('Failed to create support ticket', 500);
  }
});

export const PUT = asyncHandler(async (request: NextRequest) => {
  // This method should be handled by the [id]/route.ts file
  return createErrorResponse('Method not allowed. Use PUT /api/support-tickets/[id] to update a ticket', 405);
});

export const DELETE = asyncHandler(async (request: NextRequest) => {
  // This method should be handled by the [id]/route.ts file
  return createErrorResponse('Method not allowed. Use DELETE /api/support-tickets/[id] to delete a ticket', 405);
});
