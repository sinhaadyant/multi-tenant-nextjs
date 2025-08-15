import { Router } from 'express';
import { tenantController } from '../controllers/tenantController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Tenant management routes
router.post(
  '/',
  validateRequest,
  tenantController.createTenant.bind(tenantController)
);
router.get('/', tenantController.getTenants.bind(tenantController));
router.get('/stats', tenantController.getTenantStats.bind(tenantController));
router.get('/:id', tenantController.getTenantById.bind(tenantController));
router.put(
  '/:id',
  validateRequest,
  tenantController.updateTenant.bind(tenantController)
);
router.delete('/:id', tenantController.deleteTenant.bind(tenantController));
router.post(
  '/bulk',
  validateRequest,
  tenantController.bulkOperation.bind(tenantController)
);

export default router;
