import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/notifications - Get notifications list with filters and pagination
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
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';

    // Build where clause
    const where: any = {
      tenantId: user.tenant.id
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add type filter
    if (type) {
      where.type = type;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch notifications with pagination
    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    // Transform notifications data
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      status: notification.status,
      recipientsCount: notification.recipients.length,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      sentAt: notification.sentAt
    }));

    // Calculate stats
    const [total, sent, draft, error] = await Promise.all([
      prisma.notification.count({ where: { tenantId: user.tenant.id } }),
      prisma.notification.count({
        where: {
          tenantId: user.tenant.id,
          status: 'sent'
        }
      }),
      prisma.notification.count({
        where: {
          tenantId: user.tenant.id,
          status: 'draft'
        }
      }),
      prisma.notification.count({
        where: {
          tenantId: user.tenant.id,
          status: 'error'
        }
      })
    ]);

    const stats = {
      total,
      sent,
      draft,
      error
    };

    const pagination = {
      page,
      limit,
      total: totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
      hasNext: page < Math.ceil(totalNotifications / limit),
      hasPrev: page > 1
    };

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'notifications.list', {
      tenantId: user.tenant.id,
      filters: { search, status, type },
      pagination: { page, limit }
    });

    return createSuccessResponse({
      notifications: transformedNotifications,
      stats,
      pagination
    }, 'Notifications retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return createErrorResponse('Failed to fetch notifications', 500);
  }
});

// POST /api/tenant/[tenantSlug]/notifications - Create new notification
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
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

    // Verify user belongs to the tenant and has admin permissions
    const user = await prisma.user.findFirst({
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user has permission to create notifications
    const canCreateNotifications = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'notifications' && 
        (rp.permission.action === 'create' || rp.permission.action === 'manage')
      )
    );

    if (!canCreateNotifications) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    const body = await req.json();
    const { title, message, type, recipientIds, sendImmediately = false } = body;

    // Validate required fields
    if (!title || !message || !type) {
      return createErrorResponse('Missing required fields: title, message, type', 400);
    }

    // Validate type
    const validTypes = ['info', 'success', 'warning', 'error', 'announcement'];
    if (!validTypes.includes(type)) {
      return createErrorResponse('Invalid notification type', 400);
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        status: sendImmediately ? 'sent' : 'draft',
        tenantId: user.tenant.id,
        createdBy: user.id,
        sentAt: sendImmediately ? new Date() : null
      }
    });

    // Add recipients if provided
    if (recipientIds && recipientIds.length > 0) {
      const notificationRecipients = recipientIds.map((userId: string) => ({
        notificationId: notification.id,
        userId,
        isRead: false
      }));

      await prisma.notificationRecipient.createMany({
        data: notificationRecipients
      });
    } else {
      // If no specific recipients, add all active users in the tenant
      const allUsers = await prisma.user.findMany({
        where: {
          tenantId: user.tenant.id,
          isActive: true
        },
        select: { id: true }
      });

      const notificationRecipients = allUsers.map(user => ({
        notificationId: notification.id,
        userId: user.id,
        isRead: false
      }));

      await prisma.notificationRecipient.createMany({
        data: notificationRecipients
      });
    }

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'notifications.create', {
      tenantId: user.tenant.id,
      notificationId: notification.id,
      title: notification.title,
      sendImmediately
    });

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status: notification.status,
        createdAt: notification.createdAt,
        sentAt: notification.sentAt
      }
    }, 'Notification created successfully');

  } catch (error: any) {
    console.error('Error creating notification:', error);
    return createErrorResponse('Failed to create notification', 500);
  }
}); 