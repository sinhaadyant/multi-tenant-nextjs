import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/notifications/[id] - Get single notification
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Fetching notification details:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
      include: {
        super_admins: {
          select: { name: true, email: true }
        },
        tenants: {
          select: { name: true, slug: true }
        }
      }
    });

    if (!notification) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Notification not found:', params.id);
      }
      return createErrorResponse('Notification not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification fetched successfully:', notification.title);
    }

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isRead: notification.isRead,
        isActive: notification.isActive,
        targetType: notification.targetType,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        createdBy: notification.super_admins?.name || 'System',
        targetTenant: notification.tenants?.name || 'All Tenants'
      }
    }, 'Notification fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching notification:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/notifications/[id] - Update notification
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Updating notification:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { title, message, priority, isActive } = await req.json();

  try {
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!existingNotification) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Notification not found:', params.id);
      }
      return createErrorResponse('Notification not found', 404);
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        message: message || undefined,
        priority: priority || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        super_admins: {
          select: { name: true, email: true }
        },
        tenants: {
          select: { name: true, slug: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'notification.update',
      {
        notificationId: notification.id,
        notificationTitle: notification.title,
        changes: { title, message, priority, isActive }
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification updated successfully:', notification.title);
    }

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isRead: notification.isRead,
        isActive: notification.isActive,
        targetType: notification.targetType,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        createdBy: notification.super_admins?.name || 'System',
        targetTenant: notification.tenants?.name || 'All Tenants'
      }
    }, 'Notification updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating notification:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/notifications/[id] - Delete notification
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Deleting notification:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id },
      include: {
        super_admins: {
          select: { name: true }
        },
        tenants: {
          select: { name: true }
        }
      }
    });

    if (!existingNotification) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Notification not found:', params.id);
      }
      return createErrorResponse('Notification not found', 404);
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: params.id }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'notification.delete',
      {
        notificationId: existingNotification.id,
        notificationTitle: existingNotification.title,
        createdBy: existingNotification.super_admins?.name || 'System',
        targetTenant: existingNotification.tenants?.name || 'All Tenants'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification deleted successfully:', existingNotification.title);
    }

    return createSuccessResponse({}, 'Notification deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting notification:', error);
    }
    throw error;
  }
}); 