import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const notificationId = params.id;

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    // For superadmin notifications, we need to handle this differently
    // since UserNotification expects a User ID, but superadmins are in SuperAdmin table
    
    // Check if the superadmin has a corresponding user record (for read tracking)
    let superadminUser = await prisma.user.findFirst({
      where: { 
        email: authResult.user.email,
        tenantId: null // Superadmin users don't belong to any tenant
      }
    });

    // If no user record exists for superadmin, create one for read tracking purposes
    if (!superadminUser) {
      // Get superadmin details
      const superadmin = await prisma.superAdmin.findUnique({
        where: { id: authResult.user.id }
      });

      if (superadmin) {
        // Create a user record for the superadmin to enable read tracking
        superadminUser = await prisma.user.create({
          data: {
            email: superadmin.email,
            name: superadmin.name,
            password: superadmin.password, // Use the same password
            isActive: superadmin.isActive,
            tenantId: null, // Superadmin users don't belong to any tenant
            contactNumber: superadmin.contactNumber,
          }
        });
      }
    }

    if (superadminUser) {
      // Mark notification as read for the superadmin user
      const userNotification = await prisma.userNotification.upsert({
        where: {
          notificationId_userId: {
            notificationId: notificationId,
            userId: superadminUser.id,
          },
        },
        update: {
          isRead: true,
          readAt: new Date(),
        },
        create: {
          notificationId: notificationId,
          userId: superadminUser.id,
          isRead: true,
          readAt: new Date(),
        },
      });
    } else {
      // Fallback: just log the read action
      console.log(`Superadmin ${authResult.user.email} marked notification ${notificationId} as read`);
    }

    // Get the updated notification
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Create audit log
    await createAuditLogFromRequest(req as any, authResult.user as any, 'notification.read', {
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
}
