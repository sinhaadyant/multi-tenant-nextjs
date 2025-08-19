import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/support-tickets/[id]/status - Update ticket status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Updating support ticket status:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { status, priority } = await req.json();

  if (!status && !priority) {
    return createErrorResponse('Status or priority is required', 400);
  }

  try {
    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: id },
      include: {
        tenant: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!existingTicket) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Support ticket not found:', id);
      }
      return createErrorResponse('Support ticket not found', 404);
    }

    // Update ticket status/priority
    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const ticket = await prisma.supportTicket.update({
      where: { id: id },
      data: updateData,
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        user: {
          select: { name: true, email: true }
        },
        comments: {
          select: { id: true }
        },
        attachments: {
          select: { id: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'support_ticket.status_update',
      {
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        tenantId: ticket.tenantId,
        tenantName: ticket.tenant?.name,
        userId: ticket.userId,
        userName: ticket.user?.name,
        newStatus: status || ticket.status,
        newPriority: priority || ticket.priority,
        previousStatus: existingTicket.status,
        previousPriority: existingTicket.priority
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Support ticket status updated successfully:', ticket.title);
    }

    return createSuccessResponse({
      ticket: {
        ...ticket,
        _count: {
          comments: ticket.comments.length,
          attachments: ticket.attachments.length,
        },
        comments: undefined,
        attachments: undefined,
      }
    }, 'Support ticket status updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating support ticket status:', error);
    }
    throw error;
  }
}); 