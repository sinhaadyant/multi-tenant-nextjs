import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createErrorResponse } from '@/lib/apiResponse';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    tenantSlug?: string;
    userRoles?: any[];
  };
}

export interface AuthOptions {
  requireAuth?: boolean;
  requireTenant?: boolean;
  allowedRoles?: string[];
  allowPublic?: boolean;
}

/**
 * Authentication middleware for API routes
 * Handles token verification and user context injection
 */
export const withAuth = (
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>,
  options: AuthOptions = {}
) => {
  return async (req: NextRequest, context: any) => {
    const {
      requireAuth = true,
      requireTenant = false,
      allowedRoles = [],
      allowPublic = false
    } = options;

    // If public access is allowed, skip authentication
    if (allowPublic) {
      return handler(req as AuthenticatedRequest, context);
    }

    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (requireAuth) {
          return createErrorResponse('Unauthorized - No token provided', 401);
        }
        // If auth is not required, continue without user context
        return handler(req as AuthenticatedRequest, context);
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = verifyToken(token);
      if (!decoded || !decoded.id || !decoded.email) {
        if (requireAuth) {
          return createErrorResponse('Invalid or expired token', 401);
        }
        // If auth is not required, continue without user context
        return handler(req as AuthenticatedRequest, context);
      }

      // Check if tenant is required and provided
      if (requireTenant && !decoded.tenantId) {
        return createErrorResponse('Tenant access required', 403);
      }

      // Check role permissions if specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return createErrorResponse('Insufficient permissions', 403);
      }

      // Inject user context into request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId,
        tenantSlug: decoded.tenantSlug
      };

      return handler(authenticatedReq, context);

    } catch (error: any) {
      console.error('Authentication middleware error:', error);
      
      if (requireAuth) {
        return createErrorResponse('Authentication failed', 401);
      }
      
      // If auth is not required, continue without user context
      return handler(req as AuthenticatedRequest, context);
    }
  };
};

/**
 * Tenant-specific authentication middleware
 * Ensures user belongs to the specified tenant and includes user roles
 */
export const withTenantAuth = (
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: any) => {
    const {
      requireAuth = true,
      requireTenant = true,
      allowPublic = false
    } = { requireAuth: true, requireTenant: true, allowPublic: false };

    // If public access is allowed, skip authentication
    if (allowPublic) {
      return handler(req as AuthenticatedRequest, context);
    }

    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('Unauthorized - No token provided', 401);
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = verifyToken(token);
      if (!decoded || !decoded.id || !decoded.email) {
        return createErrorResponse('Invalid or expired token', 401);
      }

      // Check if tenant is required and provided
      if (requireTenant && !decoded.tenantId) {
        return createErrorResponse('Tenant access required', 403);
      }

      // Fetch user with roles for permission checking
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      // Inject user context into request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: decoded.tenantSlug,
        userRoles: user.userRoles
      };

      return handler(authenticatedReq, context);

    } catch (error: any) {
      console.error('Tenant authentication middleware error:', error);
      return createErrorResponse('Authentication failed', 401);
    }
  };
};

/**
 * SuperAdmin authentication middleware
 * Ensures user has superadmin role
 */
export const withSuperAdminAuth = (
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
) => {
  return withAuth(handler, {
    requireAuth: true,
    requireTenant: false,
    allowedRoles: ['superadmin'],
    allowPublic: false
  });
};

/**
 * Optional authentication middleware
 * Provides user context if available, but doesn't require it
 */
export const withOptionalAuth = (
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
) => {
  return withAuth(handler, {
    requireAuth: false,
    requireTenant: false,
    allowPublic: true
  });
}; 