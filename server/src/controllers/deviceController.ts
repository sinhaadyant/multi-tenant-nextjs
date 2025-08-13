import { Request, Response } from 'express';
import { LoginDeviceService } from '@/services/loginDeviceService';
import { AuthService } from '@/services/authService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';

const loginDeviceService = new LoginDeviceService();
const authService = new AuthService();

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get user's active devices
 *     description: Retrieve all active login devices for the authenticated user
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User devices retrieved successfully
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
 *                   example: User devices retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeviceRecord'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getUserDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const devices = await loginDeviceService.getUserDevices(userId);

    successResponse(
      res,
      devices,
      'User devices retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve user devices';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/devices/stats:
 *   get:
 *     summary: Get user device statistics
 *     description: Get statistics about user's login devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device statistics retrieved successfully
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
 *                   example: Device statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDevices:
 *                       type: number
 *                       example: 5
 *                     activeDevices:
 *                       type: number
 *                       example: 3
 *                     inactiveDevices:
 *                       type: number
 *                       example: 2
 *                     recentDevices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeviceRecord'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getUserDeviceStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const stats = await loginDeviceService.getUserDeviceStats(userId);

    successResponse(
      res,
      stats,
      'Device statistics retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve device statistics';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/devices/{deviceId}/revoke:
 *   post:
 *     summary: Revoke a specific device
 *     description: Revoke access for a specific login device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to revoke
 *     responses:
 *       200:
 *         description: Device revoked successfully
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
 *                   example: Device revoked successfully
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const revokeDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deviceId } = req.params;

    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    if (!deviceId) {
      badRequestResponse(res, 'Device ID is required');
      return;
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '127.0.0.1',
    };

    await authService.revokeDevice(userId, deviceId, deviceInfo);

    successResponse(
      res,
      null,
      'Device revoked successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to revoke device';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Device not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/devices/revoke-all:
 *   post:
 *     summary: Revoke all devices
 *     description: Revoke access for all user's login devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All devices revoked successfully
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
 *                   example: All devices revoked successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const revokeAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '127.0.0.1',
    };

    await authService.logoutAllDevices(userId, deviceInfo);

    successResponse(
      res,
      null,
      'All devices revoked successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to revoke all devices';
    errorResponse(res, message, 500);
  }
};
