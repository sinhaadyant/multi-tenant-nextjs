import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/notifications/[id]/status - Toggle notification status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Toggling notification status:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for notification status API:', authResult.error);
    }
    return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
  }

  const { isActive } = await req.json();

  if (typeof isActive !== 'boolean') {
    return createErrorResponse('isActive must be a boolean', 400);
  }

  try {
    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: id },
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
        console.log('❌ Notification not found:', id);
      }
      return createErrorResponse('Notification not found', 404);
    }

    // Update notification status
    const notification = await prisma.notification.update({
      where: { id: id },
      data: { isActive },
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
      authResult.user,
      'notification.status_toggle',
      {
        notificationId: notification.id,
        notificationTitle: notification.title,
        createdBy: notification.super_admins?.name || 'System',
        targetTenant: notification.tenants?.name || 'All Tenants',
        newStatus: isActive ? 'active' : 'inactive',
        previousStatus: existingNotification.isActive ? 'active' : 'inactive'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification status updated successfully:', notification.title, 'Status:', isActive);
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
    }, `Notification ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating notification status:', error);
    }
    throw error;
  }
}); 