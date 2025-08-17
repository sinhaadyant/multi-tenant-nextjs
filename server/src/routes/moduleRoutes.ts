import { Router } from 'express';
import { moduleController } from '../controllers/moduleController';
import { authMiddleware } from '../middleware/auth';
import { permissionGuard } from '../middleware/permissionGuard';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all modules (hierarchical structure)
router.get(
  '/',
  permissionGuard({ moduleKey: 'modules', action: 'read' }),
  moduleController.getAllModules
);

// Get modules for menu (active modules only)
router.get('/menu', moduleController.getMenuModules);

// Get single module by ID
router.get(
  '/:id',
  permissionGuard({ moduleKey: 'modules', action: 'read' }),
  moduleController.getModuleById
);

// Create new module
router.post(
  '/',
  permissionGuard({ moduleKey: 'modules', action: 'create' }),
  moduleController.createModule
);

// Update module
router.put(
  '/:id',
  permissionGuard({ moduleKey: 'modules', action: 'update' }),
  moduleController.updateModule
);

// Delete module
router.delete(
  '/:id',
  permissionGuard({ moduleKey: 'modules', action: 'delete' }),
  moduleController.deleteModule
);

// Toggle module status
router.patch(
  '/:id/toggle',
  permissionGuard({ moduleKey: 'modules', action: 'update' }),
  moduleController.toggleModuleStatus
);

// Reorder modules
router.post(
  '/reorder',
  permissionGuard({ moduleKey: 'modules', action: 'update' }),
  moduleController.reorderModules
);

export default router;
