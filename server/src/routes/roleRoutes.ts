import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Role management routes
router.post(
  '/',
  validateRequest,
  roleController.createRole.bind(roleController)
);
router.get('/', roleController.getRoles.bind(roleController));
router.get('/:id', roleController.getRoleById.bind(roleController));
router.put(
  '/:id',
  validateRequest,
  roleController.updateRole.bind(roleController)
);
router.delete('/:id', roleController.deleteRole.bind(roleController));
router.post(
  '/:id/clone',
  validateRequest,
  roleController.cloneRole.bind(roleController)
);

export default router;
