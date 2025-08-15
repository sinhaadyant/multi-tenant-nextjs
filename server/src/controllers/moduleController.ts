import { Request, Response } from 'express';
import { ModuleService } from '@/services/moduleService';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/utils/apiResponse';
import {
  createModuleSchema,
  updateModuleSchema,
  createSubmoduleSchema,
  updateSubmoduleSchema,
  updateOrderSchema,
} from '@/validation/moduleValidation';
import { logger } from '@/config/logger';

const moduleService = new ModuleService();

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Get all modules
 *     description: Retrieve all modules for the current tenant
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modules retrieved successfully
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
 *                   example: Modules retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 */
export const getAllModules = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const modules = await moduleService.listModules({
      page: 1,
      limit: 100,
      filters: {
        isActive: true,
      },
      orderBy: 'orderIndex',
      orderDirection: 'asc',
    });
    successResponse(res, modules, 'Modules retrieved successfully');
  } catch (error) {
    logger.error('Error in getAllModules:', error);
    errorResponse(res, 'Failed to retrieve modules', 500);
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     description: Retrieve a specific module by its ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module retrieved successfully
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
 *                   example: Module retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getModuleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      errorResponse(res, 'Module ID is required', 400);
      return;
    }
    const module = await moduleService.getModuleById(id);

    if (!module) {
      notFoundResponse(res, 'Module not found');
      return;
    }

    successResponse(res, module, 'Module retrieved successfully');
  } catch (error) {
    logger.error('Error in getModuleById:', error);
    errorResponse(res, 'Failed to retrieve module', 500);
  }
};

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Create a new module
 *     description: Create a new module for the current tenant
 *     tags: [Modules]
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
 *                 example: "User Management"
 *               key:
 *                 type: string
 *                 example: "user-management"
 *               description:
 *                 type: string
 *                 example: "Manage users and their permissions"
 *               icon:
 *                 type: string
 *                 example: "users"
 *               order:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - name
 *               - key
 *     responses:
 *       201:
 *         description: Module created successfully
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
 *                   example: Module created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationResult = createModuleSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const module = await moduleService.createModule(
      validationResult.data,
      req.user?.id || ''
    );
    successResponse(res, module, 'Module created successfully', 201);
  } catch (error) {
    logger.error('Error in createModule:', error);
    errorResponse(res, 'Failed to create module', 500);
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update module
 *     description: Update an existing module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated User Management"
 *               key:
 *                 type: string
 *                 example: "user-management"
 *               description:
 *                 type: string
 *                 example: "Updated user management description"
 *               icon:
 *                 type: string
 *                 example: "users"
 *               order:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Module updated successfully
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
 *                   example: Module updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const validationResult = updateModuleSchema.safeParse(req.body);

    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const module = await moduleService.updateModule(
      id!,
      validationResult.data,
      req.user?.id || ''
    );
    successResponse(res, module, 'Module updated successfully');
  } catch (error) {
    logger.error('Error in updateModule:', error);
    errorResponse(res, 'Failed to update module', 500);
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete module
 *     description: Delete a module (soft delete)
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
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
 *                   example: Module deleted successfully
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      errorResponse(res, 'Module ID is required', 400);
      return;
    }
    await moduleService.deleteModule(id, req.user?.id || '');
    successResponse(res, null, 'Module deleted successfully');
  } catch (error) {
    logger.error('Error in deleteModule:', error);
    errorResponse(res, 'Failed to delete module', 500);
  }
};

/**
 * @swagger
 * /api/modules/reorder:
 *   post:
 *     summary: Reorder modules
 *     description: Update the order of modules
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: number
 *     responses:
 *       200:
 *         description: Modules reordered successfully
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
 *                   example: Modules reordered successfully
 */
export const reorderModules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationResult = updateOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    await moduleService.updateModuleOrder(validationResult.data, req.user?.id);
    successResponse(res, null, 'Modules reordered successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reorder modules';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/modules/{id}/submodules:
 *   get:
 *     summary: Get module submodules
 *     description: Retrieve all submodules for a specific module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Submodules retrieved successfully
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
 *                   example: Submodules retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submodule'
 */
export const getModuleSubmodules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      badRequestResponse(res, 'Module ID is required');
      return;
    }

    const submodules = await moduleService.getSubmodulesByModuleId(id);
    successResponse(res, submodules, 'Submodules retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve submodules';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Module not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/modules/{id}/submodules:
 *   post:
 *     summary: Create submodule
 *     description: Create a new submodule for a specific module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "User List"
 *               key:
 *                 type: string
 *                 example: "user-list"
 *               description:
 *                 type: string
 *                 example: "View and manage users"
 *               icon:
 *                 type: string
 *                 example: "list"
 *               order:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - name
 *               - key
 *     responses:
 *       201:
 *         description: Submodule created successfully
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
 *                   example: Submodule created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Submodule'
 */
export const createSubmodule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: moduleId } = req.params;
    if (!moduleId) {
      badRequestResponse(res, 'Module ID is required');
      return;
    }

    const validationResult = createSubmoduleSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const submoduleData = {
      ...validationResult.data,
      moduleId,
    };

    const submodule = await moduleService.createSubmodule(
      submoduleData,
      req.user?.id || ''
    );
    successResponse(res, submodule, 'Submodule created successfully', 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create submodule';
    errorResponse(res, message, 500);
  }
};

/**
 * @swagger
 * /api/modules/{moduleId}/submodules/{submoduleId}:
 *   put:
 *     summary: Update submodule
 *     description: Update an existing submodule
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *       - in: path
 *         name: submoduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submodule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated User List"
 *               key:
 *                 type: string
 *                 example: "user-list"
 *               description:
 *                 type: string
 *                 example: "Updated user list description"
 *               icon:
 *                 type: string
 *                 example: "list"
 *               order:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Submodule updated successfully
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
 *                   example: Submodule updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Submodule'
 *       404:
 *         description: Submodule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateSubmodule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { moduleId, submoduleId } = req.params;
    if (!moduleId || !submoduleId) {
      badRequestResponse(res, 'Module ID and Submodule ID are required');
      return;
    }

    const validationResult = updateSubmoduleSchema.safeParse(req.body);
    if (!validationResult.success) {
      badRequestResponse(
        res,
        'Validation failed',
        validationResult.error.issues
      );
      return;
    }

    const submodule = await moduleService.updateSubmodule(
      submoduleId,
      validationResult.data,
      req.user?.id || ''
    );
    successResponse(res, submodule, 'Submodule updated successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update submodule';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Submodule not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/modules/{moduleId}/submodules/{submoduleId}:
 *   delete:
 *     summary: Delete submodule
 *     description: Delete a submodule (soft delete)
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *       - in: path
 *         name: submoduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submodule ID
 *     responses:
 *       200:
 *         description: Submodule deleted successfully
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
 *                   example: Submodule deleted successfully
 *       404:
 *         description: Submodule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteSubmodule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { moduleId, submoduleId } = req.params;
    if (!moduleId || !submoduleId) {
      badRequestResponse(res, 'Module ID and Submodule ID are required');
      return;
    }

    await moduleService.deleteSubmodule(submoduleId, req.user?.id || '');
    successResponse(res, null, 'Submodule deleted successfully');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete submodule';
    if (message.includes('not found')) {
      notFoundResponse(res, 'Submodule not found');
    } else {
      errorResponse(res, message, 500);
    }
  }
};

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get user menu tree
 *     description: Retrieve the menu tree for the authenticated user based on their permissions
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu tree retrieved successfully
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
 *                   example: Menu tree retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       order:
 *                         type: number
 *                       submodules:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             key:
 *                               type: string
 *                             icon:
 *                               type: string
 *                             order:
 *                               type: number
 */
export const getUserMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const menuTree = await moduleService.getMenuForUser(req.user?.id || '');
    successResponse(res, menuTree, 'User menu retrieved successfully');
  } catch (error) {
    logger.error('Error in getUserMenu:', error);
    errorResponse(res, 'Failed to retrieve user menu', 500);
  }
};
