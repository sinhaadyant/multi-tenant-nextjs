import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/tenant/[tenantSlug]/profile - Get current user profile with permissions and modules
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Fetching user profile for tenant:', (await params).tenantSlug);
  }

  // Authenticate user
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

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

    // Fetch modules for the tenant
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

    const modulesData = {
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

    const responseData = {
      user: userData,
      permissions: userData.permissions,
      modules: modulesData.modules
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User profile fetched successfully:', {
        userId: user.id,
        permissionsCount: userData.permissions.length,
        modulesCount: modulesData.modules.length
      });
    }

    return createSuccessResponse(responseData, 'User profile retrieved successfully');

  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    return createErrorResponse('Failed to fetch user profile', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/profile - Update user profile
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Updating user profile for tenant:', (await params).tenantSlug);
  }

  // Authenticate user
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { tenantSlug } = await params;
  const { name, email, contactNumber } = await req.json();

  try {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: authResult.id }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Verify user belongs to the correct tenant
    if (user.tenantId !== (await prisma.tenant.findUnique({ where: { slug: tenantSlug } }))?.id) {
      return createErrorResponse('Access denied to this tenant', 403);
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: authResult.id },
      data: updateData
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User profile updated successfully');
    }

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber,
        updatedAt: updatedUser.updatedAt
      }
    }, 'Profile updated successfully');

  } catch (error: any) {
    console.error('❌ Error updating user profile:', error);
    return createErrorResponse('Failed to update user profile', 500);
  }
});