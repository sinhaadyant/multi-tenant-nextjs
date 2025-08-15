import { Router } from 'express';
import {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendBulkNotifications,
  getNotificationTemplates,
  createNotificationTemplate,
  getNotificationAnalytics,
} from '@/controllers/notificationController';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve user notifications with filtering and pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, success, warning, error]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           type:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           isRead:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', getUserNotifications);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create notification
 *     description: Create and send notifications to specified recipients
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error]
 *                 default: info
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, email, sms]
 *                 default: [in_app]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               tenantId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid notification data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', createNotification);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id/read', markAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all user notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Retrieve user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailNotifications:
 *                       type: boolean
 *                     smsNotifications:
 *                       type: boolean
 *                     inAppNotifications:
 *                       type: boolean
 *                     notificationTypes:
 *                       type: object
 *                       properties:
 *                         info:
 *                           type: boolean
 *                         success:
 *                           type: boolean
 *                         warning:
 *                           type: boolean
 *                         error:
 *                           type: boolean
 *                     quietHours:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/preferences', getNotificationPreferences);

/**
 * @swagger
 * /notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     description: Update user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               inAppNotifications:
 *                 type: boolean
 *               notificationTypes:
 *                 type: object
 *                 properties:
 *                   info:
 *                     type: boolean
 *                   success:
 *                     type: boolean
 *                   warning:
 *                     type: boolean
 *                   error:
 *                     type: boolean
 *               quietHours:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       400:
 *         description: Invalid preferences data
 *       401:
 *         description: Unauthorized
 */
router.put('/preferences', updateNotificationPreferences);

/**
 * @swagger
 * /notifications/bulk:
 *   post:
 *     summary: Send bulk notifications
 *     description: Send multiple notifications to a target audience
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - message
 *                   properties:
 *                     title:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [info, success, warning, error]
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high, urgent]
 *                     channels:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [in_app, email, sms]
 *               targetAudience:
 *                 type: string
 *                 enum: [all, tenant, role, custom]
 *                 default: all
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk notifications sent successfully
 *       400:
 *         description: Invalid bulk notification data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/bulk', sendBulkNotifications);

/**
 * @swagger
 * /notifications/templates:
 *   get:
 *     summary: Get notification templates
 *     description: Retrieve notification templates (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/templates', getNotificationTemplates);

/**
 * @swagger
 * /notifications/templates:
 *   post:
 *     summary: Create notification template
 *     description: Create a new notification template (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - body
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               isGlobal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification template created successfully
 *       400:
 *         description: Invalid template data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/templates', createNotificationTemplate);

/**
 * @swagger
 * /notifications/analytics:
 *   get:
 *     summary: Get notification analytics
 *     description: Retrieve notification analytics and statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (ISO format)
 *     responses:
 *       200:
 *         description: Notification analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     read:
 *                       type: integer
 *                     unread:
 *                       type: integer
 *                     readRate:
 *                       type: string
 *                     typeDistribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics', getNotificationAnalytics);

export default router;
