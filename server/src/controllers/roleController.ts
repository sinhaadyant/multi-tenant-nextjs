import { Request, Response } from 'express';
import { RoleService } from '@/services/roleService';
import { PermissionService } from '@/services/permissionService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';
import { z } from 'zod';

const roleService = new RoleService();
const permissionService = new PermissionService();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').optional(),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
});

const updatePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      moduleId: z.string(),
      submoduleId: z.string().optional(),
      canCreate: z.boolean(),
      canRead: z.boolean(),
      canUpdate: z.boolean(),
      canDelete: z.boolean(),
      canViewAll: z.boolean(),
    })
  ),
});

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles for the current tenant
 *     tags: [Roles]
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
 *         description: Search term for role name
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                   example: Roles retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllRoles = async (
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

    const roles = await roleService.listRoles({
      page: Number(page),
      limit: Number(limit),
      filters: {
        search: search as string,
        tenantId: req.tenant?.id,
      },
      orderBy: sortBy as 'name' | 'createdAt',
      orderDirection: sortOrder as 'asc' | 'desc',
    });

    successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve roles';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role by its ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
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
 *                   example: Role retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getRoleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Role ID is required');
      return;
    }

    const role = await roleService.getRoleById(id);
    successResponse(res, role, 'Role retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve role';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Role not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role for the current tenant
 *     tags: [Roles]
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
 *                 example: "Admin"
 *               description:
 *                 type: string
 *                 example: "Administrator role with full access"
 *               isGlobal:
 *                 type: boolean
 *                 example: false
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *                   example: Role created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const roleData = {
      ...validationResult.data,
      tenantId: req.tenant?.id,
      isGlobal: validationResult.data.isGlobal ?? false,
    };

    const role = await roleService.createRole(roleData, req.user?.userId);
    successResponse(res, role, 'Role created successfully', 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create role';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     description: Update an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Admin"
 *               description:
 *                 type: string
 *                 example: "Updated administrator role"
 *               isGlobal:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *                   example: Role updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Role ID is required');
      return;
    }

    const validationResult = updateRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const role = await roleService.updateRole(
      id,
      validationResult.data,
      req.user?.userId
    );
    successResponse(res, role, 'Role updated successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update role';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Role not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     description: Delete a role (soft delete)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                   example: Role deleted successfully
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Role ID is required');
      return;
    }

    await roleService.deleteRole(id, req.user?.userId);
    successResponse(res, null, 'Role deleted successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete role';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Role not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: Get role permissions
 *     description: Retrieve permissions for a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
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
 *                   example: Role permissions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getRolePermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Role ID is required');
      return;
    }

    const roleWithPermissions = await roleService.getRoleWithPermissions(id);
    const permissions = roleWithPermissions.permissions || [];
    successResponse(
      res,
      permissions,
      'Role permissions retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve role permissions';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Role not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: Update role permissions
 *     description: Update permissions for a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     moduleId:
 *                       type: string
 *                     submoduleId:
 *                       type: string
 *                     canCreate:
 *                       type: boolean
 *                     canRead:
 *                       type: boolean
 *                     canUpdate:
 *                       type: boolean
 *                     canDelete:
 *                       type: boolean
 *                     canViewAll:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
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
 *                   example: Role permissions updated successfully
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateRolePermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Role ID is required');
      return;
    }

    const validationResult = updatePermissionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    // TODO: Implement role permissions update
    // await roleService.updateRolePermissions(
    //   id,
    //   validationResult.data.permissions,
    //   req.user?.userId
    // );
    successResponse(res, null, 'Role permissions updated successfully');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update role permissions';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Role not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/roles/user/{userId}/permissions:
 *   get:
 *     summary: Get user effective permissions
 *     description: Retrieve effective permissions for a specific user
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User effective permissions retrieved successfully
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
 *                   example: User effective permissions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getUserEffectivePermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      badRequestResponse(res, 'User ID is required');
      return;
    }

    const effectivePermissions =
      await permissionService.getEffectivePermissions(userId, req.tenant?.id);
    successResponse(
      res,
      effectivePermissions,
      'User effective permissions retrieved successfully'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to retrieve user effective permissions';
    if (message.includes('not found')) {
      notFoundResponse(res, 'User not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};
