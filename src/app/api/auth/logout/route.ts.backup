import { NextRequest, NextResponse } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse } from '@/lib/apiResponse';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// POST /api/auth/logout - Logout current user
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // In a real application, you might want to:
    // 1. Add the token to a blacklist
    // 2. Update user's last logout time
    // 3. Clear refresh tokens
    // 4. Log the logout event
    
    if (req.user) {
      // Log logout event (optional)
      console.log(`User ${req.user.email} logged out`);
    }

    return createSuccessResponse({
      message: 'Logged out successfully'
    }, 'Logout successful');

  } catch (error: any) {
    console.error('Error during logout:', error);
    // Even if there's an error, we still return success
    // because the client will clear local data anyway
    return createSuccessResponse({
      message: 'Logged out successfully'
    }, 'Logout successful');
  }
}, { requireAuth: false }); // Allow logout even without valid token 