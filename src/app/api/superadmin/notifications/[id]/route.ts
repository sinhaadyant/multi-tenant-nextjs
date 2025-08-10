import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { updateNotificationSchema, sendNotificationSchema } from '@/lib/validations/superadmin';
import { prisma } from '@/lib/prisma';
import { verifySuperAdminToken } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const superAdmin = await verifySuperAdminToken(token);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check permission to view notifications
    const hasPermission = await checkPermission(superAdmin.id, 'notifications', 'view');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
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
        userNotifications: {
          include: {
            user: {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const superAdmin = await verifySuperAdminToken(token);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check permission to edit notifications
    const hasPermission = await checkPermission(superAdmin.id, 'notifications', 'edit');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const body = await req.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Check if notification exists and is editable
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    if (existingNotification.status === 'sent') {
      return createErrorResponse('Cannot edit sent notifications', 400);
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        targetTenantId: validatedData.targetTenantId,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        status: validatedData.scheduledAt ? 'scheduled' : 'draft',
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
      action: 'notification_updated',
      details: `Updated notification: ${notification.title}`,
      superAdminId: superAdmin.id,
      metadata: {
        notificationId: notification.id,
        targetType: notification.targetType,
        type: notification.type,
        priority: notification.priority,
      },
    });

    return createSuccessResponse({ notification }, 'Notification updated successfully');
  } catch (error: any) {
    console.error('Error updating notification:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const superAdmin = await verifySuperAdminToken(token);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check permission to delete notifications
    const hasPermission = await checkPermission(superAdmin.id, 'notifications', 'delete');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Soft delete notification
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog({
      action: 'notification_deleted',
      details: `Deleted notification: ${notification.title}`,
      superAdminId: superAdmin.id,
      metadata: {
        notificationId: notification.id,
        targetType: notification.targetType,
        type: notification.type,
        priority: notification.priority,
      },
    });

    return createSuccessResponse({ message: 'Notification deleted successfully' }, 'Notification deleted successfully');
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const superAdmin = await verifySuperAdminToken(token);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'send') {
      // Check permission to send notifications
      const hasPermission = await checkPermission(superAdmin.id, 'notifications', 'send');
      if (!hasPermission) {
        return createErrorResponse('Insufficient permissions', 403);
      }

      const validatedData = sendNotificationSchema.parse(body);

      // Check if notification exists and can be sent
      const existingNotification = await prisma.notification.findUnique({
        where: { id: params.id },
      });

      if (!existingNotification) {
        return createErrorResponse('Notification not found', 404);
      }

      if (existingNotification.status === 'sent') {
        return createErrorResponse('Notification already sent', 400);
      }

      // Send notification logic here
      // This would involve creating UserNotification records for target users
      const notification = await prisma.notification.update({
        where: { id: params.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Create audit log
      await createAuditLog({
        action: 'notification_sent',
        details: `Sent notification: ${notification.title}`,
        superAdminId: superAdmin.id,
        metadata: {
          notificationId: notification.id,
          targetType: notification.targetType,
          type: notification.type,
          priority: notification.priority,
        },
      });

      return createSuccessResponse({ notification }, 'Notification sent successfully');
    }

    return createErrorResponse('Invalid action', 400);
  } catch (error: any) {
    console.error('Error processing notification action:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    return createErrorResponse('Internal server error', 500);
  }
} 