import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { requireTenant } from '@/middleware/tenantResolver';
import { requireRead, requireDelete } from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  getUserTokens,
  getUserTokenStats,
  revokeToken,
  revokeAllUserTokens,
  getTokenUsageStats,
} from '@/controllers/tokenController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tokens
 *   description: Token management
 */

// All token routes require authentication and tenant context
router.use(authMiddleware);
router.use(requireTenant);

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: Get user tokens
 *     tags: [Tokens]
 */
router.get('/', requireRead('token-management'), asyncHandler(getUserTokens));

/**
 * @swagger
 * /api/tokens/stats:
 *   get:
 *     summary: Get user token statistics
 *     tags: [Tokens]
 */
router.get(
  '/stats',
  requireRead('token-management'),
  asyncHandler(getUserTokenStats)
);

/**
 * @swagger
 * /api/tokens/{tokenId}:
 *   delete:
 *     summary: Revoke specific token
 *     tags: [Tokens]
 */
router.delete(
  '/:tokenId',
  requireDelete('token-management'),
  asyncHandler(revokeToken)
);

/**
 * @swagger
 * /api/tokens/revoke-all:
 *   post:
 *     summary: Revoke all user tokens
 *     tags: [Tokens]
 */
router.post(
  '/revoke-all',
  requireDelete('token-management'),
  asyncHandler(revokeAllUserTokens)
);

/**
 * @swagger
 * /api/tokens/usage-stats:
 *   get:
 *     summary: Get token usage statistics
 *     tags: [Tokens]
 */
router.get(
  '/usage-stats',
  requireRead('token-management'),
  asyncHandler(getTokenUsageStats)
);

export default router;
