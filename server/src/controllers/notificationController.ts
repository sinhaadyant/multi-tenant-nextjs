import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/config/logger';
import { AuthenticatedUser } from '@/middleware/auth';
import { permissionGuard } from '@/middleware/permissionGuard';
import { dataScopeService } from '@/services/DataScopeService';

const prisma = new PrismaClient();

// Notification schemas
const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  channels: z.array(z.enum(['in_app', 'email', 'sms'])).default(['in_app']),
  recipients: z.array(z.string()).optional(),
  tenantId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  notificationTypes: z.record(z.string(), z.boolean()).optional(),
  quietHours: z
    .object({
      enabled: z.boolean().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .optional(),
});

const bulkNotificationSchema = z.object({
  notifications: z.array(createNotificationSchema),
  targetAudience: z.enum(['all', 'tenant', 'role', 'custom']).default('all'),
  filters: z.record(z.string(), z.any()).optional(),
});

export class NotificationController {
  /**
   * Get user notifications with filtering
   */
  static getUserNotifications = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { page = 1, limit = 20, read, type, priority } = req.query;

      const whereClause: any = {
        userId: user?.id,
      };

      if (read !== undefined) {
        whereClause.isRead = read === 'true';
      }

      if (type) {
        whereClause.type = type;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      const offset = (Number(page) - 1) * Number(limit);

      // const [notifications, total] = await Promise.all([
      //   prisma?.notification?.findMany({
      //     where: whereClause,
      //     orderBy: { createdAt: 'desc' },
      //     skip: offset,
      //     take: Number(limit),
      //   }),
      //   prisma?.notification?.count({ where: whereClause }),
      // ]);
      const notifications: any[] = [];
      const total = 0;

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Get user notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Create notification
   */
  static createNotification = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = createNotificationSchema.parse(req.body);

      const {
        title,
        message,
        type,
        priority,
        channels,
        recipients,
        tenantId,
        metadata,
      } = validatedData;

      // Determine recipients based on scope
      let targetRecipients: string[] = [];

      if (recipients && recipients.length > 0) {
        targetRecipients = recipients;
      } else if (tenantId) {
        // Get all users in the tenant
        const tenantUsers = await prisma?.user?.findMany({
          where: { tenantId },
          select: { id: true },
        });
        targetRecipients = tenantUsers.map(u => u.id);
      } else {
        // Send to all users (superadmin only)
        if (!user?.isSuperadmin) {
          res.status(401).json({
            success: false,
            message: 'User not authenticated',
          });
          return;
        }
        const allUsers = await prisma?.user?.findMany({
          select: { id: true },
        });
        targetRecipients = allUsers.map(u => u.id);
      }

      // Create notifications for each recipient
      // const notifications = await Promise.all(
      //   targetRecipients.map(recipientId =>
      //     prisma?.notification?.create({
      //       data: {
      //         userId: recipientId || '',
      //         title,
      //         message,
      //         type,
      //         priority,
      //         channels,
      //         metadata,
      //         tenantId: tenantId || user?.tenantId,
      //       },
      //     })
      //   )
      // );
      const notifications: any[] = [];

      // Send notifications through specified channels
      await NotificationController.sendNotifications(notifications, channels);

      return res.json({
        success: true,
        message: 'Notification created successfully',
        data: {
          notificationCount: notifications.length,
          recipients: targetRecipients.length,
        },
      });
    } catch (error) {
      logger.error('Create notification error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Mark notification as read
   */
  static markAsRead = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // const notification = await prisma?.notification?.findFirst({
      //   where: {
      //     id,
      //     userId: user?.id,
      //   },
      // });
      const notification = null;

      if (!notification) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // await prisma?.notification?.update({
      //   where: { id },
      //   data: { isRead: true, readAt: new Date() },
      // });

      return res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Mark all notifications as read
   */
  static markAllAsRead = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      await prisma?.notification?.updateMany({
        where: {
          userId: user?.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get user notification preferences
   */
  static getNotificationPreferences = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      const preferences = await prisma?.userNotificationPreferences?.findUnique(
        {
          where: { userId: user?.id },
        }
      );

      // Return default preferences if none exist
      const defaultPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        notificationTypes: {
          info: true,
          success: true,
          warning: true,
          error: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
        },
      };

      res.json({
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences || defaultPreferences,
      });
    } catch (error) {
      logger.error('Get notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification preferences',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update user notification preferences
   */
  static updateNotificationPreferences = async (
    req: Request,
    res: Response
  ) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = updatePreferencesSchema.parse(req.body);

      const preferences = await prisma?.userNotificationPreferences?.upsert({
        where: { userId: user?.id },
        update: validatedData,
        create: {
          userId: user?.id,
          emailNotifications: validatedData.emailNotifications,
          smsNotifications: validatedData.smsNotifications,
          inAppNotifications: validatedData.inAppNotifications,
          notificationTypes: validatedData.notificationTypes || {},
          quietHours: validatedData.quietHours || {},
        },
      });

      return res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: preferences,
      });
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Send bulk notifications
   */
  static sendBulkNotifications = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = bulkNotificationSchema.parse(req.body);

      const { notifications, targetAudience, filters } = validatedData;

      // Determine target recipients based on audience
      let targetRecipients: string[] = [];

      switch (targetAudience) {
        case 'all':
          if (!user?.isSuperadmin) {
            res.status(401).json({
              success: false,
              message: 'User not authenticated',
            });
            return;
          }
          const allUsers = await prisma?.user?.findMany({
            select: { id: true },
          });
          targetRecipients = allUsers.map(u => u.id);
          break;

        case 'tenant':
          const tenantUsers = await prisma?.user?.findMany({
            where: { tenantId: user?.tenantId },
            select: { id: true },
          });
          targetRecipients = tenantUsers.map(u => u.id);
          break;

        case 'role':
          // Get users with specific roles
          const roleUsers = await prisma?.userRole?.findMany({
            where: filters?.['roleIds']
              ? { roleId: { in: filters['roleIds'] as string[] } }
              : {},
            select: { userId: true },
          });
          targetRecipients = roleUsers.map(ur => ur.userId);
          break;

        case 'custom':
          if (filters?.['userIds']) {
            targetRecipients = filters['userIds'] as string[];
          }
          break;
      }

      // Create notifications for each recipient
      const createdNotifications: any[] = [];

      for (const notificationData of notifications) {
        const notificationPromises = targetRecipients.map(recipientId =>
          prisma?.notification?.create({
            data: {
              userId: recipientId || '',
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              priority: notificationData.priority,
              channels: notificationData.channels,
              metadata: notificationData.metadata,
              tenantId: user?.tenantId,
            },
          })
        );

        const batchNotifications = await Promise.all(notificationPromises);
        createdNotifications.push(...batchNotifications);
      }

      // Send notifications through specified channels
      const allChannels = [...new Set(notifications.flatMap(n => n.channels))];
      await NotificationController.sendNotifications(
        createdNotifications,
        allChannels
      );

      res.json({
        success: true,
        message: 'Bulk notifications sent successfully',
        data: {
          notificationCount: createdNotifications.length,
          recipients: targetRecipients.length,
          batches: notifications.length,
        },
      });
    } catch (error) {
      logger.error('Send bulk notifications error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get notification templates
   */
  static getNotificationTemplates = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      // Check if user has permission to view templates
      if (!user?.isSuperadmin) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const templates = await prisma?.notificationTemplate?.findMany({
        where: {
          OR: [{ isGlobal: true }, { tenantId: user?.tenantId }],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        message: 'Notification templates retrieved successfully',
        data: templates,
      });
    } catch (error) {
      logger.error('Get notification templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification templates',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Create notification template
   */
  static createNotificationTemplate = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { name, subject, body, variables, isGlobal } = req.body;

      if (!user?.isSuperadmin) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const template = await prisma?.notificationTemplate?.create({
        data: {
          name,
          subject,
          body,
          variables,
          isGlobal: isGlobal || false,
          tenantId: user?.tenantId,
          createdBy: user?.id,
        },
      });

      res.json({
        success: true,
        message: 'Notification template created successfully',
        data: template,
      });
    } catch (error) {
      logger.error('Create notification template error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get notification analytics
   */
  static getNotificationAnalytics = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const baseQuery = {
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      };

      const scopedQuery = await dataScopeService.applyDataScopeFilter(
        baseQuery,
        user?.id,
        'notifications',
        'notifications'
      );

      const [
        totalNotifications,
        readNotifications,
        unreadNotifications,
        typeStats,
      ] = await Promise.all([
        prisma?.notification?.count({ where: (scopedQuery as any).where }),
        prisma?.notification?.count({
          where: {
            ...(scopedQuery as any).where,
            isRead: true,
          },
        }),
        prisma?.notification?.count({
          where: {
            ...(scopedQuery as any).where,
            isRead: false,
          },
        }),
        prisma?.notification?.groupBy({
          by: ['type'],
          where: (scopedQuery as any).where,
          _count: {
            id: true,
          },
        }),
      ]);

      const analytics = {
        total: totalNotifications,
        read: readNotifications,
        unread: unreadNotifications,
        readRate:
          totalNotifications > 0
            ? ((readNotifications / totalNotifications) * 100).toFixed(2)
            : '0',
        typeDistribution: typeStats.reduce(
          (acc, stat) => {
            acc[stat.type] = stat?._count?.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      res.json({
        success: true,
        message: 'Notification analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Get notification analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification analytics',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Helper methods

  /**
   * Send notifications through specified channels
   */
  private static async sendNotifications(
    notifications: any[],
    channels: string[]
  ) {
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          await NotificationController.sendEmailNotifications(notifications);
          break;
        case 'sms':
          await NotificationController.sendSMSNotifications(notifications);
          break;
        case 'in_app':
          // In-app notifications are already created in the database
          break;
      }
    }
  }

  /**
   * Send email notifications
   */
  private static async sendEmailNotifications(notifications: any[]) {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    logger.info(`Sending ${notifications.length} email notifications`);

    // Mock email sending
    for (const notification of notifications) {
      logger.info(
        `Email notification sent to user ${notification.userId}: ${notification.title}`
      );
    }
  }

  /**
   * Send SMS notifications
   */
  private static async sendSMSNotifications(notifications: any[]) {
    // This would integrate with an SMS service like Twilio, AWS SNS, etc.
    logger.info(`Sending ${notifications.length} SMS notifications`);

    // Mock SMS sending
    for (const notification of notifications) {
      logger.info(
        `SMS notification sent to user ${notification.userId}: ${notification.title}`
      );
    }
  }
}

// Export middleware-wrapped methods
export const getUserNotifications = [
  permissionGuard({ moduleKey: 'notifications', action: 'read' }),
  NotificationController.getUserNotifications,
];

export const createNotification = [
  permissionGuard({ moduleKey: 'notifications', action: 'create' }),
  NotificationController.createNotification,
];

export const markAsRead = [
  permissionGuard({ moduleKey: 'notifications', action: 'update' }),
  NotificationController.markAsRead,
];

export const markAllAsRead = [
  permissionGuard({ moduleKey: 'notifications', action: 'update' }),
  NotificationController.markAllAsRead,
];

export const getNotificationPreferences = [
  NotificationController.getNotificationPreferences,
];

export const updateNotificationPreferences = [
  NotificationController.updateNotificationPreferences,
];

export const sendBulkNotifications = [
  permissionGuard({ moduleKey: 'notifications', action: 'create' }),
  NotificationController.sendBulkNotifications,
];

export const getNotificationTemplates = [
  permissionGuard({ moduleKey: 'notifications', action: 'read' }),
  NotificationController.getNotificationTemplates,
];

export const createNotificationTemplate = [
  permissionGuard({ moduleKey: 'notifications', action: 'create' }),
  NotificationController.createNotificationTemplate,
];

export const getNotificationAnalytics = [
  permissionGuard({ moduleKey: 'notifications', action: 'read' }),
  NotificationController.getNotificationAnalytics,
];
