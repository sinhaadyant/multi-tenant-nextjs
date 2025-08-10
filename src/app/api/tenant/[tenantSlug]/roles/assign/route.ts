import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';

// POST /api/tenant/[tenantSlug]/roles/assign - Assign modules & permissions to a role
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
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
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to assign roles
    const hasPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module.moduleKey === 'roles' && 
        (rp.permission.action === 'edit' || rp.permission.action === 'manage')
      )
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to assign roles', 403);
    }

    const body = await req.json();
    const { roleId, modulePermissions } = body;

    // Validate required fields
    if (!roleId || !modulePermissions) {
      return createErrorResponse('Role ID and module permissions are required', 400);
    }

    // Verify role exists and belongs to tenant
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenantId: user.tenant!.id },
          { isTemplate: true }
        ],
        isActive: true
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: {
          roleId: roleId
        }
      });

      // Add new permissions
      const rolePermissions = [];
      
      for (const [moduleKey, actions] of Object.entries(modulePermissions)) {
        if (Array.isArray(actions) && actions.length > 0) {
          // Get permissions for this module and actions
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: moduleKey,
              action: {
                in: actions
              },
              isActive: true
            }
          });

          // Create role permissions
          for (const permission of permissions) {
            rolePermissions.push({
              roleId: roleId,
              permissionId: permission.id
            });
          }
        }
      }

      // Bulk create role permissions
      if (rolePermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      // Get updated role with permissions
      const updatedRole = await tx.role.findUnique({
        where: { id: roleId },
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
      });

      return updatedRole;
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'role_permissions_updated',
      details: `Updated permissions for role: ${role.name}`,
      userId: user.id,
      tenantId: user.tenant!.id
    });

    return createSuccessResponse({
      role: result,
      message: 'Role permissions updated successfully'
    }, 'Role permissions assigned successfully');

  } catch (error: any) {
    console.error('Error assigning role permissions:', error);
    return createErrorResponse('Failed to assign role permissions', 500);
  }
});

// GET /api/tenant/[tenantSlug]/roles/assign/:roleId - Get current permissions for a role
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get('roleId');
  
  if (!roleId) {
    return createErrorResponse('Role ID is required', 400);
  }
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
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
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to view roles
    const hasPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module.moduleKey === 'roles' && 
        (rp.permission.action === 'view' || rp.permission.action === 'read')
      )
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to view roles', 403);
    }

    // Get role with permissions
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenantId: user.tenant!.id },
          { isTemplate: true }
        ],
        isActive: true
      },
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
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Group permissions by module
    const modulePermissions: { [key: string]: string[] } = {};
    
    role.permissions.forEach(rp => {
      const moduleKey = rp.permission.module.moduleKey;
      const action = rp.permission.action;
      
      if (!modulePermissions[moduleKey]) {
        modulePermissions[moduleKey] = [];
      }
      
      if (!modulePermissions[moduleKey].includes(action)) {
        modulePermissions[moduleKey].push(action);
      }
    });

    // Get all available modules and permissions
    const allModules = await prisma.module.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          where: { isActive: true },
          orderBy: { action: 'asc' }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { moduleName: 'asc' }
      ]
    });

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isDefault: role.isDefault,
        isTemplate: role.isTemplate,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      },
      currentPermissions: modulePermissions,
      availableModules: allModules.map(module => ({
        moduleKey: module.moduleKey,
        moduleName: module.moduleName,
        description: module.description,
        permissions: module.permissions.map(p => ({
          id: p.id,
          name: p.name,
          action: p.action,
          description: p.description
        }))
      })),
      totalAssignedPermissions: Object.values(modulePermissions).flat().length,
      totalAvailableModules: allModules.length
    }, 'Role permissions retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    return createErrorResponse('Failed to fetch role permissions', 500);
  }
}); 