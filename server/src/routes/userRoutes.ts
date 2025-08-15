import { Router } from 'express';
import { userController } from '@/controllers/userController';
import { authMiddleware } from '@/middleware/auth';
import { permissionGuard } from '@/middleware/permissionGuard';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all users (with pagination and filtering)
router.get(
  '/',
  permissionGuard({ moduleKey: 'user-management', action: 'read' }),
  userController.getUsers.bind(userController)
);

// Get current user profile
router.get('/profile', userController.getCurrentUser.bind(userController));

// Update current user profile
router.patch('/profile', userController.updateCurrentUser.bind(userController));

// Get user by ID
router.get(
  '/:id',
  permissionGuard({ moduleKey: 'user-management', action: 'read' }),
  userController.getUserById.bind(userController)
);

// Create new user
router.post(
  '/',
  permissionGuard({ moduleKey: 'user-management', action: 'create' }),
  userController.createUser.bind(userController)
);

// Update user
router.patch(
  '/:id',
  permissionGuard({ moduleKey: 'user-management', action: 'update' }),
  userController.updateUser.bind(userController)
);

// Delete user (soft delete)
router.delete(
  '/:id',
  permissionGuard({ moduleKey: 'user-management', action: 'delete' }),
  userController.deleteUser.bind(userController)
);

export default router;
