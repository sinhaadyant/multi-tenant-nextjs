import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireTenantAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';

// Validation schemas
const updateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters').optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'pending', 'closed']).optional(),
});

const replySchema = z.object({
  text: z.string().min(1, 'Reply text is required').max(5000, 'Reply must be less than 5000 characters'),
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
  const ticketId = params.id;
  
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

  // Get support ticket with comments
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
      // If user doesn't have viewAll permission, only show their own tickets
      ...(hasViewAllPermission ? {} : { userId: user.id })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      comments: {
        include: {
          attachments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: true
    }
  });

  if (!ticket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: user.id, email: user.email, role: 'user' },
    'support.ticket.view',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      ticketId: ticket.id
    }
  );

  return createSuccessResponse({ ticket }, 'Support ticket retrieved successfully');
});

export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  const ticketId = params.id;
  
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

  // Check if user has permission to update support tickets
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
    return createErrorResponse('You do not have permission to update support tickets', 403);
  }

  const hasViewAllPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canViewAll)
  );

  // Get existing ticket
  const existingTicket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
      // If user doesn't have viewAll permission, only allow updates to their own tickets
      ...(hasViewAllPermission ? {} : { userId: user.id })
    }
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Prevent updates to closed tickets
  if (existingTicket.status === 'closed') {
    return createErrorResponse('Cannot update closed tickets', 400);
  }

  const body = await req.json();
  
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

  // Update ticket
  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      comments: {
        include: {
          attachments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: true
    }
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: user.id, email: user.email, role: 'user' },
    'support.ticket.update',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      ticketId: ticketId,
      changes: Object.keys(updateData)
    }
  );

  return createSuccessResponse({ ticket: updatedTicket }, 'Support ticket updated successfully');
});

export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  const ticketId = params.id;
  
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

  // Check if user has permission to delete support tickets
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

  const hasDeletePermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canDelete)
  );

  if (!hasDeletePermission) {
    return createErrorResponse('You do not have permission to delete support tickets', 403);
  }

  const hasViewAllPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canViewAll)
  );

  // Get existing ticket
  const existingTicket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
      // If user doesn't have viewAll permission, only allow deletion of their own tickets
      ...(hasViewAllPermission ? {} : { userId: user.id })
    }
  });

  if (!existingTicket) {
    return createErrorResponse('Support ticket not found', 404);
  }

  // Delete ticket (cascade will handle comments and attachments)
  await prisma.supportTicket.delete({
    where: { id: ticketId }
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: user.id, email: user.email, role: 'user' },
    'support.ticket.delete',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      ticketId: ticketId
    }
  );

  return createSuccessResponse({}, 'Support ticket deleted successfully');
});