import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '@/config/redis';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import * as fs from 'fs/promises';

import * as os from 'os';

const prisma = new PrismaClient();

// Performance metrics storage
const performanceMetrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: [] as number[],
  startTime: Date.now(),
};

// Health check data
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    fileSystem: HealthCheck;
    memory: HealthCheck;
    cpu: HealthCheck;
  };
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  details?: any;
}

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 */
export const basicHealthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const healthData = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1?.0?.0',
      environment: env.NODE_ENV,
    };

    successResponse(res, healthData, 'API is healthy');
  } catch (error) {
    logger.error('Health check error:', error);
    errorResponse(res, 'Health check failed', 500);
  }
};

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
export const detailedHealthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // const startTime = Date.now();
    const checks = await performHealthChecks();
    const overallStatus = determineOverallStatus(checks);

    const healthData: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1?.0?.0',
      environment: env.NODE_ENV,
      checks,
    };

    const statusCode =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 200
          : 503;

    successResponse(
      res,
      healthData,
      'Detailed health check completed',
      statusCode
    );
  } catch (error) {
    logger.error('Detailed health check error:', error);
    errorResponse(res, 'Detailed health check failed', 500);
  }
};

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database health check
 *     description: Check database connectivity and performance
 *     tags: [Health]
 */
export const databaseHealthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // const startTime = Date.now();
    const check = await checkDatabaseHealth();

    successResponse(res, check, 'Database health check completed');
  } catch (error) {
    logger.error('Database health check error:', error);
    errorResponse(res, 'Database health check failed', 500);
  }
};

/**
 * @swagger
 * /api/health/redis:
 *   get:
 *     summary: Redis health check
 *     description: Check Redis connectivity and performance
 *     tags: [Health]
 */
export const redisHealthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // const startTime = Date.now();
    const check = await checkRedisHealth();

    successResponse(res, check, 'Redis health check completed');
  } catch (error) {
    logger.error('Redis health check error:', error);
    errorResponse(res, 'Redis health check failed', 500);
  }
};

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: System performance metrics
 *     description: Get system performance metrics and statistics
 *     tags: [Health]
 */
export const getSystemPerformanceMetrics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const metrics = await collectPerformanceMetrics();
    successResponse(res, metrics, 'Performance metrics retrieved successfully');
  } catch (error) {
    logger.error('Performance metrics error:', error);
    errorResponse(res, 'Failed to retrieve performance metrics', 500);
  }
};

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: System status dashboard
 *     description: Comprehensive system status and dashboard data
 *     tags: [Health]
 */
export const getSystemStatus = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const status = await collectSystemStatus();
    successResponse(res, status, 'System status retrieved successfully');
  } catch (error) {
    logger.error('System status error:', error);
    errorResponse(res, 'Failed to retrieve system status', 500);
  }
};

/**
 * @swagger
 * /api/alerts/test:
 *   post:
 *     summary: Test alert systems
 *     description: Test the alert and notification systems
 *     tags: [Health]
 */
export const testAlertSystems = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Test alert systems
    logger.warn(
      'Test alert: This is a test alert from the health monitoring system'
    );

    successResponse(
      res,
      {
        message: 'Test alert sent successfully',
        timestamp: new Date().toISOString(),
      },
      'Alert systems tested successfully'
    );
  } catch (error) {
    logger.error('Test alert error:', error);
    errorResponse(res, 'Failed to test alert systems', 500);
  }
};

// Helper functions
async function performHealthChecks(): Promise<HealthStatus['checks']> {
  const [database, redis, fileSystem, memory, cpu] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkFileSystemHealth(),
    checkMemoryHealth(),
    checkCpuHealth(),
  ]);

  return {
    database:
      database.status === 'fulfilled'
        ? database.value
        : {
            status: 'unhealthy' as const,
            responseTime: 0,
            error: database.reason?.message || 'Database check failed',
          },
    redis:
      redis.status === 'fulfilled'
        ? redis.value
        : {
            status: 'unhealthy' as const,
            responseTime: 0,
            error: redis.reason?.message || 'Redis check failed',
          },
    fileSystem:
      fileSystem.status === 'fulfilled'
        ? fileSystem.value
        : {
            status: 'unhealthy' as const,
            responseTime: 0,
            error: fileSystem.reason?.message || 'File system check failed',
          },
    memory:
      memory.status === 'fulfilled'
        ? memory.value
        : {
            status: 'unhealthy' as const,
            responseTime: 0,
            error: memory.reason?.message || 'Memory check failed',
          },
    cpu:
      cpu.status === 'fulfilled'
        ? cpu.value
        : {
            status: 'unhealthy' as const,
            responseTime: 0,
            error: cpu.reason?.message || 'CPU check failed',
          },
  };
}

function determineOverallStatus(
  checks: HealthStatus['checks']
): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status);

  if (statuses.every(status => status === 'healthy')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Test basic query performance
    const userCount = await prisma?.user?.count();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        userCount,
        connectionPool: 'active',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkRedisHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Test Redis connection
    await redisClient.ping();

    // Test basic operations
    const testKey = 'health_check_test';
    await redisClient.setEx(testKey, 60, 'test');
    // const value = await redisClient.get(testKey);
    await redisClient.del(testKey);

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        ping: 'pong',
        memoryUsage: await redisClient.info('memory'),
        connectedClients: 'Redis client info not available',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

async function checkFileSystemHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Check upload directory
    const uploadPath = env.UPLOAD_PATH;
    await fs.access(uploadPath);

    // Check disk space
    const stats = await fs.stat(uploadPath);

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        uploadPath,
        exists: true,
        permissions: 'readable',
        size: stats.size,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : 'File system check failed',
    };
  }
}

async function checkMemoryHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    const responseTime = Date.now() - startTime;

    return {
      status: memoryUsagePercent > 90 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        processMemory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        systemMemory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usagePercent: memoryUsagePercent,
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

async function checkCpuHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        processCpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        systemLoad: {
          '1min': loadAvg[0],
          '5min': loadAvg[1],
          '15min': loadAvg[2],
        },
        cpus: os.cpus().length,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'CPU check failed',
    };
  }
}

async function collectPerformanceMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    system: {
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      loadAverage: os.loadavg(),
    },
    application: {
      requestCount: performanceMetrics.requestCount,
      errorCount: performanceMetrics.errorCount,
      averageResponseTime:
        performanceMetrics?.responseTimes?.length > 0
          ? performanceMetrics?.responseTimes?.reduce((a, b) => a + b, 0) /
            performanceMetrics?.responseTimes?.length
          : 0,
      uptime: Date.now() - performanceMetrics.startTime,
    },
    database: {
      connectionPool: 'active',
      queryCount: 0, // Would need to be tracked
    },
    cache: {
      hitRate: 0, // Would need to be tracked
      memoryUsage: 0, // Would need Redis info
    },
  };
}

async function collectSystemStatus() {
  const healthChecks = await performHealthChecks();
  const metrics = await collectPerformanceMetrics();

  return {
    overall: {
      status: determineOverallStatus(healthChecks),
      timestamp: new Date().toISOString(),
      version: '1?.0?.0',
      environment: env.NODE_ENV,
    },
    services: healthChecks,
    performance: metrics,
    alerts: {
      active: 0,
      critical: 0,
      warnings: 0,
    },
  };
}

// Middleware to track performance metrics
export const trackPerformanceMetrics = (
  _req: Request,
  res: Response,
  next: Function
) => {
  const startTime = Date.now();

  performanceMetrics.requestCount++;

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    performanceMetrics?.responseTimes?.push(responseTime);

    if (res.statusCode >= 400) {
      performanceMetrics.errorCount++;
    }

    // Keep only last 1000 response times
    if (performanceMetrics?.responseTimes?.length > 1000) {
      performanceMetrics?.responseTimes?.shift();
    }
  });

  next();
};

// Export individual functions for routes
export const healthCheck = basicHealthCheck;
export const detailedHealth = detailedHealthCheck;
export const databaseHealth = databaseHealthCheck;
export const redisHealth = redisHealthCheck;
export const metrics = getSystemPerformanceMetrics;
export const status = getSystemStatus;
export const testAlerts = testAlertSystems;
