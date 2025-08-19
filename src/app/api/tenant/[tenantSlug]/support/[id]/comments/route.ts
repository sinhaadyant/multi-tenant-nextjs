import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireTenantAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';

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
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  const { id: ticketId } = await params;
  
  if (!tenantSlug || !ticketId) {
    return createErrorResponse('Tenant slug and ticket ID are required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
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
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Check if user has permission to read support tickets
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { moduleKey: 'support' }
          }
        }
      }
    }
  });

  const hasReadPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canRead)
  );

  if (!hasReadPermission) {
    return createErrorResponse('You do not have permission to view support tickets', 403);
  }

  const hasViewAllPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canViewAll)
  );

  // Verify ticket exists and user has access
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
      // If user doesn't have viewAll permission, only show their own tickets
      ...(hasViewAllPermission ? {} : { userId: user.id })
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
      attachments: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return createSuccessResponse({ comments }, 'Comments retrieved successfully');
});

export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  const { id: ticketId } = await params;
  
  if (!tenantSlug || !ticketId) {
    return createErrorResponse('Tenant slug and ticket ID are required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
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
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Check if user has permission to update support tickets (for adding comments)
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { moduleKey: 'support' }
          }
        }
      }
    }
  });

  const hasUpdatePermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canUpdate)
  );

  if (!hasUpdatePermission) {
    return createErrorResponse('You do not have permission to add comments to support tickets', 403);
  }

  const hasViewAllPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canViewAll)
  );

  // Verify ticket exists and user has access
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
      // If user doesn't have viewAll permission, only allow comments on their own tickets
      ...(hasViewAllPermission ? {} : { userId: user.id })
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
      commentedBy: user.id,
      commenterType: 'user',
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
    { id: user.id, email: user.email, role: 'user' },
    'support.ticket.comment.add',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      ticketId: ticketId,
      commentId: comment.id
    }
  );

  return createSuccessResponse({ comment }, 'Comment added successfully', 201);
});