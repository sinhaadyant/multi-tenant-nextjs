import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { text } = body;

    // Validate required fields
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.supportTicketComment.create({
      data: {
        text: text.trim(),
        ticketId: id,
        commentedBy: authResult.id,
        commenterType: 'superadmin',
      },
      include: {
        attachments: true,
      },
    });

    // Create notification for the user if ticket is forwarded
    if (existingTicket.isForwarded && existingTicket.userId) {
      await prisma.notification.create({
        data: {
          title: 'Support Ticket Update',
          message: `Your support ticket "${existingTicket.title}" has received a new response from our support team.`,
          priority: 'medium',
          targetType: 'user',
          createdBy: authResult.id,
          targetTenantId: existingTicket.tenantId || undefined,
        },
      });
    }

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 