import { Request, Response } from 'express';
import { TenantService } from '@/services/tenantService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantListParamsSchema,
} from '@/validation/tenantValidation';

const tenantService = new TenantService();

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create a new tenant
 *     description: Create a new tenant organization with the provided information
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantRequest'
 *     responses:
 *       201:
 *         description: Tenant created successfully
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
 *                   example: Tenant created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error or tenant already exists
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
export const createTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = createTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const tenantData = validationResult.data;
    const auditUserId = req.user?.userId;

    const tenant = await tenantService.createTenant(tenantData, auditUserId);

    successResponse(res, tenant, 'Tenant created successfully', 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create tenant';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get list of tenants
 *     description: Retrieve a paginated list of tenants with optional filtering
 *     tags: [Tenants]
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
 *         description: Search term for name or domain
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, domain, createdAt]
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
 *         description: Tenants retrieved successfully
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
export const getTenants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = tenantListParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Invalid query parameters',
        validationResult.error.issues
      );
      return;
    }

    const params = validationResult.data;
    const result = await tenantService.listTenants(params);

    successResponse(
      res,
      {
        tenants: result.tenants,
        total: result.total,
        meta: result.meta,
      },
      'Tenants retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve tenants';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     description: Retrieve a specific tenant by their ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
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
 *                   example: Tenant retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Tenant not found
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
export const getTenantById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    const tenant = await tenantService.getTenantById(id);

    successResponse(res, tenant, 'Tenant retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve tenant';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Tenant not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     description: Update an existing tenant's information
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantRequest'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
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
 *                   example: Tenant updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tenant not found
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
export const updateTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    // Validate request body
    const validationResult = updateTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const tenantData = validationResult.data;
    const auditUserId = req.user?.userId;

    const tenant = await tenantService.updateTenant(
      id,
      tenantData,
      auditUserId
    );

    successResponse(res, 'Tenant updated successfully', tenant);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update tenant';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Tenant not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: Delete tenant
 *     description: Soft delete a tenant (mark as inactive)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
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
 *                   example: Tenant deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Tenant not found
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
export const deleteTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const auditUserId = req.user?.userId;

    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    const tenant = await tenantService.deleteTenant(id, auditUserId);

    successResponse(res, 'Tenant deleted successfully', tenant);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete tenant';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Tenant not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/tenants/{id}/users:
 *   get:
 *     summary: Get users by tenant
 *     description: Retrieve all users belonging to a specific tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
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
 *     responses:
 *       200:
 *         description: Tenant users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       404:
 *         description: Tenant not found
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
export const getTenantUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    const result = await tenantService.getTenantWithUsers(id);

    successResponse(
      res,
      {
        users: result.users.map((user: any) => {
          const { passwordHash, ...userData } = user;
          return userData;
        }),
        total: result.users.length,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total: result.users.length,
          totalPages: Math.ceil(result.users.length / Number(limit)),
        },
      },
      'Tenant users retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve tenant users';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Tenant not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/tenants/stats:
 *   get:
 *     summary: Get tenant statistics
 *     description: Retrieve tenant statistics and metrics
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant statistics retrieved successfully
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
 *                   example: Tenant statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTenants:
 *                       type: number
 *                       example: 10
 *                     activeTenants:
 *                       type: number
 *                       example: 8
 *                     inactiveTenants:
 *                       type: number
 *                       example: 2
 *                     totalUsers:
 *                       type: number
 *                       example: 150
 *                     averageUsersPerTenant:
 *                       type: number
 *                       example: 15
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getTenantStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await tenantService.getAllTenantStats();

    successResponse(res, stats, 'Tenant statistics retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve tenant statistics';
    errorResponse(res, message, 500);
  }
};
