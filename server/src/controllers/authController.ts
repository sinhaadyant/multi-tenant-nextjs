import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/utils/apiResponse';
import { loginSchema } from '@/validation/userValidation';

const authService = new AuthService();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get access tokens
 *     description: Authenticate a user with email and password, return JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const { email, password, tenantSlug } = validationResult.data;

    // Get device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '127.0.0.1',
    };

    // Authenticate user and generate tokens
    const result = await authService.login(
      { email, password, tenantSlug },
      deviceInfo
    );

    // Remove sensitive data from response
    const { passwordHash, ...userData } = result.user;

    successResponse(
      res,
      {
        user: userData,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        deviceId: result.deviceId,
      },
      'Login successful'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    errorResponse(res, message, 401);
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New access token
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      badRequestResponse(res, 'Refresh token is required');
      return;
    }

    // TODO: Implement refresh token validation and generation
    // This would involve:
    // 1. Verifying the refresh token
    // 2. Checking if it's not expired
    // 3. Generating new access and refresh tokens
    // 4. Invalidating the old refresh token

    successResponse(res, 'Token refresh endpoint - implementation pending');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Token refresh failed';
    errorResponse(res, message, 401);
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate tokens
 *     description: Logout the current user and invalidate their tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement token invalidation
    // This would involve:
    // 1. Adding the current token to a blacklist
    // 2. Invalidating refresh tokens
    // 3. Logging the logout action

    successResponse(res, 'Logout successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                   example: User information retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'User not authenticated', 401);
      return;
    }

    const user = await authService.validateAccessToken(
      req.headers.authorization?.replace('Bearer ', '') || ''
    );
    const { passwordHash, ...userData } = user;

    successResponse(res, 'User information retrieved successfully', userData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get user information';
    errorResponse(res, message, 500);
  }
};
