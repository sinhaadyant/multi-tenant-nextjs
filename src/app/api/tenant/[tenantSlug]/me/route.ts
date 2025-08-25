import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/tenant/[tenantSlug]/me - Get current user profile
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Fetching user profile for tenant:', (await params).tenantSlug);
  }

  // Authenticate user
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const includeModules = searchParams.get('includeModules') === 'true';
  const { tenantSlug } = await params;

  try {
    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: authResult.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isActive: true
          }
        },
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
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Verify user belongs to the correct tenant
    if (user.tenant?.slug !== tenantSlug) {
      return createErrorResponse('Access denied to this tenant', 403);
    }

    // Transform user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isFirstLogin: (user as any).isFirstLogin ?? true,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenant,
      roles: user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        permissions: userRole.role.permissions.map(rp => ({
          id: rp.id,
          moduleKey: rp.moduleKey,
          moduleName: rp.module.moduleName,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canViewAll: rp.canViewAll
        }))
      })),
      permissions: user.userRoles.flatMap(userRole => 
        userRole.role.permissions.map(rp => ({
          id: rp.id,
          moduleKey: rp.moduleKey,
          moduleName: rp.module.moduleName,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canViewAll: rp.canViewAll
        }))
      )
    };

    // If modules are requested, fetch them as well
    let modulesData = null;
    if (includeModules && user.tenantId) {
      const tenantModules = await prisma.tenantModule.findMany({
        where: {
          tenantId: user.tenantId,
          isEnabled: true,
          isVisible: true
        },
        include: {
          module: true
        },
        orderBy: {
          module: {
            orderIndex: 'asc'
          }
        }
      });

      modulesData = {
        modules: tenantModules.map(tm => ({
          id: tm.module.id,
          moduleKey: tm.module.moduleKey,
          moduleName: tm.module.moduleName,
          description: tm.module.description,
          icon: tm.module.icon,
          orderIndex: tm.module.orderIndex,
          isActive: tm.module.isActive,
          isEnabled: tm.isEnabled,
          isVisible: tm.isVisible,
          isVisibleInTenant: tm.isVisible, // Use isVisible as isVisibleInTenant
          version: tm.version,
          settings: tm.settings
        }))
      };
    }

    const responseData = {
      ...userData,
      ...(modulesData && { modules: modulesData.modules })
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User profile fetched successfully:', {
        userId: user.id,
        permissionsCount: userData.permissions.length,
        modulesCount: modulesData?.modules?.length || 0
      });
    }

    return createSuccessResponse(responseData, 'User profile retrieved successfully');

  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    return createErrorResponse('Failed to fetch user profile', 500);
  }
}); 