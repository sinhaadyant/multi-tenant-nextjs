import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';
import notificationServer from '@/lib/websocket-server';

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  type: z.enum(['info', 'warning', 'error', 'success', 'announcement']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  targetType: z.enum(['all_tenant_users', 'specific_users']),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'sent', 'scheduled']).default('draft')
});

const updateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long').optional(),
  type: z.enum(['info', 'warning', 'error', 'success', 'announcement']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  targetType: z.enum(['all_tenant_users', 'specific_users']).optional(),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'sent', 'scheduled']).optional()
});

// GET /api/tenant/[tenantSlug]/notifications - Get notifications list
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view notifications', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const priority = url.searchParams.get('priority') || '';

    // Build where clause
    const where: any = {
      targetTenantId: tenantId,
      isActive: true
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add type filter
    if (type) {
      where.type = type;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add priority filter
    if (priority) {
      where.priority = priority;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notifications with pagination
    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          userNotifications: {
            select: {
              id: true,
              userId: true,
              isRead: true,
              readAt: true
            }
          },
          _count: {
            select: {
              userNotifications: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.notification.groupBy({
      by: ['status'],
      where: { targetTenantId: tenantId, isActive: true },
      _count: {
        status: true
      }
    });

    const statsMap = {
      total: totalNotifications,
      draft: 0,
      sent: 0,
      scheduled: 0
    };

    stats.forEach((stat) => {
      if (stat._count && stat.status) {
        statsMap[stat.status as keyof typeof statsMap] = stat._count.status;
      }
    });

    // Format response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      targetType: notification.targetType,
      status: notification.status,
      scheduledAt: notification.scheduledAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      createdBy: notification.createdBy,
      recipientsCount: notification._count.userNotifications,
      readCount: notification.userNotifications.filter(un => un.isRead).length
    }));

    return createSuccessResponse({
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit),
        hasNext: page * limit < totalNotifications,
        hasPrev: page > 1
      },
      stats: statsMap,
      permissions: {
        canView: hasViewPermission,
        canCreate: await checkTenantPermission(req.user!, tenantId!, 'notifications.create'),
        canUpdate: await checkTenantPermission(req.user!, tenantId!, 'notifications.update'),
        canDelete: await checkTenantPermission(req.user!, tenantId!, 'notifications.delete')
      }
    }, 'Notifications retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch notifications',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/notifications - Create new notification
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check create permission
    const hasCreatePermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.create');
    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create notifications', 403);
    }

    const body = await req.json();
    const validatedData = createNotificationSchema.parse(body);

    // Validate target users if specific users are selected
    if (validatedData.targetType === 'specific_users') {
      if (!validatedData.targetUserIds || validatedData.targetUserIds.length === 0) {
        return createErrorResponse('Target user IDs are required for specific users', 400);
      }

      // Verify all target users belong to the same tenant
      const targetUsers = await prisma.user.findMany({
        where: {
          id: { in: validatedData.targetUserIds },
          tenantId: tenantId
        },
        select: { id: true }
      });

      if (targetUsers.length !== validatedData.targetUserIds.length) {
        return createErrorResponse('Some target users do not belong to this tenant', 400);
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        status: validatedData.status,
        targetTenantId: tenantId,
        createdBy: null,
        createdByType: 'tenant_admin'
      }
    });

    // Create user notifications if status is 'sent'
    if (validatedData.status === 'sent') {
      let targetUsers: string[] = [];

      if (validatedData.targetType === 'all_tenant_users') {
        // Get all active users in the tenant
        const tenantUsers = await prisma.user.findMany({
          where: {
            tenantId: tenantId,
            isActive: true
          },
          select: { id: true }
        });
        targetUsers = tenantUsers.map(user => user.id);
      } else if (validatedData.targetType === 'specific_users' && validatedData.targetUserIds) {
        targetUsers = validatedData.targetUserIds;
      }

      // Create user notifications
      if (targetUsers.length > 0) {
        const userNotifications = targetUsers.map(userId => ({
          notificationId: notification.id,
          userId: userId,
          isActive: true
        }));

        await prisma.userNotification.createMany({
          data: userNotifications
        });

        // Broadcast via WebSocket
        try {
          const wsNotification = {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type as any,
            priority: notification.priority,
            createdAt: notification.createdAt,
            createdBy: notification.createdBy
          };

          if (validatedData.targetType === 'all_tenant_users') {
            await notificationServer.broadcastNotification(wsNotification, 'tenant', [tenantId]);
          } else if (validatedData.targetType === 'specific_users' && validatedData.targetUserIds) {
            await notificationServer.broadcastNotification(wsNotification, 'user', validatedData.targetUserIds);
          }
        } catch (wsError) {
          console.error('WebSocket broadcast error:', wsError);
        }
      }
    }

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'notification.created', {
      details: `Created notification: ${notification.title}`,
      resource: 'notification',
      resourceId: notification.id
    });

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        type: notification.type,
        status: notification.status,
        createdAt: notification.createdAt
      }
    }, 'Notification created successfully');

  } catch (error: any) {
    console.error('Error creating notification:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to create notification',
      error.status || 500
    );
  }
});

