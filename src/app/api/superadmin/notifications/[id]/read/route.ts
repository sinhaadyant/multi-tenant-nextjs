import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/notifications/[id]/read - Mark notification as read
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Marking notification as read:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;
  const notificationId = params.id;

  try {
    // Verify notification exists and belongs to this superadmin
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          {
            targetType: 'superadmin',
            targetTenantId: superAdmin.id
          },
          {
            createdBy: superAdmin.id
          }
        ],
        isActive: true
      }
    });

    if (!notification) {
      return createErrorResponse('Notification not found or access denied', 404);
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: {
        id: true,
        title: true,
        isRead: true,
        updatedAt: true
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification marked as read:', notificationId);
    }

    return createSuccessResponse({
      notification: updatedNotification
    }, 'Notification marked as read successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error marking notification as read:', error);
    }
    throw error;
  }
}); 