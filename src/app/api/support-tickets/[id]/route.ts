import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { authenticateJWT } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

export const GET = asyncHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
  const { id: ticketId } = await params;

  try {
    // Build where clause based on user role
    const where: any = { id: ticketId };

    if (user.role === 'superadmin') {
      // Superadmin can see all tickets
      // No additional filtering needed
    } else if (user.tenantId) {
      // Tenant user can only see tickets from their tenant
      where.tenantId = user.tenantId;
    } else {
      // User can only see their own tickets
      where.userId = user.id;
    }

    const ticket = await prisma.supportTicket.findFirst({
      where,
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
        attachments: true,
        comments: {
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    return createSuccessResponse({ ticket }, 'Support ticket retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching support ticket:', error);
    return createErrorResponse('Failed to fetch support ticket', 500);
  }
});

export const PUT = asyncHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
  const { id: ticketId } = await params;

  try {
    const body = await request.json();
    const { title, description, priority, category } = body;

    // Build where clause based on user role
    const where: any = { id: ticketId };

    if (user.role === 'superadmin') {
      // Superadmin can update all tickets
      // No additional filtering needed
    } else if (user.tenantId) {
      // Tenant user can only update tickets from their tenant
      where.tenantId = user.tenantId;
    } else {
      // User can only update their own tickets
      where.userId = user.id;
    }

    // Check if ticket exists and user has permission
    const existingTicket = await prisma.supportTicket.findFirst({ where });
    if (!existingTicket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Update ticket
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(category && { category }),
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
        attachments: true,
      },
    });

    return createSuccessResponse({ ticket }, 'Support ticket updated successfully');
  } catch (error: any) {
    console.error('Error updating support ticket:', error);
    return createErrorResponse('Failed to update support ticket', 500);
  }
});

export const DELETE = asyncHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await authenticateJWT(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;
  const { id: ticketId } = await params;

  try {
    // Build where clause based on user role
    const where: any = { id: ticketId };

    if (user.role === 'superadmin') {
      // Superadmin can delete all tickets
      // No additional filtering needed
    } else if (user.tenantId) {
      // Tenant user can only delete tickets from their tenant
      where.tenantId = user.tenantId;
    } else {
      // User can only delete their own tickets
      where.userId = user.id;
    }

    // Check if ticket exists and user has permission
    const existingTicket = await prisma.supportTicket.findFirst({ where });
    if (!existingTicket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Delete ticket (cascade will handle related records)
    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return createSuccessResponse({}, 'Support ticket deleted successfully');
  } catch (error: any) {
    console.error('Error deleting support ticket:', error);
    return createErrorResponse('Failed to delete support ticket', 500);
  }
});
