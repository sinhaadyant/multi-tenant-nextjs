import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    const ticketId = req.nextUrl.pathname.split('/')[5];
    
    if (!tenantSlug || !ticketId) {
      return createErrorResponse('Tenant slug and ticket ID are required', 400);
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

    // Parse form data
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const attachments = formData.getAll('attachments') as File[];

    if (!text || text.trim().length === 0) {
      return createErrorResponse('Comment text is required', 400);
    }

    // Create comment
    const comment = await prisma.supportTicketComment.create({
      data: {
        text: text.trim(),
        ticketId: ticketId,
        commentedBy: user.id,
        commenterType: 'user'
      },
      include: {
        attachments: true
      }
    });

    // Handle file uploads if any
    if (attachments && attachments.length > 0) {
      const attachmentPromises = attachments.map(async (file) => {
        // In a real implementation, you would upload the file to a storage service
        // For now, we'll just create a placeholder record
        const filename = `${Date.now()}-${file.name}`;
        const path = `/uploads/support/${filename}`;
        
        return prisma.supportTicketCommentAttachment.create({
          data: {
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path,
            commentId: comment.id
          }
        });
      });

      await Promise.all(attachmentPromises);
    }

    // Get the comment with attachments
    const commentWithAttachments = await prisma.supportTicketComment.findUnique({
      where: { id: comment.id },
      include: {
        attachments: true
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.comment.create',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ticketId: ticketId,
        commentId: comment.id
      }
    );

    return createSuccessResponse({ comment: commentWithAttachments }, 'Comment added successfully');

  } catch (error: any) {
    console.error('Error adding comment:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}