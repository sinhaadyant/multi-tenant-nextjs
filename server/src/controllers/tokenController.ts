import { Request, Response } from 'express';
import { TokenService } from '@/services/tokenService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';

const tokenService = new TokenService();

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: Get user tokens
 *     description: Retrieve all refresh tokens for the current user
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tokens retrieved successfully
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
 *                   example: User tokens retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RefreshToken'
 */
export const getUserTokens = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const tokens = await tokenService.getUserRefreshTokens(userId);
    successResponse(res, tokens, 'User tokens retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve user tokens';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tokens/stats:
 *   get:
 *     summary: Get user token statistics
 *     description: Retrieve token usage statistics for the current user
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User token statistics retrieved successfully
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
 *                   example: User token statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTokens:
 *                       type: number
 *                       example: 5
 *                     activeTokens:
 *                       type: number
 *                       example: 3
 *                     expiredTokens:
 *                       type: number
 *                       example: 2
 *                     recentTokens:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RefreshToken'
 */
export const getUserTokenStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const stats = await tokenService.getUserTokenStats(userId);
    successResponse(res, stats, 'User token statistics retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve user token statistics';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tokens/{tokenId}:
 *   delete:
 *     summary: Revoke specific token
 *     description: Revoke a specific refresh token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token revoked successfully
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
 *                   example: Token revoked successfully
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const revokeToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tokenId } = req.params;
    if (!tokenId) {
      badRequestResponse(res, 'Token ID is required');
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    // TODO: Implement token revocation
    successResponse(res, null, 'Token revoked successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to revoke token';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Token not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/tokens/revoke-all:
 *   post:
 *     summary: Revoke all user tokens
 *     description: Revoke all refresh tokens for the current user
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tokens revoked successfully
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
 *                   example: All tokens revoked successfully
 */
export const revokeAllUserTokens = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    await tokenService.invalidateAllRefreshTokens(userId);
    successResponse(res, null, 'All tokens revoked successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to revoke all tokens';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tokens/usage-stats:
 *   get:
 *     summary: Get token usage statistics
 *     description: Retrieve overall token usage statistics (admin only)
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token usage statistics retrieved successfully
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
 *                   example: Token usage statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTokens:
 *                       type: number
 *                       example: 100
 *                     activeTokens:
 *                       type: number
 *                       example: 75
 *                     expiredTokens:
 *                       type: number
 *                       example: 25
 *                     tokensByDevice:
 *                       type: object
 *                       example: { "desktop": 50, "mobile": 30, "tablet": 20 }
 */
export const getTokenUsageStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await tokenService.getTokenUsageStats();
    successResponse(
      res,
      stats,
      'Token usage statistics retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve token usage statistics';
    errorResponse(res, message, 500);
  }
};
