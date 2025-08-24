import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

export const GET = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    const user = req.user!;

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get('status') || 'all', // all, read, unread
      type: searchParams.getAll('type'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
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

    // Add type filter if specified
    if (filters.type && filters.type.length > 0) {
      where.notification = {
        type: {
          in: filters.type
        }
      };
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    // Get user notifications with pagination
    const [userNotifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        include: {
          notification: {
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
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          [filters.sortBy]: filters.sortOrder,
        },
        skip,
        take,
      }),
      prisma.userNotification.count({ where }),
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
        id: userNotif.notification.createdBy,
        name: 'System',
        email: 'system@example.com',
      },
    }));

    // Get unread count for the user
    const unreadCount = await prisma.userNotification.count({
      where: {
        userId: user.id,
        isActive: true,
        isRead: false,
      },
    });

    const response = {
      notifications,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
      unreadCount,
      lastUpdated: new Date().toISOString(),
    };

    return createSuccessResponse(response, 'User notifications retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching user notifications:', error);
    return createErrorResponse('Internal server error', 500);
  }
});

export const PATCH = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    const user = req.user!;

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
    console.error('Error marking notifications as read:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
