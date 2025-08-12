import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  let filters: any;
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    console.log('Authentication successful for user:', authResult.user?.email);

    const { searchParams } = new URL(req.url);
    filters = {
      search: searchParams.get('search') || undefined,
      type: searchParams.getAll('type'),
      status: searchParams.getAll('status'),
      priority: searchParams.getAll('priority'),
      targetType: searchParams.getAll('targetType'),
      dateRange: searchParams.get('dateRange') ? (() => {
        try {
          return JSON.parse(searchParams.get('dateRange')!);
        } catch (e) {
          console.warn('Invalid dateRange JSON:', searchParams.get('dateRange'));
          return undefined;
        }
      })() : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (filters.search && filters.search.trim() && filters.search.length > 0) {
      const searchTerm = filters.search.trim();
      // Sanitize search term to prevent SQL injection
      if (searchTerm.length <= 100) { // Limit search term length
        where.OR = [
          { title: { contains: searchTerm } },
          { message: { contains: searchTerm } },
        ];
      }
    }

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.targetType && filters.targetType.length > 0) {
      where.targetType = { in: filters.targetType };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end),
      };
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        orderBy: {
          [filters.sortBy]: filters.sortOrder,
        },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    // If no notifications found, return empty response instead of error
    if (notifications.length === 0) {
      const emptyResponse = {
        notifications: [],
        stats: {
          total: 0,
          draft: 0,
          sent: 0,
          scheduled: 0,
          cancelled: 0,
        },
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          totalPages: 0,
        },
      };
      return createSuccessResponse(emptyResponse, 'Notifications retrieved successfully');
    }

    // Get stats
    const stats = await prisma.notification.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: {
        status: true,
      },
    });

    const statsMap = {
      total,
      draft: 0,
      sent: 0,
      scheduled: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      statsMap[stat.status as keyof typeof statsMap] = stat._count.status;
    });

    const response = {
      notifications,
      stats: statsMap,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };

    return createSuccessResponse(response, 'Notifications retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      filters: filters
    });
    return createErrorResponse(`Internal server error: ${error.message}`, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    console.log('Authentication successful for user:', authResult.user?.email);

    const body = await req.json();
    
    // Basic validation
    if (!body.title || !body.message || !body.type || !body.priority || !body.targetType) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Prepare notification data
    const notificationData: any = {
      title: body.title,
      message: body.message,
      type: body.type,
      priority: body.priority,
      targetType: body.targetType,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      attachments: body.attachments ? JSON.stringify(body.attachments) : null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      createdBy: authResult.user.id,
      createdByType: 'superadmin',
      status: body.scheduledAt ? 'scheduled' : 'draft',
    };

    // Handle targetTenantId based on targetType
    if (body.targetType === 'tenant' && body.targetTenantId) {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: body.targetTenantId }
      });
      if (!tenant) {
        return createErrorResponse('Target tenant not found', 400);
      }
      notificationData.targetTenantId = body.targetTenantId;
    } else {
      // For superadmin, all, or other types, set targetTenantId to null
      notificationData.targetTenantId = null;
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: notificationData,
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
      action: 'notification_created',
      superAdminId: authResult.user.id,
      resourceType: 'NOTIFICATION',
      resourceId: notification.id,
      details: `Created notification: ${notification.title}`,
    });

    return createSuccessResponse({ notification }, 'Notification created successfully');
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
