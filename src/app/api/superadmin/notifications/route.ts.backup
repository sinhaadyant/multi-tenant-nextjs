import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLog } from '@/lib/audit';

// POST /api/superadmin/notifications - Send notification
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Creating notification');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;
  const body = await req.json();

  const { title, message, targetType, targetTenantId, priority = 'medium' } = body;

  // Validation
  if (!title || title.trim().length === 0) {
    return createErrorResponse('Title is required', 400);
  }

  if (title.length > 100) {
    return createErrorResponse('Title must be 100 characters or less', 400);
  }

  if (!message || message.trim().length === 0) {
    return createErrorResponse('Message is required', 400);
  }

  if (message.length > 500) {
    return createErrorResponse('Message must be 500 characters or less', 400);
  }

  if (!targetType || !['superadmin', 'all_tenants', 'specific_tenant'].includes(targetType)) {
    return createErrorResponse('Invalid target type', 400);
  }

  if (targetType === 'specific_tenant' && !targetTenantId) {
    return createErrorResponse('Target tenant ID is required for specific tenant notifications', 400);
  }

  if (!['low', 'medium', 'high'].includes(priority)) {
    return createErrorResponse('Invalid priority level', 400);
  }

  try {
    let notifications = [];

    if (targetType === 'superadmin') {
      // Get all superadmins
      const superAdmins = await prisma.superAdmin.findMany({
        where: { isActive: true }
      });

      // Create notifications for each superadmin
      notifications = await Promise.all(
        superAdmins.map(superAdmin =>
          prisma.notification.create({
            data: {
              title,
              message,
              priority,
              targetType: 'superadmin',
              targetTenantId: null,
              createdBy: superAdmin.id,
              isActive: true
            }
          })
        )
      );
    } else if (targetType === 'all_tenants') {
      // Get all active tenants
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
      });

      // Create notifications for each tenant
      notifications = await Promise.all(
        tenants.map(tenant =>
          prisma.notification.create({
            data: {
              title,
              message,
              priority,
              targetType: 'all_tenants',
              targetTenantId: tenant.id,
              createdBy: superAdmin.id,
              isActive: true
            }
          })
        )
      );
    } else if (targetType === 'specific_tenant') {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: targetTenantId, isActive: true }
      });

      if (!tenant) {
        return createErrorResponse('Target tenant not found or inactive', 404);
      }

      // Create notification for specific tenant
      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          priority,
          targetType: 'specific_tenants',
          targetTenantId: targetTenantId,
          createdBy: superAdmin.id,
          isActive: true
        }
      });

      notifications = [notification];
    }

    // Create audit log
    await createAuditLog({
      action: 'notification.create',
      details: {
        title,
        targetType,
        targetTenantId,
        priority,
        notificationCount: notifications.length
      },
      superAdminId: superAdmin.id
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification created successfully:', notifications.length, 'notifications');
    }

    return createSuccessResponse({
      message: `Notification sent successfully to ${notifications.length} recipients`,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        targetType,
        createdAt: n.createdAt
      }))
    }, 'Notification sent successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating notification:', error);
    }
    throw error;
  }
});

// GET /api/superadmin/notifications - Fetch notifications for header
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Fetching notifications');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for notifications API');
    }
    return authResult;
  }

  const superAdmin = authResult as any;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 SuperAdmin authenticated:', superAdmin.id, superAdmin.email);
  }
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  try {
    // Build where clause for superadmin notifications
    const where: any = {
      OR: [
        // Notifications sent to all superadmins
        {
          targetType: 'superadmin'
        },
        // Notifications created by this superadmin
        {
          createdBy: superAdmin.id
        },
        // Notifications sent to all tenants (superadmins can see these too)
        {
          targetType: 'all_tenants'
        }
      ],
      isActive: true
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Notifications query where clause:', JSON.stringify(where, null, 2));
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        targetType: true,
        priority: true
      }
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notifications fetched successfully:', notifications.length);
    }

    return createSuccessResponse({
      notifications,
      unreadCount,
      totalCount: notifications.length
    }, 'Notifications fetched successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching notifications:', error);
    }
    throw error;
  }
}); 