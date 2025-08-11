import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { checkTenantPermissionById } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { updateNotificationSchema } from '@/lib/validations/superadmin';

export const GET = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) => {
  try {
    const { tenantSlug, id } = await params;
    const user = req.user!;

    // Check permission to view notifications
    const hasPermission = await checkTenantPermissionById(user.id, tenantSlug, 'notifications', 'view');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Get notification
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        targetTenantId: tenant.id,
        isActive: true
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

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    return createSuccessResponse({ notification }, 'Notification retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
});

export const PUT = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) => {
  try {
    const { tenantSlug, id } = await params;
    const user = req.user!;

    // Check permission to update notifications
    const hasPermission = await checkTenantPermissionById(user.id, tenantSlug, 'notifications', 'update');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    const body = await req.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Check if notification exists and belongs to tenant
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        targetTenantId: tenant.id,
        isActive: true
      }
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        updatedAt: new Date(),
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
      tenantId: user.tenantId,
      userId: user.id,
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
});

export const DELETE = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) => {
  try {
    const { tenantSlug, id } = await params;
    const user = req.user!;

    // Check permission to delete notifications
    const hasPermission = await checkTenantPermissionById(user.id, tenantSlug, 'notifications', 'delete');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Check if notification exists and belongs to tenant
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        targetTenantId: tenant.id,
        isActive: true
      }
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Soft delete notification
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    });

    // Create audit log
    await createAuditLog({
      action: 'notification_deleted',
      details: `Deleted notification: ${notification.title}`,
      tenantId: user.tenantId,
      userId: user.id,
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
});
