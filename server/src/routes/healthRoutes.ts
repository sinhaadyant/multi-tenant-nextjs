import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  healthCheck,
  detailedHealth,
  databaseHealth,
  redisHealth,
  metrics,
  status,
  testAlerts,
} from '@/controllers/healthController';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get('/', asyncHandler(healthCheck));

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Comprehensive health check including all dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 */
router.get('/detailed', asyncHandler(detailedHealth));

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database health check
 *     description: Check database connectivity and performance
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database health status
 */
router.get('/database', asyncHandler(databaseHealth));

/**
 * @swagger
 * /api/health/redis:
 *   get:
 *     summary: Redis health check
 *     description: Check Redis connectivity and performance
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Redis health status
 */
router.get('/redis', asyncHandler(redisHealth));

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: System performance metrics
 *     description: Get system performance metrics and statistics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/metrics', asyncHandler(metrics));

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: System status dashboard
 *     description: Comprehensive system status and dashboard data
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System status
 */
router.get('/status', asyncHandler(status));

/**
 * @swagger
 * /api/alerts/test:
 *   post:
 *     summary: Test alert systems
 *     description: Test the alert and notification systems
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Alert test completed
 */
router.post('/alerts/test', asyncHandler(testAlerts));

export default router;
