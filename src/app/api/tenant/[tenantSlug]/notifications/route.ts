import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  targetUsers: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional()
});

const updateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  message: z.string().min(1, 'Message is required').optional(),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  isRead: z.boolean().optional(),
  isActive: z.boolean().optional()
});

// GET /api/tenant/[tenantSlug]/notifications - Get notifications for tenant
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const type = url.searchParams.get('type') || '';
    const priority = url.searchParams.get('priority') || '';
    const isRead = url.searchParams.get('isRead') || '';
    const isActive = url.searchParams.get('isActive') || '';

         // Build where clause - only show notifications from this tenant
     const where: any = {
       targetTenantId: tenantId
     };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } }
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

    // Add read status filter
    if (isRead !== '') {
      where.isRead = isRead === 'true';
    }

    // Add active status filter
    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notifications with pagination and stats
    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          userNotifications: {
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
      }),
      prisma.notification.count({ where })
    ]);

    // Calculate statistics
    const notificationStats = {
      total: totalNotifications,
      unread: await prisma.userNotification.count({
        where: { 
          notification: { targetTenantId: tenantId },
          isRead: false
        }
      }),
      read: await prisma.userNotification.count({
        where: { 
          notification: { targetTenantId: tenantId },
          isRead: true
        }
      }),
      active: await prisma.notification.count({
        where: { ...where, isActive: true }
      })
    };

    // Format response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      isActive: notification.isActive,
      scheduledAt: notification.scheduledAt,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      createdBy: notification.superAdmin,
      targetUsers: notification.userNotifications.map(un => un.user),
      targetUserCount: notification.userNotifications.length
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
        canView: true, // All authenticated users can view notifications in their tenant
        canCreate: true, // Simplified for now
        canUpdate: true,
        canDelete: true
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

    const body = await req.json();
    const validatedData = createNotificationSchema.parse(body);

    // Create notification
    const newNotification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
                 targetTenantId: tenantId,
         createdByType: 'user',
         metadata: JSON.stringify({
           createdByUserId: userId,
           createdByUser: {
             id: req.user!.id,
             email: req.user!.email
           }
         }),
        isActive: true,
        isRead: false,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
      }
    });

         // Create user notification records if target users are specified
     if (validatedData.targetUsers && validatedData.targetUsers.length > 0) {
       const userNotifications = validatedData.targetUsers.map(targetUserId => ({
         notificationId: newNotification.id,
         userId: targetUserId,
         isRead: false
       }));

       await prisma.userNotification.createMany({
         data: userNotifications
       });
     }

    return createSuccessResponse({
      notification: {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority,
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
    const { action, notificationIds, data } = body;

         // Verify all notifications belong to the tenant
     const notifications = await prisma.notification.findMany({
       where: {
         id: { in: notificationIds },
         targetTenantId: tenantId
       }
     });

    if (notifications.length !== notificationIds.length) {
      return createErrorResponse('Some notifications not found or do not belong to this tenant', 400);
    }

    let result;
    switch (action) {
             case 'mark_read':
         result = await prisma.userNotification.updateMany({
           where: { 
             notificationId: { in: notificationIds },
             userId: userId
           },
           data: { isRead: true }
         });
         break;
       case 'mark_unread':
         result = await prisma.userNotification.updateMany({
           where: { 
             notificationId: { in: notificationIds },
             userId: userId
           },
           data: { isRead: false }
         });
         break;
             case 'activate':
         result = await prisma.notification.updateMany({
           where: { id: { in: notificationIds }, targetTenantId: tenantId },
           data: { isActive: true }
         });
         break;
       case 'deactivate':
         result = await prisma.notification.updateMany({
           where: { id: { in: notificationIds }, targetTenantId: tenantId },
           data: { isActive: false }
         });
         break;
       case 'delete':
         // Delete user notifications first
         await prisma.userNotification.deleteMany({
           where: { notificationId: { in: notificationIds } }
         });
         
         result = await prisma.notification.deleteMany({
           where: { id: { in: notificationIds }, targetTenantId: tenantId }
         });
         break;
      case 'update':
        if (!data) {
          return createErrorResponse('Update data is required for update action', 400);
        }
        const validatedData = updateNotificationSchema.parse(data);
                 result = await prisma.notification.updateMany({
           where: { id: { in: notificationIds }, targetTenantId: tenantId },
           data: validatedData
         });
        break;
      default:
        return createErrorResponse('Invalid action', 400);
    }

    return createSuccessResponse({
      action,
      affectedNotifications: result.count,
      notificationIds
    }, `Bulk action '${action}' completed successfully`);

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