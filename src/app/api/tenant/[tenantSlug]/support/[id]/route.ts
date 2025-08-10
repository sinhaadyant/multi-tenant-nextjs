import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/support/[id] - Get single support ticket
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

    // Get the ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: user.tenant.id,
        // If not admin, only show user's own tickets
        ...(isAdmin ? {} : { createdById: user.id })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
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
          orderBy: { createdAt: 'asc' }
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
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.view', {
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
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        createdBy: ticket.createdBy,
        assignedTo: ticket.assignedTo,
        comments: ticket.comments,
        attachments: ticket.attachments
      }
    }, 'Support ticket retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching support ticket:', error);
    return createErrorResponse('Failed to fetch support ticket', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/support/[id] - Update support ticket
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    // Check if user is admin (can update all tickets) or regular user (can only update their own)
    const isAdmin = user.userRoles.some(userRole =>
      userRole.role.name.toLowerCase().includes('admin') ||
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'support' && 
        (rp.permission.action === 'edit' || rp.permission.action === 'manage')
      )
    );

    // Get the ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: user.tenant.id,
        // If not admin, only allow updates to user's own tickets
        ...(isAdmin ? {} : { createdById: user.id })
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    const { title, description, priority, category, status, assignedToId } = await req.json();

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

    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse('Invalid status', 400);
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

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        title: title || ticket.title,
        description: description !== undefined ? description : ticket.description,
        priority: priority || ticket.priority,
        category: category || ticket.category,
        status: status || ticket.status,
        assignedToId: assignedToId !== undefined ? (assignedTo?.id || null) : ticket.assignedToId,
        resolvedAt: status === 'resolved' && ticket.status !== 'resolved' ? new Date() : ticket.resolvedAt
      }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.update', {
      tenantId: user.tenant.id,
      ticketId: updatedTicket.id,
      ticketTitle: updatedTicket.title,
      statusChanged: status && status !== ticket.status
    });

    return createSuccessResponse({
      ticket: {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        updatedAt: updatedTicket.updatedAt,
        resolvedAt: updatedTicket.resolvedAt
      }
    }, 'Support ticket updated successfully');

  } catch (error: any) {
    console.error('Error updating support ticket:', error);
    return createErrorResponse('Failed to update support ticket', 500);
  }
});

// DELETE /api/tenant/[tenantSlug]/support/[id] - Delete support ticket (admin only)
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    // Check if user is admin (can delete tickets)
    const isAdmin = user.userRoles.some(userRole =>
      userRole.role.name.toLowerCase().includes('admin') ||
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'support' && 
        (rp.permission.action === 'delete' || rp.permission.action === 'manage')
      )
    );

    if (!isAdmin) {
      return createErrorResponse('Only administrators can delete support tickets', 403);
    }

    // Get the ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: user.tenant.id
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Delete ticket (this will cascade delete comments and attachments)
    await prisma.supportTicket.delete({
      where: { id }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'support.delete', {
      tenantId: user.tenant.id,
      ticketId: ticket.id,
      ticketTitle: ticket.title
    });

    return createSuccessResponse({
      message: 'Support ticket deleted successfully'
    }, 'Support ticket deleted successfully');

  } catch (error: any) {
    console.error('Error deleting support ticket:', error);
    return createErrorResponse('Failed to delete support ticket', 500);
  }
}); 