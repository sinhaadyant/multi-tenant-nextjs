import { Request, Response } from 'express';
import { ResetTokenService } from '@/services/resetTokenService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/utils/apiResponse';
import { z } from 'zod';

const resetTokenService = new ResetTokenService();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email format'),
  tenantSlug: z.string().optional(),
});

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @swagger
 * /api/auth/request-reset:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               tenantSlug:
 *                 type: string
 *                 example: tenant-a
 *                 description: Optional tenant slug for multi-tenant setups
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: Password reset email sent successfully
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = requestResetSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const { email, tenantSlug } = validationResult.data;
    const ipAddress = req.ip || '127.0.0.1';

    // Generate reset token
    await resetTokenService.generateResetToken(
      { email, tenantSlug },
      ipAddress
    );

    successResponse(
      res,
      null,
      'Password reset email sent successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to request password reset';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/auth/confirm-reset:
 *   post:
 *     summary: Confirm password reset
 *     description: Reset password using the provided token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 example: newSecurePassword123
 *                 description: New password (minimum 8 characters)
 *             required:
 *               - token
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid request data or token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reset token not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const confirmPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = confirmResetSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const { token, newPassword } = validationResult.data;
    const ipAddress = req.ip || '127.0.0.1';

    // Reset password
    await resetTokenService.resetPassword(
      { token, newPassword },
      ipAddress
    );

    successResponse(
      res,
      null,
      'Password reset successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reset password';
    
    if (message.includes('Invalid reset token') || message.includes('not found')) {
      errorResponse(res, 'Invalid or expired reset token', 404);
    } else if (message.includes('already used')) {
      errorResponse(res, 'Reset token has already been used', 400);
    } else if (message.includes('expired')) {
      errorResponse(res, 'Reset token has expired', 400);
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/auth/validate-reset-token:
 *   post:
 *     summary: Validate reset token
 *     description: Check if a reset token is valid without using it
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *                 description: Reset token to validate
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Token validation result
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
 *                   example: Token validation completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const validateResetToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      badRequestResponse(res, 'Token is required');
      return;
    }

    // Validate token
    const isValid = await resetTokenService.validateResetToken(token);

    successResponse(
      res,
      { isValid },
      'Token validation completed'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to validate token';
    errorResponse(res, message, 500);
  }
};
