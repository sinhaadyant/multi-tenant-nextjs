import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createNotificationSchema, notificationFiltersSchema } from '@/lib/validations/superadmin';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { checkTenantPermissionById } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export const GET = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    const user = req.user!;

    // Check permission to view notifications
    const hasPermission = await checkTenantPermissionById(user.id, tenantSlug, 'notifications', 'view');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      type: searchParams.getAll('type'),
      status: searchParams.getAll('status'),
      priority: searchParams.getAll('priority'),
      targetType: searchParams.getAll('targetType'),
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')!) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Validate filters
    const validatedFilters = notificationFiltersSchema.parse(filters);

    // Build where clause for tenant notifications
    const where: any = {
      isActive: true,
      OR: [
        { targetTenantId: user.tenantId },
        { targetType: 'multiple_tenants' },
        { targetType: 'entire_tenant' },
      ],
    };

    if (validatedFilters.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: validatedFilters.search, mode: 'insensitive' } },
            { message: { contains: validatedFilters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (validatedFilters.type && validatedFilters.type.length > 0) {
      where.type = { in: validatedFilters.type };
    }

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      where.status = { in: validatedFilters.status };
    }

    if (validatedFilters.priority && validatedFilters.priority.length > 0) {
      where.priority = { in: validatedFilters.priority };
    }

    if (validatedFilters.targetType && validatedFilters.targetType.length > 0) {
      where.targetType = { in: validatedFilters.targetType };
    }

    if (validatedFilters.dateRange) {
      where.createdAt = {
        gte: new Date(validatedFilters.dateRange.start),
        lte: new Date(validatedFilters.dateRange.end),
      };
    }

    // Calculate pagination
    const skip = (validatedFilters.page - 1) * validatedFilters.limit;
    const take = validatedFilters.limit;

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
              userNotifications: {
                where: {
                  tenantId: user.tenantId,
                },
              },
            },
          },
        },
        orderBy: {
          [validatedFilters.sortBy]: validatedFilters.sortOrder,
        },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    // Get stats for this tenant
    const stats = await prisma.notification.groupBy({
      by: ['status'],
      where: {
        isActive: true,
        OR: [
          { targetTenantId: user.tenantId },
          { targetType: 'multiple_tenants' },
          { targetType: 'entire_tenant' },
        ],
      },
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
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        totalPages: Math.ceil(total / validatedFilters.limit),
      },
    };

    return createSuccessResponse(response, 'Notifications retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching tenant notifications:', error);
    return createErrorResponse('Internal server error', 500);
  }
});

export const POST = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    const user = req.user!;

    // Check permission to create notifications
    const hasPermission = await checkTenantPermissionById(user.id, tenantSlug, 'notifications', 'create');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const body = await req.json();
    const validatedData = createNotificationSchema.parse(body);

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        targetTenantId: tenant.id, // Use actual tenant ID
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
        createdByType: 'tenant_admin',
        status: validatedData.scheduledAt ? 'scheduled' : 'draft',
      },
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
      details: `Created notification: ${notification.title}`,
      tenantId: user.tenantId,
      userId: user.id,
      metadata: {
        notificationId: notification.id,
        targetType: notification.targetType,
        type: notification.type,
        priority: notification.priority,
      },
    });

    return createSuccessResponse({ notification }, 'Notification created successfully');
  } catch (error: any) {
    console.error('Error creating tenant notification:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    return createErrorResponse('Internal server error', 500);
  }
});