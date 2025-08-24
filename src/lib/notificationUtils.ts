import { prisma } from './prisma';

export interface NotificationDeliveryResult {
  success: boolean;
  deliveredCount: number;
  requestedCount: number;
  errors: string[];
}

/**
 * Deliver notification to users based on target type and IDs
 */
export async function deliverNotificationToUsers(
  notificationId: string,
  targetType: string,
  targetUserIds?: string[],
  targetTenantId?: string
): Promise<NotificationDeliveryResult> {
  const result: NotificationDeliveryResult = {
    success: true,
    deliveredCount: 0,
    requestedCount: 0,
    errors: []
  };

  try {
    let validUserIds: string[] = [];

    switch (targetType) {
      case 'specific_users':
        if (!targetUserIds || targetUserIds.length === 0) {
          result.errors.push('No target user IDs provided for specific_users notification');
          result.success = false;
          return result;
        }

        // Validate that all target user IDs exist and are active
        const validUsers = await prisma.user.findMany({
          where: {
            id: { in: targetUserIds },
            isActive: true
          },
          select: { id: true, email: true, name: true }
        });

        validUserIds = validUsers.map(user => user.id);
        result.requestedCount = targetUserIds.length;

        if (validUsers.length !== targetUserIds.length) {
          const missingCount = targetUserIds.length - validUsers.length;
          result.errors.push(`${missingCount} target users not found or inactive`);
          console.warn(`⚠️ Some target users not found or inactive. Requested: ${targetUserIds.length}, Found: ${validUsers.length}`);
        }
        break;

      case 'entire_tenant':
        if (!targetTenantId) {
          result.errors.push('Target tenant ID is required for entire_tenant notifications');
          result.success = false;
          return result;
        }

        // Get all users in the tenant
        const tenantUsers = await prisma.user.findMany({
          where: { 
            tenantId: targetTenantId, 
            isActive: true 
          },
          select: { id: true, email: true, name: true }
        });

        validUserIds = tenantUsers.map(user => user.id);
        result.requestedCount = validUserIds.length;
        break;

      case 'all':
        // Get all active users
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, email: true, name: true }
        });

        validUserIds = allUsers.map(user => user.id);
        result.requestedCount = validUserIds.length;
        break;

      default:
        result.errors.push(`Unsupported target type: ${targetType}`);
        result.success = false;
        return result;
    }

    if (validUserIds.length === 0) {
      result.errors.push('No valid target users found for notification');
      result.success = false;
      return result;
    }

    // Create user notification entries
    try {
      // First, check if user notifications already exist
      const existingNotifications = await prisma.userNotification.findMany({
        where: {
          notificationId,
          userId: { in: validUserIds }
        },
        select: { userId: true }
      });

      const existingUserIds = existingNotifications.map(n => n.userId);
      const newUserIds = validUserIds.filter(userId => !existingUserIds.includes(userId));

      console.log(`📊 Notification delivery check:`, {
        totalTargets: validUserIds.length,
        existingNotifications: existingUserIds.length,
        newNotifications: newUserIds.length
      });

      if (newUserIds.length === 0) {
        // All notifications already exist
        result.deliveredCount = existingUserIds.length;
        console.log(`✅ All ${result.deliveredCount} notifications already exist`);
        return result;
      }

      // Create only new user notification entries
      const userNotificationData = newUserIds.map(userId => ({
        userId,
        notificationId,
        isRead: false,
        isActive: true
      }));

      const createResult = await prisma.userNotification.createMany({
        data: userNotificationData,
        skipDuplicates: true // Skip if user notification already exists
      });

      result.deliveredCount = existingUserIds.length + createResult.count;

      if (createResult.count !== newUserIds.length) {
        const skippedCount = newUserIds.length - createResult.count;
        result.errors.push(`${skippedCount} user notifications already exist`);
      }

      console.log(`✅ Delivered notification to ${result.deliveredCount} users (${result.requestedCount} requested)`);

    } catch (error: any) {
      console.error('❌ Error creating user notifications:', error);
      result.errors.push(`Database error: ${error.message}`);
      result.success = false;
    }

  } catch (error: any) {
    console.error('❌ Error in deliverNotificationToUsers:', error);
    result.errors.push(`General error: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Get notification statistics for a user
 */
export async function getUserNotificationStats(userId: string) {
  const [total, unread] = await Promise.all([
    prisma.userNotification.count({
      where: {
        userId,
        isActive: true
      }
    }),
    prisma.userNotification.count({
      where: {
        userId,
        isActive: true,
        isRead: false
      }
    })
  ]);

  return {
    total,
    unread,
    read: total - unread
  };
}

/**
 * Mark notifications as read for a user
 */
export async function markUserNotificationsAsRead(
  userId: string,
  notificationIds?: string[],
  markAllAsRead: boolean = false
) {
  const whereClause: any = {
    userId,
    isActive: true,
    isRead: false
  };

  if (!markAllAsRead && notificationIds && notificationIds.length > 0) {
    whereClause.id = { in: notificationIds };
  }

  const result = await prisma.userNotification.updateMany({
    where: whereClause,
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return result.count;
}
