import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    
    // Get user email from header (for header notifications, we'll be more lenient)
    const userEmail = req.headers.get('X-User-Email');
    
    if (!userEmail) {
      return createErrorResponse('User email required', 400);
    }

    // Find user by email and tenant slug (more lenient approach)
    const user = await prisma.user.findFirst({
      where: {
        email: userEmail,
        tenant: {
          slug: tenantSlug,
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get('status') || 'all', // all, read, unread
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Build where clause for user notifications
    const where: any = {
      userId: user.id,
      isActive: true,
    };

    if (filters.status === 'read') {
      where.isRead = true;
    } else if (filters.status === 'unread') {
      where.isRead = false;
    }

    // Get user notifications for header (limited and simplified)
    const [userNotifications, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              message: true,
              type: true,
              priority: true,
              createdAt: true,
              superAdmin: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters.limit,
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({
        where: {
          userId: user.id,
          isActive: true,
          isRead: false,
        },
      }),
    ]);

    // Transform the data to match the expected format
    const notifications = userNotifications.map((userNotif) => ({
      id: userNotif.id,
      notificationId: userNotif.notificationId,
      title: userNotif.notification.title,
      message: userNotif.notification.message,
      type: userNotif.notification.type,
      priority: userNotif.notification.priority,
      status: userNotif.isRead ? 'read' : 'unread',
      readAt: userNotif.readAt,
      createdAt: userNotif.createdAt,
      notificationCreatedAt: userNotif.notification.createdAt,
      createdBy: userNotif.notification.superAdmin || {
        id: 'system',
        name: 'System',
        email: 'system@example.com',
      },
    }));

    const response = {
      data: {
        notifications,
        unreadCount,
        lastUpdated: new Date().toISOString(),
      }
    };

    return createSuccessResponse(response, 'Header notifications retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching header notifications:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    
    // Get user email from header
    const userEmail = req.headers.get('X-User-Email');
    
    if (!userEmail) {
      return createErrorResponse('User email required', 400);
    }

    // Find user by email and tenant slug
    const user = await prisma.user.findFirst({
      where: {
        email: userEmail,
        tenant: {
          slug: tenantSlug,
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user notifications as read
      await prisma.userNotification.updateMany({
        where: {
          userId: user.id,
          isActive: true,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return createSuccessResponse(
        { message: 'All notifications marked as read' },
        'All notifications marked as read successfully'
      );
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.userNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
          isActive: true,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return createSuccessResponse(
        { message: 'Notifications marked as read' },
        'Notifications marked as read successfully'
      );
    }

    return createErrorResponse('Invalid request body', 400);
  } catch (error: any) {
    console.error('Error marking header notifications as read:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
