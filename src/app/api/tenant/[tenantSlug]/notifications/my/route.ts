import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/notifications/my - Get user's notifications
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
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
    const user = await prisma.user.findFirst({
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch user's notifications
    const [userNotifications, totalNotifications] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where: {
          userId: user.id,
          notification: {
            tenantId: user.tenant.id
          }
        },
        include: {
          notification: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          notification: {
            [sortBy]: sortOrder
          }
        },
        skip,
        take: limit
      }),
      prisma.notificationRecipient.count({
        where: {
          userId: user.id,
          notification: {
            tenantId: user.tenant.id
          }
        }
      })
    ]);

    // Transform notifications data
    const transformedNotifications = userNotifications.map(userNotification => ({
      id: userNotification.notification.id,
      title: userNotification.notification.title,
      message: userNotification.notification.message,
      type: userNotification.notification.type,
      isRead: userNotification.isRead,
      readAt: userNotification.readAt,
      createdAt: userNotification.notification.createdAt,
      sentAt: userNotification.notification.sentAt,
      createdBy: userNotification.notification.createdBy
    }));

    const pagination = {
      page,
      limit,
      total: totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
      hasNext: page < Math.ceil(totalNotifications / limit),
      hasPrev: page > 1
    };

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'notifications.my.list', {
      tenantId: user.tenant.id,
      pagination: { page, limit }
    });

    return createSuccessResponse({
      notifications: transformedNotifications,
      pagination
    }, 'User notifications retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching user notifications:', error);
    return createErrorResponse('Failed to fetch user notifications', 500);
  }
});

// PATCH /api/tenant/[tenantSlug]/notifications/my - Mark notification as read
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
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
    const user = await prisma.user.findFirst({
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return createErrorResponse('Notification ID is required', 400);
    }

    // Check if user has access to this notification
    const userNotification = await prisma.notificationRecipient.findFirst({
      where: {
        userId: user.id,
        notificationId,
        notification: {
          tenantId: user.tenant.id
        }
      },
      include: {
        notification: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!userNotification) {
      return createErrorResponse('Notification not found or access denied', 404);
    }

    // Mark notification as read
    const updatedUserNotification = await prisma.notificationRecipient.update({
      where: {
        id: userNotification.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'notifications.my.mark-read', {
      tenantId: user.tenant.id,
      notificationId,
      title: userNotification.notification.title
    });

    return createSuccessResponse({
      notification: {
        id: updatedUserNotification.notification.id,
        title: updatedUserNotification.notification.title,
        type: updatedUserNotification.notification.type,
        isRead: updatedUserNotification.isRead,
        readAt: updatedUserNotification.readAt
      }
    }, 'Notification marked as read successfully');

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return createErrorResponse('Failed to mark notification as read', 500);
  }
}); 