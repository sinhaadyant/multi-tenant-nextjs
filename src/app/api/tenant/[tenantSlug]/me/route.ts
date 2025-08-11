import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { tenantSlug: string } }) {
  try {
    const { tenantSlug } = params;
    
    console.log('🔍 Tenant /me endpoint called for tenant:', tenantSlug);

    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authorization header is required', 401);
    }

    const token = authHeader.substring(7);

    // Verify the token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return createErrorResponse('Invalid or expired token', 401);
    }
    
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid token payload', 401);
    }

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: tenantSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found or inactive', 404);
    }

    // Find the user in this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        module: true
                      }
                    }
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
            plan: true,
            isActive: true,
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found in this tenant', 404);
    }

    // Create audit log
    await createAuditLog({
      action: 'tenant.user_profile_accessed',
      details: { 
        userId: user.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      tenantId: tenant.id,
      userId: user.id,
    });

    // Format the response
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      tenant: user.tenant,
      roles: user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        isDefault: userRole.role.isDefault,
        permissions: userRole.role.permissions.map(rolePermission => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          description: rolePermission.permission.description,
          module: rolePermission.permission.module.moduleKey,
          action: rolePermission.permission.action
        }))
      })),
      permissions: user.userRoles.flatMap(userRole => 
        userRole.role.permissions.map(rolePermission => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          description: rolePermission.permission.description,
          module: rolePermission.permission.module.moduleKey,
          action: rolePermission.permission.action
        }))
      )
    };



    return createSuccessResponse(userProfile);

  } catch (error) {
    console.error('Tenant /me endpoint error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 