import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

// Validation schemas
const updateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters').optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'pending', 'closed']).optional(),
  userId: z.string().optional(),
  isForwarded: z.boolean().optional(),
});

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

export const GET = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Fetching support ticket details:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        include: {
          attachments: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      attachments: true,
    },
  });

  if (!ticket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Support ticket fetched successfully');
  }

  return createSuccessResponse({ ticket }, 'Support ticket fetched successfully');
});

export const PUT = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Updating support ticket:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if ticket exists
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  const body = await request.json();
  
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

  // Validate assignedTo user if provided
  if (updateData.userId) {
    const assignedUser = await prisma.user.findUnique({
      where: { 
        id: updateData.userId,
        tenantId: existingTicket.tenantId,
        isActive: true
      }
    });

    if (!assignedUser) {
      return createErrorResponse('Assigned user not found or not associated with tenant', 404);
    }
  }

  // Update ticket
  const updatedTicket = await prisma.supportTicket.update({
    where: { id: id },
    data: updateData,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        include: {
          attachments: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      attachments: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Support ticket updated successfully');
  }

  return createSuccessResponse({ ticket: updatedTicket }, 'Support ticket updated successfully');
});

export const DELETE = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Deleting support ticket:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if ticket exists
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: id },
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Delete ticket (cascade will handle comments and attachments)
  await prisma.supportTicket.delete({
    where: { id: id }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Support ticket deleted successfully');
  }

  return createSuccessResponse({}, 'Support ticket deleted successfully');
});

// Add comment to ticket
export const PATCH = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Adding comment to support ticket:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if ticket exists
  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Prevent comments on closed tickets
  if (existingTicket.status === 'closed') {
    return createErrorResponse('Cannot add comments to closed tickets', 400);
  }

  const body = await request.json();
  
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
      ticketId: id,
      commentedBy: authResult.id, // SuperAdmin ID
      commenterType: 'admin',
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
      attachments: true,
    },
  });

  // Update ticket's updatedAt timestamp
  await prisma.supportTicket.update({
    where: { id: id },
    data: { updatedAt: new Date() }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Comment added successfully');
  }

  return createSuccessResponse({ comment }, 'Comment added successfully', 201);
}); 