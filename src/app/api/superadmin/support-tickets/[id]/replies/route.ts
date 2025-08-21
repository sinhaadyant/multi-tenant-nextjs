import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';

export const POST = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Adding reply to support ticket:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const { text, attachments = [] } = body;

  // Validate required fields
  if (!text || text.trim().length === 0) {
    return createErrorResponse('Reply text is required', 400);
  }

  // Check if ticket exists
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id },
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

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Create comment/reply
  const reply = await prisma.supportTicketComment.create({
    data: {
      text: text.trim(),
      ticketId: id,
      commentedBy: authResult.id,
      commenterType: 'superadmin',
      attachments: {
        create: attachments.map((att: any) => ({
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          path: att.path,
        })),
      },
    },
    include: {
      attachments: true,
    },
  });

  // Create notification for the user/tenant
  if (existingTicket.userId) {
    // Notify the specific user
    await prisma.notification.create({
      data: {
        title: 'Support Ticket Update',
        message: `Your support ticket "${existingTicket.title}" has received a new response from our support team.`,
        priority: 'medium',
        targetType: 'user',
        createdBy: authResult.id,
        targetTenantId: existingTicket.tenantId || undefined,
        metadata: JSON.stringify({
          ticketId: id,
          ticketTitle: existingTicket.title,
          replyId: reply.id,
          userEmail: existingTicket.user?.email,
          userName: existingTicket.user?.name,
        }),
      },
    });
  } else if (existingTicket.tenantId) {
    // Notify the tenant (general notification)
    await prisma.notification.create({
      data: {
        title: 'Support Ticket Update',
        message: `Support ticket "${existingTicket.title}" has received a new response from our support team.`,
        priority: 'medium',
        targetType: 'specific_tenant',
        createdBy: authResult.id,
        targetTenantId: existingTicket.tenantId,
        metadata: JSON.stringify({
          ticketId: id,
          ticketTitle: existingTicket.title,
          replyId: reply.id,
          tenantName: existingTicket.tenant?.name,
        }),
      },
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Reply added successfully to ticket:', id);
  }

  return createSuccessResponse({
    reply: {
      id: reply.id,
      text: reply.text,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      ticketId: reply.ticketId,
      commentedBy: reply.commentedBy,
      commenterType: reply.commenterType,
      attachments: reply.attachments,
    }
  }, 'Reply added successfully', 201);
});
