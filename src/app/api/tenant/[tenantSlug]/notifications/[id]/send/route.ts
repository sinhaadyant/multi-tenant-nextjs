import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// POST /api/tenant/[tenantSlug]/notifications/[id]/send - Send notification
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    // Check if user has permission to send notifications
    const canSendNotifications = currentUser.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'notifications' && 
        (rp.permission.action === 'send' || rp.permission.action === 'manage')
      )
    );

    if (!canSendNotifications) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    // Check if notification exists and is in draft status
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id,
        status: 'draft'
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
        }
      }
    });

    if (!notification) {
      return createErrorResponse('Notification not found or cannot be sent', 404);
    }

    // Update notification status to sent
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date()
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
        }
      }
    });

    // Here you would typically integrate with your notification service
    // (email, push notifications, SMS, etc.)
    // For now, we'll just mark the notification as sent

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'notifications.send', {
      tenantId: currentUser.tenant.id,
      notificationId: id,
      title: notification.title,
      recipientsCount: notification.recipients.length
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
    }, 'Notification sent successfully');

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return createErrorResponse('Failed to send notification', 500);
  }
}); 