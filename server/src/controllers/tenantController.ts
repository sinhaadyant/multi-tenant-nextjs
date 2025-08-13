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
} from '@/validation/tenantValidation';

const tenantService = new TenantService();

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     description: Retrieve all tenants (superadmin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
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
 *         description: Search term for tenant name or slug
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
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
 *                   example: Tenants retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllTenants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const tenants = await tenantService.listTenants({
      page: Number(page),
      limit: Number(limit),
      filters: {
        search: search as string,
      },
      orderBy: sortBy as 'name' | 'domain' | 'createdAt',
      orderDirection: sortOrder as 'asc' | 'desc',
    });

    successResponse(res, tenants, 'Tenants retrieved successfully');
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
 *     description: Retrieve a specific tenant by its ID
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
 * /api/tenants:
 *   post:
 *     summary: Create a new tenant
 *     description: Create a new tenant (superadmin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corporation"
 *               slug:
 *                 type: string
 *                 example: "acme"
 *               domain:
 *                 type: string
 *                 example: "acme.com"
 *               settings:
 *                 type: object
 *                 example: { "theme": "dark", "timezone": "UTC" }
 *               isActive:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - name
 *               - slug
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
 *         description: Validation error
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
    const validationResult = createTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const tenant = await tenantService.createTenant(
      validationResult.data,
      req.user?.userId
    );
    successResponse(res, tenant, 'Tenant created successfully', 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create tenant';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     description: Update an existing tenant (superadmin only)
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Acme Corporation"
 *               slug:
 *                 type: string
 *                 example: "acme"
 *               domain:
 *                 type: string
 *                 example: "acme.com"
 *               settings:
 *                 type: object
 *                 example: { "theme": "light", "timezone": "UTC" }
 *               isActive:
 *                 type: boolean
 *                 example: true
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
 *       404:
 *         description: Tenant not found
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

    const validationResult = updateTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const tenant = await tenantService.updateTenant(
      id,
      validationResult.data,
      req.user?.userId
    );
    successResponse(res, tenant, 'Tenant updated successfully');
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
 *     description: Delete a tenant (soft delete, superadmin only)
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
 *       404:
 *         description: Tenant not found
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
    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    await tenantService.deleteTenant(id, req.user?.userId);
    successResponse(res, null, 'Tenant deleted successfully');
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
 *     summary: Get tenant users
 *     description: Retrieve all users for a specific tenant
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
 *         description: Page number
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tenant users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         description: Tenant not found
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
    if (!id) {
      badRequestResponse(res, 'Tenant ID is required');
      return;
    }

    const result = await tenantService.getTenantWithUsers(id);
    const users = result.users.map((user: any) => {
      const { passwordHash, ...userData } = user;
      return userData;
    });

    successResponse(res, users, 'Tenant users retrieved successfully');
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
 *     description: Retrieve statistics for all tenants
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
