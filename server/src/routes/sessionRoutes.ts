import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  getLoginHistory,
  getDeviceManagement,
  securityCheck,
  getSessionStats,
  updateSessionActivity,
} from '@/controllers/sessionController';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

router.get('/', asyncHandler(getUserSessions));
router.delete('/:sessionId', asyncHandler(revokeSession));
router.delete('/others', asyncHandler(revokeAllOtherSessions));
router.get('/history', asyncHandler(getLoginHistory));
router.get('/devices', asyncHandler(getDeviceManagement));
router.post('/:sessionId/security-check', asyncHandler(securityCheck));
router.get('/stats', asyncHandler(getSessionStats));
router.put('/:sessionId/activity', asyncHandler(updateSessionActivity));

export default router;
