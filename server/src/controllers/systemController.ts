import { Request, Response } from 'express';
import { successResponse } from '@/utils/apiResponse';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running and healthy
 *     tags: [System]
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
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-13T18:00:00.000Z"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                     environment:
 *                       type: string
 *                       example: "development"
 */
export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const healthData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
  };

  successResponse(res, healthData, 'API is healthy');
};

/**
 * @swagger
 * /api/system/info:
 *   get:
 *     summary: Get system information
 *     description: Retrieve detailed system information and configuration
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System information retrieved successfully
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
 *                   example: System information retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     nodeVersion:
 *                       type: string
 *                       example: "v18.17.0"
 *                     platform:
 *                       type: string
 *                       example: "darwin"
 *                     arch:
 *                       type: string
 *                       example: "x64"
 *                     memoryUsage:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                           example: 52428800
 *                         heapTotal:
 *                           type: number
 *                           example: 20971520
 *                         heapUsed:
 *                           type: number
 *                           example: 10485760
 *                     cpuUsage:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: number
 *                           example: 1000000
 *                         system:
 *                           type: number
 *                           example: 500000
 */
export const getSystemInfo = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    pid: process.pid,
    uptime: process.uptime(),
  };

  successResponse(res, systemInfo, 'System information retrieved successfully');
};
