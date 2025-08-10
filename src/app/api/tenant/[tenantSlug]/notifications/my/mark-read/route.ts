import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

export const PATCH = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) => {
  try {
    const { tenantSlug } = await params;
    const user = req.user!;

    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user notifications as read
      const result = await prisma.userNotification.updateMany({
        where: {
          userId: user.id,
          isActive: true,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return createSuccessResponse(
        { 
          message: 'All notifications marked as read',
          updatedCount: result.count 
        },
        'All notifications marked as read successfully'
      );
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await prisma.userNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
          isActive: true,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return createSuccessResponse(
        { 
          message: 'Notifications marked as read',
          updatedCount: result.count 
        },
        'Notifications marked as read successfully'
      );
    }

    return createErrorResponse('Invalid request body', 400);
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return createErrorResponse('Internal server error', 500);
  }
}); 