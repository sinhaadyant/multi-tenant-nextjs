import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import deviceRoutes from './deviceRoutes';
import exampleRoutes from './exampleRoutes';
import { healthCheck, getSystemInfo } from '@/controllers/systemController';

const router = Router();

/**
 * @swagger
 * /health:
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
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-13T18:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/health', healthCheck);

/**
 * @swagger
 * /system/info:
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
 *                     cpuUsage:
 *                       type: object
 */
router.get('/system/info', getSystemInfo);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/devices', deviceRoutes);
router.use('/example', exampleRoutes);

export default router;
