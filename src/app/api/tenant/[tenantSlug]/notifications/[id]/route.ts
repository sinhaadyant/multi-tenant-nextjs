import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/notifications/[id] - Get specific notification details
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true
      }
    });

    if (!currentUser || !currentUser.tenant || currentUser.tenant.slug !== tenantSlug || !currentUser.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Fetch the requested notification
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id
      },
      include: {
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'notifications.view', {
      tenantId: currentUser.tenant.id,
      notificationId: notification.id,
      title: notification.title
    });

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status: notification.status,
        recipientsCount: notification.recipients.length,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        sentAt: notification.sentAt,
        createdBy: notification.createdBy,
        recipients: notification.recipients.map(recipient => ({
          id: recipient.id,
          isRead: recipient.isRead,
          readAt: recipient.readAt,
          user: recipient.user
        }))
      }
    }, 'Notification details retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return createErrorResponse('Failed to fetch notification details', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/notifications/[id] - Update notification
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant and has admin permissions
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!currentUser || !currentUser.tenant || currentUser.tenant.slug !== tenantSlug || !currentUser.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user has permission to update notifications
    const canUpdateNotifications = currentUser.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'notifications' && 
        (rp.permission.action === 'update' || rp.permission.action === 'manage')
      )
    );

    if (!canUpdateNotifications) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    const body = await req.json();
    const { title, message, type, recipientIds } = body;

    // Check if notification exists and is editable
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id,
        status: 'draft' // Only allow editing draft notifications
      }
    });

    if (!existingNotification) {
      return createErrorResponse('Notification not found or cannot be edited', 404);
    }

    // Update notification
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: updateData,
      include: {
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Update recipients if provided
    if (recipientIds !== undefined) {
      // Remove existing recipients
      await prisma.notificationRecipient.deleteMany({
        where: { notificationId: id }
      });

      // Add new recipients
      if (recipientIds.length > 0) {
        const notificationRecipients = recipientIds.map((userId: string) => ({
          notificationId: id,
          userId,
          isRead: false
        }));

        await prisma.notificationRecipient.createMany({
          data: notificationRecipients
        });
      }
    }

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'notifications.update', {
      tenantId: currentUser.tenant.id,
      notificationId: id,
      title: updatedNotification.title,
      changes: { title, message, type, recipientIds }
    });

    return createSuccessResponse({
      notification: {
        id: updatedNotification.id,
        title: updatedNotification.title,
        message: updatedNotification.message,
        type: updatedNotification.type,
        status: updatedNotification.status,
        recipientsCount: updatedNotification.recipients.length,
        createdAt: updatedNotification.createdAt,
        updatedAt: updatedNotification.updatedAt,
        sentAt: updatedNotification.sentAt
      }
    }, 'Notification updated successfully');

  } catch (error: any) {
    console.error('Error updating notification:', error);
    return createErrorResponse('Failed to update notification', 500);
  }
});

// DELETE /api/tenant/[tenantSlug]/notifications/[id] - Delete notification
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant and has admin permissions
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!currentUser || !currentUser.tenant || currentUser.tenant.slug !== tenantSlug || !currentUser.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user has permission to delete notifications
    const canDeleteNotifications = currentUser.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'notifications' && 
        (rp.permission.action === 'delete' || rp.permission.action === 'manage')
      )
    );

    if (!canDeleteNotifications) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    // Check if notification exists
    const notificationToDelete = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id
      }
    });

    if (!notificationToDelete) {
      return createErrorResponse('Notification not found', 404);
    }

    // Delete notification recipients first
    await prisma.notificationRecipient.deleteMany({
      where: { notificationId: id }
    });

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'notifications.delete', {
      tenantId: currentUser.tenant.id,
      notificationId: id,
      title: notificationToDelete.title
    });

    return createSuccessResponse({}, 'Notification deleted successfully');

  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return createErrorResponse('Failed to delete notification', 500);
  }
}); 