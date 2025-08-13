import { Request, Response } from 'express';
import { UserService } from '@/services/userService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';
import {
  createUserSchema,
  updateUserSchema,
  userListParamsSchema,
} from '@/validation/userValidation';

const userService = new UserService();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
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
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = createUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const userData = validationResult.data;
    const auditUserId = req.user?.userId;

    const user = await userService.createUser(userData, auditUserId);
    const { passwordHash, ...userResponse } = user;

    successResponse(res, 'User created successfully', userResponse, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create user';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: Retrieve a paginated list of users with optional filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isSuperadmin
 *         schema:
 *           type: boolean
 *         description: Filter by superadmin status
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt, lastLoginAt]
 *           default: createdAt
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Order direction
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
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
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = userListParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Invalid query parameters',
        validationResult.error.issues
      );
      return;
    }

    const params = validationResult.data;
    const result = await userService.listUsers(params);

    successResponse(
      res,
      {
        users: result.users.map(user => {
          const { passwordHash, ...userData } = user;
          return userData;
        }),
        total: result.total,
        meta: result.meta,
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve users';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const user = await userService.getUserById(id);
    const { passwordHash, ...userData } = user;

    successResponse(res, 'User retrieved successfully', userData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve user';
    if (message.includes('not found')) {
      notFoundResponse(res, 'User not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    // Validate request body
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const userData = validationResult.data;
    const auditUserId = req.user?.userId;

    const user = await userService.updateUser(id, userData, auditUserId);
    const { passwordHash, ...userResponse } = user;

    successResponse(res, 'User updated successfully', userResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update user';
    if (message.includes('not found')) {
      notFoundResponse(res, 'User not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Soft delete a user (mark as inactive)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const auditUserId = req.user?.userId;

    if (!id) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const user = await userService.softDeleteUser(id, auditUserId);
    const { passwordHash, ...userResponse } = user;

    successResponse(res, 'User deleted successfully', userResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete user';
    if (message.includes('not found')) {
      notFoundResponse(res, 'User not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve user statistics and metrics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter statistics by tenant ID
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                   example: User statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       example: 100
 *                     activeUsers:
 *                       type: number
 *                       example: 85
 *                     inactiveUsers:
 *                       type: number
 *                       example: 15
 *                     superadmins:
 *                       type: number
 *                       example: 2
 *                     regularUsers:
 *                       type: number
 *                       example: 98
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tenantId } = req.query;
    const stats = await userService.getUserStats(tenantId as string);

    successResponse(res, 'User statistics retrieved successfully', stats);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve user statistics';
    errorResponse(res, message, 500);
  }
};
