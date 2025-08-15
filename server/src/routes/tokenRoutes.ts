import { Router } from 'express';
import {
  getUserRefreshTokens,
  getRefreshTokenById,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '@/controllers/tokenController';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

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
 *     summary: Get user refresh tokens
 *     tags: [Tokens]
 */
router.get('/', asyncHandler(getUserRefreshTokens));

/**
 * @swagger
 * /api/tokens/{id}:
 *   get:
 *     summary: Get refresh token by ID
 *     tags: [Tokens]
 */
router.get('/:id', asyncHandler(getRefreshTokenById));

/**
 * @swagger
 * /api/tokens/{id}:
 *   delete:
 *     summary: Revoke refresh token
 *     tags: [Tokens]
 */
router.delete('/:id', asyncHandler(revokeRefreshToken));

/**
 * @swagger
 * /api/tokens/revoke-all:
 *   post:
 *     summary: Revoke all user tokens
 *     tags: [Tokens]
 */
router.post('/revoke-all', asyncHandler(revokeAllUserTokens));

export default router;
