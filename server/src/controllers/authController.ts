import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/utils/apiResponse';
import { loginSchema, createUserSchema } from '@/validation/userValidation';
import { validateRequestBody } from '@/utils/validationErrorHandler';

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
    const validatedData = validateRequestBody(loginSchema, req.body, res);
    if (!validatedData) return; // Validation failed, response already sent

    const { email, password, tenantSlug } = validatedData;

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

    // Get device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '127.0.0.1',
    };

    // Refresh tokens
    const result = await authService.refreshToken(refreshToken, deviceInfo);

    successResponse(
      res,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Token refreshed successfully'
    );
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
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    let refreshToken = req.body.refreshToken;

    // If no refresh token in body, try to get it from the user's active tokens
    if (!refreshToken && req.user) {
      // Get the most recent refresh token for the user
      const userTokens = await authService.getUserRefreshTokens(req.user.id);
      if (userTokens.length > 0) {
        refreshToken = userTokens[0].token;
      }
    }

    if (!refreshToken) {
      badRequestResponse(res, 'Refresh token is required');
      return;
    }

    // Get device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '127.0.0.1',
    };

    // Logout user
    await authService.logout(refreshToken, deviceInfo);

    successResponse(res, null, 'Logged out successfully');
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

    // Get user data from database to ensure we have the latest information
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    // Remove sensitive data
    const { passwordHash, ...userData } = user;

    successResponse(res, userData, 'User information retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get user information';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               tenantSlug:
 *                 type: string
 *                 description: Tenant slug for multi-tenant setup
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
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
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body using the createUserSchema
    const validatedData = validateRequestBody(createUserSchema, req.body, res);
    if (!validatedData) return; // Validation failed, response already sent

    const { name, email, password } = validatedData;
    const { tenantSlug } = req.body; // Get tenantSlug from original request body

    // Create user data
    const userData = {
      name,
      email,
      password,
      tenantId: undefined, // Will be set based on tenant slug
      isSuperadmin: false,
      isActive: true,
    };

    // If tenant slug is provided, find the tenant
    if (tenantSlug) {
      // TODO: Implement tenant lookup by slug
      // const tenant = await tenantService.findBySlug(tenantSlug);
      // if (!tenant) {
      //   badRequestResponse(res, 'Tenant not found');
      //   return;
      // }
      // userData.tenantId = tenant.id;
    }

    // Create user
    const user = await authService.register(userData);

    // Remove sensitive data from response
    const { passwordHash, ...userResponse } = user;

    successResponse(
      res,
      { user: userResponse },
      'User registered successfully',
      201
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Registration failed';
    if (message.includes('already exists')) {
      badRequestResponse(res, message);
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the current user's password
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
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'User not authenticated', 401);
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      badRequestResponse(res, 'Current password and new password are required');
      return;
    }

    if (newPassword.length < 8) {
      badRequestResponse(
        res,
        'New password must be at least 8 characters long'
      );
      return;
    }

    // Change password
    await authService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });

    successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Password change failed';
    if (message.includes('incorrect')) {
      badRequestResponse(res, message);
    } else {
      errorResponse(res, message, 500);
    }
  }
};
