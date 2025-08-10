import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/support - List support tickets for the tenant
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user is admin (can see all tickets) or regular user (can only see their own)
    const isAdmin = user.userRoles.some(userRole =>
      userRole.role.name.toLowerCase().includes('admin') ||
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'support' && 
        (rp.permission.action === 'view' || rp.permission.action === 'manage')
      )
    );

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      tenantId: user.tenant.id
    };

    // If not admin, only show user's own tickets
    if (!isAdmin) {
      whereClause.userId = user.id;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (category) {
      whereClause.category = category;
    }

    // Build order by clause
    const orderByClause: any = {};
    if (sortBy === 'title') orderByClause.title = sortOrder;
    else if (sortBy === 'status') orderByClause.status = sortOrder;
    else if (sortBy === 'priority') orderByClause.priority = sortOrder;
    else if (sortBy === 'category') orderByClause.category = sortOrder;
    else orderByClause.createdAt = sortOrder;

    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          comments: {
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              comments: true,
              attachments: true
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take: limit
      }),
      prisma.supportTicket.count({ where: whereClause })
    ]);

    // Transform tickets data
    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      createdBy: ticket.user,
      assignedTo: null, // Not implemented in current schema
      commentsCount: ticket._count.comments,
      attachmentsCount: ticket._count.attachments,
      lastComment: ticket.comments.length > 0 ? {
        id: ticket.comments[ticket.comments.length - 1].id,
        content: ticket.comments[ticket.comments.length - 1].text,
        createdAt: ticket.comments[ticket.comments.length - 1].createdAt,
        user: null // Not implemented in current schema
      } : null
    }));

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.list', {
      tenantId: user.tenant.id,
      ticketsCount: transformedTickets.length,
      isAdmin: isAdmin
    });

    return createSuccessResponse({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 'Support tickets retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return createErrorResponse('Failed to fetch support tickets', 500);
  }
});

// POST /api/tenant/[tenantSlug]/support - Create new support ticket
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true
      }
    });

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    const { title, description, priority, category, assignedToId } = await req.json();

    // Validate required fields
    if (!title || !description) {
      return createErrorResponse('Title and description are required', 400);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return createErrorResponse('Invalid priority level', 400);
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'feature-request', 'bug-report', 'general'];
    if (category && !validCategories.includes(category)) {
      return createErrorResponse('Invalid category', 400);
    }

    // Verify assigned user belongs to the same tenant if provided
    let assignedTo = null;
    if (assignedToId) {
      assignedTo = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          tenantId: user.tenant.id
        }
      });

      if (!assignedTo) {
        return createErrorResponse('Assigned user not found in this tenant', 400);
      }
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        category: category || 'general',
        status: 'open',
        tenantId: user.tenant.id,
        userId: user.id
      }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.create', {
      tenantId: user.tenant.id,
      ticketId: ticket.id,
      ticketTitle: ticket.title
    });

    return createSuccessResponse({
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        assignedTo: assignedTo ? {
          id: assignedTo.id,
          name: assignedTo.name,
          email: assignedTo.email
        } : null
      }
    }, 'Support ticket created successfully');

  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return createErrorResponse('Failed to create support ticket', 500);
  }
}); 