import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { authenticateJWT } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

export const POST = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
  const { id: ticketId } = await params;

  try {
    const body = await request.json();
    const { text, attachments } = body;

    if (!text || text.trim() === '') {
      return createErrorResponse('Reply text is required', 400);
    }

    // Build where clause based on user role to check ticket access
    const where: any = { id: ticketId };

    if (user.role === 'superadmin') {
      // Superadmin can reply to all tickets
      // No additional filtering needed
    } else if (user.tenantId) {
      // Tenant user can only reply to tickets from their tenant
      where.tenantId = user.tenantId;
    } else {
      // User can only reply to their own tickets
      where.userId = user.id;
    }

    // Check if ticket exists and user has permission
    const existingTicket = await prisma.supportTicket.findFirst({ where });
    if (!existingTicket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Determine commenter type
    const commenterType = user.role === 'superadmin' ? 'admin' : 'user';

    // Create the comment
    const comment = await prisma.supportTicketComment.create({
      data: {
        text: text.trim(),
        ticketId,
        commentedBy: user.id,
        commenterType,
        ...(attachments && attachments.length > 0 && {
          attachments: {
            create: attachments.map((attachment: any) => ({
              filename: attachment.filename,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              size: attachment.size,
              path: attachment.path,
            })),
          },
        }),
      },
      include: {
        attachments: true,
      },
    });

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return createSuccessResponse(
      { comment },
      'Reply added successfully'
    );
  } catch (error: any) {
    console.error('Error adding reply to support ticket:', error);
    return createErrorResponse('Failed to add reply', 500);
  }
});
