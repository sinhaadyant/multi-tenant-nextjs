import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import { notifyTicketCreator } from '@/lib/supportNotificationHelper';

// Validation schemas
const updateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters').optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'pending', 'closed']).optional(),
  assignedTo: z.string().optional(),
});

export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { id: ticketId } = await params;
  
  if (!ticketId) {
    return createErrorResponse('Ticket ID is required', 400);
  }

  // Authenticate superadmin
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    return createErrorResponse(authResult.error || 'Unauthorized', 401);
  }

  const superadmin = authResult.user as any;

  // Get support ticket with all related data
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      comments: {
        include: {
          attachments: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: true
    }
  });

  if (!ticket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: superadmin.id, email: superadmin.email, role: 'superadmin' },
    'support.ticket.view',
    { 
      tenantId: ticket.tenant.id,
      tenantSlug: ticket.tenant.slug,
      ticketId: ticket.id
    }
  );

  return createSuccessResponse({ ticket }, 'Support ticket retrieved successfully');
});

export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { id: ticketId } = await params;
  
  if (!ticketId) {
    return createErrorResponse('Ticket ID is required', 400);
  }

  // Authenticate superadmin
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    return createErrorResponse(authResult.error || 'Unauthorized', 401);
  }

  const superadmin = authResult.user as any;

  // Get existing ticket
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  const body = await req.json();
  
  // Validate request body
  const validationResult = updateTicketSchema.safeParse(body);
  if (!validationResult.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    );
  }

  const updateData = validationResult.data;

  // Update ticket
  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      comments: {
        include: {
          attachments: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: true
    }
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: superadmin.id, email: superadmin.email, role: 'superadmin' },
    'support.ticket.update',
    { 
      tenantId: existingTicket.tenant.id,
      tenantSlug: existingTicket.tenant.slug,
      ticketId: ticketId,
      changes: Object.keys(updateData)
    }
  );

  // Create notifications based on what was updated
  if (updateData.status === 'closed') {
    // Notify ticket creator that ticket was closed by superadmin
    await notifyTicketCreator(
      ticketId,
      updatedTicket.title,
      superadmin.id,
      existingTicket.tenant.id,
      'closed',
      `Your support ticket "${updatedTicket.title}" has been closed by SuperAdmin ${superadmin.name}`
    );
  } else if (Object.keys(updateData).length > 0) {
    // Notify ticket creator about other updates
    await notifyTicketCreator(
      ticketId,
      updatedTicket.title,
      superadmin.id,
      existingTicket.tenant.id,
      'updated',
      `Your support ticket "${updatedTicket.title}" has been updated by SuperAdmin ${superadmin.name}`
    );
  }

  return createSuccessResponse({ ticket: updatedTicket }, 'Support ticket updated successfully');
});

