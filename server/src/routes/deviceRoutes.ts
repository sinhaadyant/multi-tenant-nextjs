import { Router } from 'express';
import {
  getUserLoginDevices,
  getUserDeviceStats,
  revokeDevice,
  revokeAllDevices,
} from '@/controllers/deviceController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: User login device management
 */

// All device routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get user's active devices
 *     tags: [Devices]
 */
router.get('/', getUserLoginDevices);

/**
 * @swagger
 * /api/devices/stats:
 *   get:
 *     summary: Get user device statistics
 *     tags: [Devices]
 */
router.get('/stats', getUserDeviceStats);

/**
 * @swagger
 * /api/devices/{deviceId}/revoke:
 *   post:
 *     summary: Revoke a specific device
 *     tags: [Devices]
 */
router.post('/:deviceId/revoke', revokeDevice);

/**
 * @swagger
 * /api/devices/revoke-all:
 *   post:
 *     summary: Revoke all devices
 *     tags: [Devices]
 */
router.post('/revoke-all', revokeAllDevices);

export default router;
