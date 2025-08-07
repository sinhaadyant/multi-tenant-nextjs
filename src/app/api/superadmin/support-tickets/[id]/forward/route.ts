import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is already forwarded
    if (existingTicket.isForwarded) {
      return NextResponse.json(
        { error: 'Ticket is already forwarded to SuperAdmin' },
        { status: 400 }
      );
    }

    // Forward ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        isForwarded: true,
        status: 'in_progress',
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
      },
    });

    // Create notification for superadmin
    await prisma.notification.create({
      data: {
        title: 'New Support Ticket Forwarded',
        message: `A support ticket "${existingTicket.title}" has been forwarded for your attention.`,
        priority: 'high',
        targetType: 'superadmin',
        createdBy: authResult.id,
      },
    });

    return NextResponse.json({ 
      ticket: updatedTicket,
      message: 'Ticket forwarded successfully' 
    });
  } catch (error) {
    console.error('Error forwarding ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 