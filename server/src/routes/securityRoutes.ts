import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { superadminOnly } from '@/middleware/permissionGuard';
import {
  getSecurityStatus,
  blockIP,
  unblockIP,
  getBlockedIPs,
  getSecurityAlerts,
  getSecurityMetrics,
} from '@/middleware/security';

const router = Router();

/**
 * @swagger
 * /api/security/status:
 *   get:
 *     summary: Get security status
 *     description: Retrieve current security status and configuration
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security status retrieved successfully
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
 *                     blockedIPsCount:
 *                       type: number
 *                     recentThreats:
 *                       type: array
 *                     securityConfig:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/status',
  authMiddleware,
  superadminOnly,
  getSecurityStatus
);

/**
 * @swagger
 * /api/security/block-ip:
 *   post:
 *     summary: Block IP address
 *     description: Manually block an IP address due to suspicious activity
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *               - reason
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to block
 *               reason:
 *                 type: string
 *                 description: Reason for blocking
 *               duration:
 *                 type: number
 *                 description: Duration in minutes (optional, default 24 hours)
 *     responses:
 *       200:
 *         description: IP blocked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/block-ip',
  authMiddleware,
  superadminOnly,
  blockIP
);

/**
 * @swagger
 * /api/security/unblock-ip/{ip}:
 *   delete:
 *     summary: Unblock IP address
 *     description: Remove IP address from blocked list
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ip
 *         required: true
 *         schema:
 *           type: string
 *         description: IP address to unblock
 *     responses:
 *       200:
 *         description: IP unblocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/unblock-ip/:ip',
  authMiddleware,
  superadminOnly,
  unblockIP
);

/**
 * @swagger
 * /api/security/blocked-ips:
 *   get:
 *     summary: Get blocked IPs
 *     description: Retrieve list of all blocked IP addresses
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blocked IPs retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ip:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       blockedAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       attempts:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/blocked-ips',
  authMiddleware,
  superadminOnly,
  getBlockedIPs
);

/**
 * @swagger
 * /api/security/alerts:
 *   get:
 *     summary: Get security alerts
 *     description: Retrieve recent security alerts and threat events
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security alerts retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ip:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [xss, sql_injection, suspicious_pattern, rate_limit_exceeded]
 *                       pattern:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       userAgent:
 *                         type: string
 *                       path:
 *                         type: string
 *                       method:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/alerts',
  authMiddleware,
  superadminOnly,
  getSecurityAlerts
);

/**
 * @swagger
 * /api/security/metrics:
 *   get:
 *     summary: Get security metrics
 *     description: Retrieve security metrics and statistics
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security metrics retrieved successfully
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
 *                     totalBlockedIPs:
 *                       type: number
 *                     totalThreatEvents:
 *                       type: number
 *                     totalThreatCounts:
 *                       type: number
 *                     recentThreats:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/metrics',
  authMiddleware,
  superadminOnly,
  getSecurityMetrics
);

export default router;
