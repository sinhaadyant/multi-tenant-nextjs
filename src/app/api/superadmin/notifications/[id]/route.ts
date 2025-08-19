import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET /api/superadmin/notifications/[id] - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const notification = await prisma.notification.findUnique({
      where: { id: id },
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            userNotifications: true,
          },
        },
      },
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    return createSuccessResponse({ notification }, 'Notification retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/superadmin/notifications/[id] - Update notification
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const body = await request.json();

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: id }
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.targetType !== undefined) updateData.targetType = body.targetType;
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (body.attachments !== undefined) {
      updateData.attachments = body.attachments ? JSON.stringify(body.attachments) : null;
    }
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata ? JSON.stringify(body.metadata) : null;
    }

    // Handle targetTenantId based on targetType
    if (body.targetType === 'tenant' && body.targetTenantId) {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: body.targetTenantId }
      });
      if (!tenant) {
        return createErrorResponse('Target tenant not found', 400);
      }
      updateData.targetTenantId = body.targetTenantId;
    } else if (body.targetType !== undefined) {
      // For superadmin, all, or other types, set targetTenantId to null
      updateData.targetTenantId = null;
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: id },
      data: updateData,
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'notification_updated',
      superAdminId: authResult.user.id,
      resourceType: 'NOTIFICATION',
      resourceId: notification.id,
      details: `Updated notification: ${notification.title}`,
    });

    return createSuccessResponse({ notification }, 'Notification updated successfully');
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/superadmin/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: id }
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: id }
    });

    // Create audit log
    await createAuditLog({
      action: 'notification_deleted',
      superAdminId: authResult.user.id,
      resourceType: 'NOTIFICATION',
      resourceId: notification.id,
      details: `Deleted notification: ${notification.title}`,
    });

    return createSuccessResponse(null, 'Notification deleted successfully');
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PATCH /api/superadmin/notifications/[id] - Send notification
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const body = await request.json();

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: id }
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Update notification status to sent
    const updatedNotification = await prisma.notification.update({
      where: { id: id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'notification_sent',
      superAdminId: authResult.user.id,
      resourceType: 'NOTIFICATION',
      resourceId: notification.id,
      details: `Sent notification: ${notification.title}`,
    });

    return createSuccessResponse({ notification: updatedNotification }, 'Notification sent successfully');
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 