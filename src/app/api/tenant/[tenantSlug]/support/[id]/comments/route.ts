import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/support/[id]/comments - Get comments for a support ticket
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
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

    // Verify the ticket exists and user has access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: user.tenant.id,
        // If not admin, only show user's own tickets
        ...(isAdmin ? {} : { createdById: user.id })
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      prisma.supportTicketComment.findMany({
        where: {
          ticketId: id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              fileSize: true,
              mimeType: true,
              url: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.supportTicketComment.count({
        where: {
          ticketId: id
        }
      })
    ]);

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.comments.list', {
      tenantId: user.tenant.id,
      ticketId: ticket.id,
      commentsCount: comments.length
    });

    return createSuccessResponse({
      comments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 'Comments retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return createErrorResponse('Failed to fetch comments', 500);
  }
});

// POST /api/tenant/[tenantSlug]/support/[id]/comments - Add comment to support ticket
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
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

    // Verify the ticket exists and user has access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: user.tenant.id
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Check if user can comment (ticket creator, assigned user, or admin)
    const canComment = ticket.createdById === user.id || 
                      ticket.assignedToId === user.id ||
                      user.userRoles.some(userRole =>
                        userRole.role.name.toLowerCase().includes('admin') ||
                        userRole.role.permissions.some(rp => 
                          rp.permission.module === 'support' && 
                          (rp.permission.action === 'comment' || rp.permission.action === 'manage')
                        )
                      );

    if (!canComment) {
      return createErrorResponse('You do not have permission to comment on this ticket', 403);
    }

    const { content, isInternal } = await req.json();

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return createErrorResponse('Comment content is required', 400);
    }

    // Create comment
    const comment = await prisma.supportTicketComment.create({
      data: {
        content: content.trim(),
        isInternal: isInternal || false,
        ticketId: id,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.comment.create', {
      tenantId: user.tenant.id,
      ticketId: ticket.id,
      commentId: comment.id
    });

    return createSuccessResponse({
      comment: {
        id: comment.id,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt,
        user: comment.user
      }
    }, 'Comment added successfully');

  } catch (error: any) {
    console.error('Error creating comment:', error);
    return createErrorResponse('Failed to create comment', 500);
  }
}); 