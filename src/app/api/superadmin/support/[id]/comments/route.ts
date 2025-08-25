import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import { notifyTicketCreator } from '@/lib/supportNotificationHelper';

// Validation schemas
const commentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(5000, 'Comment must be less than 5000 characters'),
  attachments: z.array(z.object({
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    path: z.string()
  })).optional().default([])
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

  // Verify ticket exists
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!ticket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Get comments with attachments
  const comments = await prisma.supportTicketComment.findMany({
    where: {
      ticketId: ticketId
    },
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
  });

  return createSuccessResponse({ comments }, 'Comments retrieved successfully');
});

export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

  // Verify ticket exists
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!ticket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Prevent comments on closed tickets
  if (ticket.status === 'closed') {
    return createErrorResponse('Cannot add comments to closed tickets', 400);
  }

  const body = await req.json();
  
  // Validate request body
  const validationResult = commentSchema.safeParse(body);
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

  const { text, attachments } = validationResult.data;

  // Create comment
  const comment = await prisma.supportTicketComment.create({
    data: {
      text,
      ticketId: ticketId,
      commentedBy: superadmin.id,
      commenterType: 'superadmin',
      attachments: {
        create: attachments.map(attachment => ({
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          path: attachment.path
        }))
      }
    },
    include: {
      attachments: true
    }
  });

  // Update ticket's updatedAt timestamp
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: superadmin.id, email: superadmin.email, role: 'superadmin' },
    'support.ticket.comment.add',
    { 
      tenantId: ticket.tenant.id,
      tenantSlug: ticket.tenant.slug,
      ticketId: ticketId,
      commentId: comment.id
    }
  );

  // Create notification for the ticket creator
  const hasAttachments = attachments && attachments.length > 0;
  const attachmentText = hasAttachments ? ` with ${attachments.length} attachment(s)` : '';
  
  await notifyTicketCreator(
    ticketId,
    ticket.title,
    superadmin.id,
    ticket.tenant.id,
    'replied',
    `SuperAdmin ${superadmin.name} replied${attachmentText} to your support ticket "${ticket.title}"`
  );

  return createSuccessResponse({ comment }, 'Comment added successfully', 201);
});

