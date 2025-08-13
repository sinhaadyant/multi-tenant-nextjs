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
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getUserEffectivePermissions,
} from '@/controllers/roleController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and permission management
 */

// All role routes require authentication and tenant context
router.use(authMiddleware);
router.use(requireTenant);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 */
router.get('/', requireRead('role-management'), asyncHandler(getAllRoles));

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 */
router.post('/', requireCreate('role-management'), asyncHandler(createRole));

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 */
router.get('/:id', requireRead('role-management'), asyncHandler(getRoleById));

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 */
router.put('/:id', requireUpdate('role-management'), asyncHandler(updateRole));

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 */
router.delete(
  '/:id',
  requireDelete('role-management'),
  asyncHandler(deleteRole)
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: Get role permissions
 *     tags: [Roles]
 */
router.get(
  '/:id/permissions',
  requireRead('role-management'),
  asyncHandler(getRolePermissions)
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: Update role permissions
 *     tags: [Roles]
 */
router.put(
  '/:id/permissions',
  requireUpdate('role-management'),
  asyncHandler(updateRolePermissions)
);

/**
 * @swagger
 * /api/roles/user/{userId}/permissions:
 *   get:
 *     summary: Get user effective permissions
 *     tags: [Roles]
 */
router.get(
  '/user/:userId/permissions',
  requireRead('role-management'),
  asyncHandler(getUserEffectivePermissions)
);

export default router;
