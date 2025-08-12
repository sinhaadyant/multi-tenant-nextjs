import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const notificationId = params.id;

      // Check if notification exists
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return createErrorResponse('Notification not found', 404);
      }

      // Mark notification as read for the current user
      const userNotification = await prisma.userNotification.upsert({
        where: {
          notificationId_userId: {
            notificationId: notificationId,
            userId: user.id,
          },
        },
        update: {
          isRead: true,
          readAt: new Date(),
        },
        create: {
          notificationId: notificationId,
          userId: user.id,
          isRead: true,
          readAt: new Date(),
        },
      });

      // Get the updated notification
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      // Create audit log
      await createAuditLogFromRequest(req as any, user as any, 'notification.read', {
        notificationId: notificationId,
        notificationTitle: notification.title,
      });

      return createSuccessResponse(
        { notification: updatedNotification },
        'Notification marked as read successfully'
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return createErrorResponse('Failed to mark notification as read', 500);
    }
  })(req, { params });
}
