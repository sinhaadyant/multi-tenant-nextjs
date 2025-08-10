import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
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

    // Get support ticket with comments
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenant.id
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

  } catch (error: any) {
    console.error('Error fetching support ticket:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { title, description, category, priority, status } = body;

    // Get existing ticket
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenant.id
      }
    });

    if (!existingTicket) {
      return createErrorResponse('Support ticket not found', 404);
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(status && { status }),
        updatedAt: new Date()
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

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.ticket.update',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ticketId: ticketId,
        changes: { title, description, category, priority, status }
      }
    );

    return createSuccessResponse({ ticket: updatedTicket }, 'Support ticket updated successfully');

  } catch (error: any) {
    console.error('Error updating support ticket:', error);
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

    // Get existing ticket
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: tenant.id
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

  } catch (error: any) {
    console.error('Error deleting support ticket:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}