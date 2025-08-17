import { Router } from 'express';
import { submoduleController } from '../controllers/submoduleController';
import { authMiddleware } from '../middleware/auth';
import { permissionGuard } from '../middleware/permissionGuard';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all submodules
router.get(
  '/',
  permissionGuard({ moduleKey: 'submodules', action: 'read' }),
  submoduleController.getAllSubmodules
);

// Get submodules by module ID
router.get(
  '/module/:moduleId',
  permissionGuard({ moduleKey: 'submodules', action: 'read' }),
  submoduleController.getSubmodulesByModuleId
);

// Get single submodule by ID
router.get(
  '/:id',
  permissionGuard({ moduleKey: 'submodules', action: 'read' }),
  submoduleController.getSubmoduleById
);

// Create new submodule
router.post(
  '/',
  permissionGuard({ moduleKey: 'submodules', action: 'create' }),
  submoduleController.createSubmodule
);

// Update submodule
router.put(
  '/:id',
  permissionGuard({ moduleKey: 'submodules', action: 'update' }),
  submoduleController.updateSubmodule
);

// Delete submodule
router.delete(
  '/:id',
  permissionGuard({ moduleKey: 'submodules', action: 'delete' }),
  submoduleController.deleteSubmodule
);

// Toggle submodule status
router.patch(
  '/:id/toggle',
  permissionGuard({ moduleKey: 'submodules', action: 'update' }),
  submoduleController.toggleSubmoduleStatus
);

// Reorder submodules
router.post(
  '/reorder',
  permissionGuard({ moduleKey: 'submodules', action: 'update' }),
  submoduleController.reorderSubmodules
);

export default router;
