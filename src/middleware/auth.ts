import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createErrorResponse } from '@/lib/apiResponse';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export const authenticateJWT = async (req: NextRequest): Promise<NextResponse | JWTPayload> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Authenticating JWT request');
  }

  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ No Bearer token found in Authorization header');
    }
    return createErrorResponse(
      'Access token required',
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ JWT token verified for user:', payload.email);
    }

    return payload;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ JWT token verification failed:', error);
    }
    
    return createErrorResponse(
      'Invalid or expired token',
      401
    );
  }
};

export const requireSuperAdmin = async (req: NextRequest): Promise<NextResponse | JWTPayload> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👑 Checking SuperAdmin role');
  }

  const authResult = await authenticateJWT(req);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const payload = authResult as JWTPayload;

  if (payload.role !== 'superadmin') {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ User is not SuperAdmin:', payload.email);
    }
    
    return createErrorResponse(
      'SuperAdmin access required',
      403
    );
  }

  // Verify SuperAdmin exists and is active
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: payload.id, isActive: true }
    });

    if (!superAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ SuperAdmin not found or inactive:', payload.id);
      }
      
      return createErrorResponse(
        'SuperAdmin account not found or inactive',
        403
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin access granted:', payload.email);
    }

    return payload;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Database error checking SuperAdmin:', error);
    }
    
    return createErrorResponse(
      'Authentication error',
      500
    );
  }
};

export const checkPermission = (permissionName: string) => {
  return async (req: NextRequest): Promise<NextResponse | JWTPayload> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Checking permission:', permissionName);
    }

    const authResult = await requireSuperAdmin(req);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // For now, SuperAdmin has all permissions
    // In a more complex system, you would check against user's role permissions
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permission granted:', permissionName);
    }

    return authResult;
  };
}; 