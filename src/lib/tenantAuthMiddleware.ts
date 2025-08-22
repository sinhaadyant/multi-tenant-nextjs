import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedTenantRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
    userRoles?: any[];
  };
}

/**
 * Unified tenant authentication middleware
 * Handles token verification and user context injection for all tenant APIs
 */
export const withTenantAuth = (
  handler: (req: AuthenticatedTenantRequest, context: any) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: any) => {
    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ No Bearer token found in Authorization header');
        }
        return createErrorResponse('Unauthorized - No token provided', 401);
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ JWT token verification failed:', error);
        }
        return createErrorResponse('Invalid or expired token', 401);
      }

      if (!decoded || !decoded.id || !decoded.email) {
        return createErrorResponse('Invalid token payload', 401);
      }

      // Check if tenant is required and provided
      if (!decoded.tenantId) {
        return createErrorResponse('Tenant access required', 403);
      }

      // Get tenant slug from URL params
      const { params } = context;
      const { tenantSlug } = await params;

      // Verify user exists and belongs to the correct tenant
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.id,
          tenantId: decoded.tenantId,
          isActive: true
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      module: true
                    }
                  }
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          }
        }
      });

      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ User not found or inactive:', decoded.id);
        }
        return createErrorResponse('User not found or inactive', 403);
      }

      // Verify tenant is active
      if (!user.tenant?.isActive) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Tenant is inactive:', user.tenant?.slug);
        }
        return createErrorResponse('Tenant is inactive', 403);
      }

      // Verify tenant slug matches
      if (user.tenant.slug !== tenantSlug) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Tenant slug mismatch:', user.tenant.slug, 'vs', tenantSlug);
        }
        return createErrorResponse('Access denied to this tenant', 403);
      }

      // Inject user context into request
      const authenticatedReq = req as AuthenticatedTenantRequest;
      const primaryRole = user.userRoles?.[0]?.role?.name || 'user';
      
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        role: primaryRole,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        userRoles: user.userRoles
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Tenant authentication successful:', {
          userId: user.id,
          email: user.email,
          tenantSlug: user.tenant.slug,
          roles: user.userRoles?.length || 0
        });
      }

      return handler(authenticatedReq, context);

    } catch (error: any) {
      console.error('❌ Tenant authentication middleware error:', error);
      return createErrorResponse('Authentication failed', 401);
    }
  };
};

/**
 * Optional tenant authentication middleware
 * Provides user context if available, but doesn't require it
 */
export const withOptionalTenantAuth = (
  handler: (req: AuthenticatedTenantRequest, context: any) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: any) => {
    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        return handler(req as AuthenticatedTenantRequest, context);
      }

      const token = authHeader.substring(7);
      
      // Try to verify JWT token
      try {
        const decoded = verifyToken(token);
        
        if (decoded && decoded.id && decoded.email && decoded.tenantId) {
          // Get tenant slug from URL params
          const { params } = context;
          const { tenantSlug } = await params;

          // Verify user exists and belongs to the correct tenant
          const user = await prisma.user.findUnique({
            where: { 
              id: decoded.id,
              tenantId: decoded.tenantId,
              isActive: true
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          module: true
                        }
                      }
                    }
                  }
                }
              },
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  isActive: true
                }
              }
            }
          });

          if (user && user.tenant?.isActive && user.tenant.slug === tenantSlug) {
            // Inject user context into request
            const authenticatedReq = req as AuthenticatedTenantRequest;
            const primaryRole = user.userRoles?.[0]?.role?.name || 'user';
            
            authenticatedReq.user = {
              id: user.id,
              email: user.email,
              role: primaryRole,
              tenantId: user.tenantId,
              tenantSlug: user.tenant.slug,
              userRoles: user.userRoles
            };
          }
        }
      } catch (error) {
        // Token verification failed, continue without authentication
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Optional auth failed, continuing without user context:', error);
        }
      }

      return handler(req as AuthenticatedTenantRequest, context);

    } catch (error: any) {
      console.error('❌ Optional tenant authentication middleware error:', error);
      return handler(req as AuthenticatedTenantRequest, context);
    }
  };
};
