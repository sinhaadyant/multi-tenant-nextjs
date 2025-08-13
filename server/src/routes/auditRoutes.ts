import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { requireTenant } from '@/middleware/tenantResolver';
import { requireRead } from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  getAuditLogs,
  getAuditLogById,
  exportAuditLogs,
  getUserAuditLogs,
  getTenantAuditLogs,
} from '@/controllers/auditController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log management
 */

// All audit routes require authentication and tenant context
router.use(authMiddleware);
router.use(requireTenant);

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 */
router.get('/', requireRead('audit'), asyncHandler(getAuditLogs));

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 */
router.get('/:id', requireRead('audit'), asyncHandler(getAuditLogById));

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 */
router.get('/export', requireRead('audit'), asyncHandler(exportAuditLogs));

/**
 * @swagger
 * /api/audit/user/{userId}:
 *   get:
 *     summary: Get user audit logs
 *     tags: [Audit]
 */
router.get(
  '/user/:userId',
  requireRead('audit'),
  asyncHandler(getUserAuditLogs)
);

/**
 * @swagger
 * /api/audit/tenant/{tenantId}:
 *   get:
 *     summary: Get tenant audit logs
 *     tags: [Audit]
 */
router.get(
  '/tenant/:tenantId',
  requireRead('audit'),
  asyncHandler(getTenantAuditLogs)
);

export default router;
