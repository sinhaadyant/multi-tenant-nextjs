import { Router } from 'express';
import {
  getDashboardMetrics,
  getUserAnalytics,
  getSystemPerformanceMetrics,
  generateCustomReport,
  exportAnalyticsData,
  getTrendAnalysis,
} from '@/controllers/analyticsController';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get main dashboard metrics
 *     description: Retrieve comprehensive dashboard metrics with data scope enforcement
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for metrics (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for metrics (ISO format)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Grouping interval for time-series data
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
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
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         new:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         growth:
 *                           type: string
 *                         groupedData:
 *                           type: array
 *                     performance:
 *                       type: object
 *                     support:
 *                       type: object
 *                     audit:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/dashboard', getDashboardMetrics);

/**
 * @swagger
 * /analytics/users:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve user-specific analytics with tenant isolation
 *     tags: [Analytics]
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
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Grouping interval for time-series data
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', getUserAnalytics);

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get system performance metrics
 *     description: Retrieve system performance metrics and monitoring data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance metrics (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance metrics (ISO format)
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
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
 *                     responseTime:
 *                       type: object
 *                       properties:
 *                         average:
 *                           type: number
 *                         p95:
 *                           type: number
 *                         p99:
 *                           type: number
 *                     throughput:
 *                       type: object
 *                       properties:
 *                         requestsPerSecond:
 *                           type: number
 *                         peakRequestsPerSecond:
 *                           type: number
 *                     errors:
 *                       type: object
 *                       properties:
 *                         rate:
 *                           type: number
 *                         total:
 *                           type: integer
 *                     uptime:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                         lastDowntime:
 *                           type: string
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/performance', getSystemPerformanceMetrics);

/**
 * @swagger
 * /analytics/custom:
 *   post:
 *     summary: Generate custom report
 *     description: Generate custom analytics reports with permission-based data access
 *     tags: [Analytics]
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
 *               - queries
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               queries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - entity
 *                     - metrics
 *                   properties:
 *                     entity:
 *                       type: string
 *                       enum: [users, roles, support_tickets, audit_logs]
 *                     metrics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     filters:
 *                       type: object
 *                     groupBy:
 *                       type: array
 *                       items:
 *                         type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   frequency:
 *                     type: string
 *                     enum: [daily, weekly, monthly]
 *                   recipients:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Custom report generated successfully
 *       400:
 *         description: Invalid report configuration
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/custom', generateCustomReport);

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Export analytics data
 *     description: Export analytics data with scope filtering and multiple formats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, roles, support_tickets, audit_logs]
 *         description: Entity to export data from
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: filters
 *         schema:
 *           type: object
 *         description: Additional filters to apply
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         headers:
 *           Content-Disposition:
 *             description: File download header
 *             schema:
 *               type: string
 *       400:
 *         description: Missing entity parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/export', exportAnalyticsData);

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     summary: Get trend analysis
 *     description: Retrieve trend analysis with tenant scope and historical data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for trend analysis (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for trend analysis (ISO format)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Grouping interval for trend data
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [users, roles, support_tickets, audit_logs]
 *         description: Specific entity for trend analysis (optional)
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
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
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             date:
 *                               type: string
 *                               format: date-time
 *                             count:
 *                               type: integer
 *                       trend:
 *                         type: string
 *                         enum: [up, down, stable]
 *                       percentage:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/trends', getTrendAnalysis);

export default router;
