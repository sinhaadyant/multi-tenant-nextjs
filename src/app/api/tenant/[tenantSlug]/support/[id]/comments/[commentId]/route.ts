import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    const ticketId = req.nextUrl.pathname.split('/')[5];
    const commentId = req.nextUrl.pathname.split('/')[7];
    
    if (!tenantSlug || !ticketId || !commentId) {
      return createErrorResponse('Tenant slug, ticket ID, and comment ID are required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Verify ticket exists and belongs to this tenant
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenant.id
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Get existing comment
    const existingComment = await prisma.supportTicketComment.findFirst({
      where: {
        id: commentId,
        ticketId: ticketId
      }
    });

    if (!existingComment) {
      return createErrorResponse('Comment not found', 404);
    }

    // Verify user owns the comment
    if (existingComment.commentedBy !== user.id) {
      return createErrorResponse('You can only edit your own comments', 403);
    }

    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return createErrorResponse('Comment text is required', 400);
    }

    // Update comment
    const updatedComment = await prisma.supportTicketComment.update({
      where: { id: commentId },
      data: {
        text: text.trim(),
        updatedAt: new Date()
      },
      include: {
        attachments: true
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.comment.update',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ticketId: ticketId,
        commentId: commentId
      }
    );

    return createSuccessResponse({ comment: updatedComment }, 'Comment updated successfully');

  } catch (error: any) {
    console.error('Error updating comment:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    const ticketId = req.nextUrl.pathname.split('/')[5];
    const commentId = req.nextUrl.pathname.split('/')[7];
    
    if (!tenantSlug || !ticketId || !commentId) {
      return createErrorResponse('Tenant slug, ticket ID, and comment ID are required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Verify ticket exists and belongs to this tenant
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenant.id
      }
    });

    if (!ticket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Get existing comment
    const existingComment = await prisma.supportTicketComment.findFirst({
      where: {
        id: commentId,
        ticketId: ticketId
      }
    });

    if (!existingComment) {
      return createErrorResponse('Comment not found', 404);
    }

    // Verify user owns the comment
    if (existingComment.commentedBy !== user.id) {
      return createErrorResponse('You can only delete your own comments', 403);
    }

    // Delete comment (cascade will handle attachments)
    await prisma.supportTicketComment.delete({
      where: { id: commentId }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.comment.delete',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ticketId: ticketId,
        commentId: commentId
      }
    );

    return createSuccessResponse({}, 'Comment deleted successfully');

  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
} 