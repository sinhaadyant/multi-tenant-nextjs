import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { requireTenant } from '@/middleware/tenantResolver';
import {
  requireRead,
  requireCreate,
  requireUpdate,
  requireDelete,
} from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getModuleSubmodules,
  createSubmodule,
  updateSubmodule,
  deleteSubmodule,
  getUserMenu,
} from '@/controllers/moduleController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Module and menu management
 */

// All module routes require authentication and tenant context
router.use(authMiddleware);
router.use(requireTenant);

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Get all modules
 *     tags: [Modules]
 */
router.get('/', requireRead('module-management'), asyncHandler(getAllModules));

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 */
router.post(
  '/',
  requireCreate('module-management'),
  asyncHandler(createModule)
);

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 */
router.get(
  '/:id',
  requireRead('module-management'),
  asyncHandler(getModuleById)
);

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update module
 *     tags: [Modules]
 */
router.put(
  '/:id',
  requireUpdate('module-management'),
  asyncHandler(updateModule)
);

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete module
 *     tags: [Modules]
 */
router.delete(
  '/:id',
  requireDelete('module-management'),
  asyncHandler(deleteModule)
);

/**
 * @swagger
 * /api/modules/reorder:
 *   post:
 *     summary: Reorder modules
 *     tags: [Modules]
 */
router.post(
  '/reorder',
  requireUpdate('module-management'),
  asyncHandler(reorderModules)
);

/**
 * @swagger
 * /api/modules/{id}/submodules:
 *   get:
 *     summary: Get module submodules
 *     tags: [Modules]
 */
router.get(
  '/:id/submodules',
  requireRead('module-management'),
  asyncHandler(getModuleSubmodules)
);

/**
 * @swagger
 * /api/modules/{id}/submodules:
 *   post:
 *     summary: Create submodule
 *     tags: [Modules]
 */
router.post(
  '/:id/submodules',
  requireCreate('module-management'),
  asyncHandler(createSubmodule)
);

/**
 * @swagger
 * /api/modules/{moduleId}/submodules/{submoduleId}:
 *   put:
 *     summary: Update submodule
 *     tags: [Modules]
 */
router.put(
  '/:moduleId/submodules/:submoduleId',
  requireUpdate('module-management'),
  asyncHandler(updateSubmodule)
);

/**
 * @swagger
 * /api/modules/{moduleId}/submodules/{submoduleId}:
 *   delete:
 *     summary: Delete submodule
 *     tags: [Modules]
 */
router.delete(
  '/:moduleId/submodules/:submoduleId',
  requireDelete('module-management'),
  asyncHandler(deleteSubmodule)
);

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get user menu tree
 *     tags: [Modules]
 */
router.get('/menu', asyncHandler(getUserMenu));

export default router;
