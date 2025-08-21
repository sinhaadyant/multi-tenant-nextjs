import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.string().default('info'),
  priority: z.string().default('medium'),
  isActive: z.boolean().default(true),
  status: z.string().default('draft'),
  recipients: z.array(z.string()).optional()
});

const bulkActionSchema = z.object({
  notificationIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'markAsRead', 'markAsUnread'])
});

// GET /api/tenant/[tenantSlug]/notifications - Get notifications list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.view');
    const hasViewAllPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.viewAll');
    
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
    const priority = url.searchParams.get('priority') || '';
    const status = url.searchParams.get('status') || '';

    // Build where clause
    const where: any = {
      targetTenantId: tenantId
    };

    // Scope to own notifications if user doesn't have viewAll permission
    if (!hasViewAllPermission) {
      where.userNotifications = {
        some: {
          userId: userId
        }
      };
    }

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

    // Add priority filter
    if (priority) {
      where.priority = priority;
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
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
            where: { userId: userId },
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
    const notificationStats = {
      total: totalNotifications,
      active: notifications.filter(n => n.isActive).length,
      inactive: notifications.filter(n => !n.isActive).length,
      byType: notifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: notifications.reduce((acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      unread: notifications.filter(n => 
        n.userNotifications.some(un => !un.isRead)
      ).length
    };

    // Format response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isActive: notification.isActive,
      status: notification.status,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      userNotifications: notification.userNotifications,
      recipientCount: notification._count.userNotifications,
      isRead: notification.userNotifications.some(un => un.isRead)
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
      stats: notificationStats,
      permissions: {
        canView: hasViewPermission,
        canViewAll: hasViewAllPermission,
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

    // Create notification
    const newNotification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
        status: validatedData.status,
        targetTenantId: tenantId,
        targetType: 'specific_tenant',
        createdByType: 'user',
        // Note: createdBy is null since it references SuperAdmin, not User
        // We store the actual user info in metadata instead
        metadata: JSON.stringify({
          createdByUserId: userId,
          createdByUser: {
            id: req.user!.id,
            email: req.user!.email
          }
        })
      }
    });

    // Create user notification records if recipients are specified
    if (validatedData.recipients && validatedData.recipients.length > 0) {
      const userNotifications = validatedData.recipients.map(recipientId => ({
        notificationId: newNotification.id,
        userId: recipientId,
        isRead: false
      }));

      await prisma.userNotification.createMany({
        data: userNotifications
      });
    }

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'notification.created', {
      details: `Created notification: ${newNotification.title}`,
      resource: 'notification',
      resourceId: newNotification.id
    });

    return createSuccessResponse({
      notification: {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority,
        isActive: newNotification.isActive,
        status: newNotification.status,
        createdAt: newNotification.createdAt
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

// PUT /api/tenant/[tenantSlug]/notifications - Bulk actions
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const body = await req.json();
    const validatedData = bulkActionSchema.parse(body);

    // Check permissions based on action
    let hasPermission = false;
    switch (validatedData.action) {
      case 'activate':
      case 'deactivate':
        hasPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.update');
        break;
      case 'delete':
        hasPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.delete');
        break;
      case 'markAsRead':
      case 'markAsUnread':
        hasPermission = await checkTenantPermission(req.user!, tenantId!, 'notifications.update');
        break;
    }

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions for this action', 403);
    }

    // Verify all notifications belong to the tenant
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: validatedData.notificationIds },
        targetTenantId: tenantId
      }
    });

    if (notifications.length !== validatedData.notificationIds.length) {
      return createErrorResponse('Some notifications not found or do not belong to this tenant', 400);
    }

    let result;
    switch (validatedData.action) {
      case 'activate':
        result = await prisma.notification.updateMany({
          where: { 
            id: { in: validatedData.notificationIds }, 
            targetTenantId: tenantId
          },
          data: { isActive: true }
        });
        break;
      case 'deactivate':
        result = await prisma.notification.updateMany({
          where: { 
            id: { in: validatedData.notificationIds }, 
            targetTenantId: tenantId
          },
          data: { isActive: false }
        });
        break;
      case 'delete':
        // Delete user notifications first
        await prisma.userNotification.deleteMany({
          where: { notificationId: { in: validatedData.notificationIds } }
        });

        result = await prisma.notification.deleteMany({
          where: { 
            id: { in: validatedData.notificationIds }, 
            targetTenantId: tenantId
          }
        });
        break;
      case 'markAsRead':
        result = await prisma.userNotification.updateMany({
          where: { 
            notificationId: { in: validatedData.notificationIds },
            userId: userId
          },
          data: { isRead: true }
        });
        break;
      case 'markAsUnread':
        result = await prisma.userNotification.updateMany({
          where: { 
            notificationId: { in: validatedData.notificationIds },
            userId: userId
          },
          data: { isRead: false }
        });
        break;
    }

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, `notifications.${validatedData.action}`, {
      details: `${validatedData.action} action performed on ${validatedData.notificationIds.length} notifications`,
      resource: 'notification',
      resourceId: validatedData.notificationIds.join(',')
    });

    return createSuccessResponse({
      action: validatedData.action,
      affectedNotifications: result.count,
      notificationIds: validatedData.notificationIds
    }, `Bulk action '${validatedData.action}' completed successfully`);

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to perform bulk action',
      error.status || 500
    );
  }
});