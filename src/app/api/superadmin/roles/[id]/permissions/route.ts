import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/roles/[id]/permissions - Get role permissions
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id: roleId } = params;

  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
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

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Transform the data
    const transformedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isGlobal: role.isGlobal,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action,
        moduleName: rp.permission.module.name
      }))
    };

    return createSuccessResponse({ role: transformedRole }, 'Role permissions retrieved successfully');
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
});

// POST /api/superadmin/roles/[id]/permissions - Update role permissions
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id: roleId } = params;
  const requestBody = await req.json();
  const { permissions } = requestBody;

  // Debug logging
  console.log('🔍 Role Permissions API - POST Request:', {
    roleId,
    permissions,
    requestBody
  });

  // Validation
  if (!permissions || !Array.isArray(permissions)) {
    return createErrorResponse('Permissions array is required', 400);
  }

  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Update permissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove all existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      // Add new permissions
      if (permissions.length > 0) {
        // First, get all available permissions to map module actions to permission IDs
        const allPermissions = await tx.permission.findMany({
          where: { isActive: true }
        });

        const rolePermissions = permissions.flatMap((modulePerm: any) => {
          if (!modulePerm.moduleId || !modulePerm.actions || !Array.isArray(modulePerm.actions)) {
            return [];
          }

          // Map module actions to actual permission IDs
          return modulePerm.actions.map((action: string) => {
            // Find the permission that matches the module and action
            const permission = allPermissions.find(p => 
              p.moduleKey === modulePerm.moduleId && p.action === action
            );
            
            if (!permission) {
              console.warn(`Permission not found for module: ${modulePerm.moduleId}, action: ${action}`);
              return null;
            }

            return {
              roleId,
              permissionId: permission.id
            };
          }).filter(Boolean); // Remove null entries
        });

        if (rolePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }
    });

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
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

    if (!updatedRole) {
      throw new Error('Failed to fetch updated role');
    }

    // Transform the data
    const transformedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isGlobal: updatedRole.isGlobal,
      isActive: updatedRole.isActive,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString(),
      permissions: updatedRole.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action,
        moduleName: rp.permission.module.name
      }))
    };

    await createAuditLogFromRequest(req, authResult, 'role.permissions.update', {
      roleId,
      roleName: role.name,
      permissionsCount: permissions.length
    });

    return createSuccessResponse({ role: transformedRole }, 'Role permissions updated successfully');
  } catch (error) {
    console.error('Error updating role permissions:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid permission IDs')) {
        return createErrorResponse(error.message, 400);
      }
      if (error.message.includes('Foreign key constraint')) {
        return createErrorResponse('Invalid permission reference. Please check the permission IDs.', 400);
      }
      if (error.message.includes('Permission not found')) {
        return createErrorResponse('One or more permissions not found for the specified module and action.', 400);
      }
    }
    
    // Log the request data for debugging
    console.error('Request data:', { roleId, permissions });
    
    throw error;
  }
});
