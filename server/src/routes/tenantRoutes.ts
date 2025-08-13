import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { superadminOnly } from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantStats,
} from '@/controllers/tenantController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management operations
 */

// All tenant routes require authentication and superadmin access
router.use(authMiddleware);
router.use(superadminOnly);

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 */
router.get('/', asyncHandler(getAllTenants));

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 */
router.post('/', asyncHandler(createTenant));

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 */
router.get('/:id', asyncHandler(getTenantById));

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
 */
router.put('/:id', asyncHandler(updateTenant));

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
 */
router.delete('/:id', asyncHandler(deleteTenant));

/**
 * @swagger
 * /api/tenants/{id}/users:
 *   get:
 *     summary: Get users for a tenant
 *     tags: [Tenants]
 */
router.get('/:id/users', asyncHandler(getTenantUsers));

/**
 * @swagger
 * /api/tenants/stats:
 *   get:
 *     summary: Get tenant statistics
 *     tags: [Tenants]
 */
router.get('/stats', asyncHandler(getTenantStats));

export default router;
