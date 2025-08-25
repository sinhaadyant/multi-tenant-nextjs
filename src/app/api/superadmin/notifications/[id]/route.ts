import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET /api/superadmin/notifications/[id] - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const { id } = await params;
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const { id } = await params;
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
      superAdminId: (authResult.user as any).id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const { id } = await params;
    
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
      superAdminId: (authResult.user as any).id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(request);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: id }
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    // Parse metadata to get target information
    let metadata: any = {};
    if (notification.metadata) {
      try {
        metadata = typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : notification.metadata;
      } catch (error) {
        console.warn('Failed to parse notification metadata:', error);
      }
    }

    // Extract target information from metadata
    const selectedTargets = metadata.selectedTargets || [];
    const targetUserIds = selectedTargets
      .filter((target: any) => target.type === 'user')
      .map((target: any) => target.id);

    console.log('🔍 Sending notification with targets:', {
      notificationId: id,
      targetType: notification.targetType,
      targetUserIds,
      targetTenantId: notification.targetTenantId,
      selectedTargets
    });

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

    // Deliver notifications to users
    try {
      console.log('📨 Starting notification delivery...');
      console.log('🔍 Delivery parameters:', {
        notificationId: notification.id,
        targetType: notification.targetType,
        targetUserIds,
        targetTenantId: notification.targetTenantId
      });

      const { deliverNotificationToUsers } = await import('@/lib/notificationUtils');
      
      const deliveryResult = await deliverNotificationToUsers(
        notification.id,
        notification.targetType,
        targetUserIds,
        notification.targetTenantId || undefined
      );

      console.log('📨 Notification delivery result:', deliveryResult);

      if (!deliveryResult.success) {
        console.error('❌ Notification delivery failed:', deliveryResult.errors);
      }

      if (deliveryResult.deliveredCount === 0) {
        console.warn('⚠️ No notifications were delivered to users');
      }

      // Send notification via Socket.io if available
      if (deliveryResult.deliveredCount > 0 && (global as any).sendNotification) {
        console.log('🔌 Broadcasting notification via Socket.io...');
        
        const socketNotification = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt,
          createdBy: {
            id: (authResult.user as any).id,
            name: (authResult.user as any).name,
            email: (authResult.user as any).email
          }
        } as any;

        switch (notification.targetType) {
          case 'specific_users':
            if (targetUserIds && targetUserIds.length > 0) {
              console.log('🔌 Broadcasting to specific users:', targetUserIds);
              (global as any).sendNotification('user', targetUserIds, socketNotification);
            }
            break;
          case 'entire_tenant':
            if (notification.targetTenantId) {
              (global as any).sendNotification('tenant', [notification.targetTenantId], socketNotification);
            }
            break;
          case 'superadmin':
            (global as any).sendNotification('superadmin', [], socketNotification);
            break;
          case 'all':
            (global as any).sendNotification('all', [], socketNotification);
            break;
        }
      }
    } catch (deliveryError: any) {
      console.error('❌ Error delivering notifications:', deliveryError);
      console.error('❌ Error details:', {
        message: deliveryError.message,
        stack: deliveryError.stack,
        name: deliveryError.name
      });
      // Don't fail the request if delivery fails
    }

    // Create audit log
    try {
      await createAuditLog({
        action: 'notification_sent',
        superAdminId: (authResult.user as any).id,
        resourceType: 'NOTIFICATION',
        resourceId: notification.id,
        details: `Sent notification: ${notification.title} to ${targetUserIds.length} users`,
      });
    } catch (auditError) {
      console.error('❌ Error creating audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    return createSuccessResponse({ 
      notification: updatedNotification,
      deliveryResult: {
        deliveredCount: targetUserIds.length,
        targetUserIds
      }
    }, 'Notification sent successfully');
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 