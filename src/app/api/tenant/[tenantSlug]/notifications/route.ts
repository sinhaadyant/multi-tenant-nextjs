import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireTenantAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';

// Validation schemas
const notificationFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  targetType: z.enum(['user', 'specific_tenant', 'all_tenants']).default('user'),
  metadata: z.record(z.any()).optional()
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  
  if (!tenantSlug) {
    return createErrorResponse('Tenant slug is required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    return createErrorResponse('Tenant is inactive', 403);
  }

  // Verify user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Parse and validate query parameters
  const filters = notificationFiltersSchema.parse(Object.fromEntries(searchParams));
  
  // Calculate pagination
  const skip = (filters.page - 1) * filters.limit;
  
  // Build where clause for notifications
  const where: any = {
    OR: [
      // User-specific notifications
      { 
        targetType: 'user',
        targetTenantId: tenant.id,
        // Add user-specific targeting if needed
      },
      // Tenant-specific notifications
      { 
        targetType: 'specific_tenant',
        targetTenantId: tenant.id
      },
      // All tenants notifications
      { 
        targetType: 'all_tenants'
      }
    ]
  };

  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      ...where.OR,
      { title: { contains: filters.search } },
      { message: { contains: filters.search } },
    ];
  }

  // Get notifications with pagination
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  // Get notification statistics
  const stats = await prisma.notification.groupBy({
    by: ['priority'],
    where: {
      OR: [
        { targetType: 'user', targetTenantId: tenant.id },
        { targetType: 'specific_tenant', targetTenantId: tenant.id },
        { targetType: 'all_tenants' }
      ]
    },
    _count: {
      priority: true
    }
  });

  const notificationStats = {
    total: total,
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }
  };

  stats.forEach(stat => {
    if (stat._count && stat._count.priority) {
      notificationStats.byPriority[stat.priority as keyof typeof notificationStats.byPriority] += stat._count.priority;
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Tenant notifications fetched successfully:', notifications.length);
  }

  return createSuccessResponse({
    notifications,
    stats: notificationStats
  }, 'Notifications fetched successfully', 200, {
    page: filters.page,
    limit: filters.limit,
    totalPages,
    totalRecords: total
  });
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  
  if (!tenantSlug) {
    return createErrorResponse('Tenant slug is required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    return createErrorResponse('Tenant is inactive', 403);
  }

  // Verify user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  const body = await req.json();
  
  // Validate request body
  const validationResult = createNotificationSchema.safeParse(body);
  if (!validationResult.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    );
  }

  const { title, message, priority, targetType, metadata } = validationResult.data;

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      title: title.trim(),
      message: message.trim(),
      priority,
      targetType,
      targetTenantId: tenant.id,
      createdBy: null, // Set to null since it references SuperAdmin
      createdByType: 'user',
      metadata: metadata ? JSON.stringify({
        ...metadata,
        createdByUserId: user.id,
        createdByUserEmail: user.email,
        createdByUserName: user.name
      }) : JSON.stringify({
        createdByUserId: user.id,
        createdByUserEmail: user.email,
        createdByUserName: user.name
      }),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Tenant notification created successfully:', notification.id);
  }

  return createSuccessResponse({
    notification
  }, 'Notification created successfully', 201);
});