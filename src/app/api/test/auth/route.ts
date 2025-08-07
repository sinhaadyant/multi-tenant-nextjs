import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { createSuccessResponse } from '@/lib/apiResponse';

// GET /api/test/auth - Test authentication
export const GET = async (req: NextRequest) => {
  try {
    // Test authentication
    const authResult = await requireSuperAdmin(req);
    
    if (authResult instanceof NextResponse) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed',
        status: authResult.status,
        statusText: authResult.statusText,
        timestamp: new Date().toISOString()
      }, { status: authResult.status });
    }

    const superAdmin = authResult as any;
    
    return createSuccessResponse({
      message: 'Authentication successful',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role
      },
      timestamp: new Date().toISOString()
    }, 'Authentication test completed successfully');

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Authentication test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}; 