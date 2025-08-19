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
            module: true
          }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Transform the data to match frontend expectations
    const transformedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isGlobal: role.isGlobal,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      permissions: role.permissions.flatMap(rp => {
        const permissions = [];
        if (rp.canCreate) permissions.push({ id: `${rp.id}-create`, moduleKey: rp.moduleKey, action: 'create' });
        if (rp.canRead) permissions.push({ id: `${rp.id}-read`, moduleKey: rp.moduleKey, action: 'view' });
        if (rp.canUpdate) permissions.push({ id: `${rp.id}-update`, moduleKey: rp.moduleKey, action: 'edit' });
        if (rp.canDelete) permissions.push({ id: `${rp.id}-delete`, moduleKey: rp.moduleKey, action: 'delete' });
        return permissions;
      })
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

  // Log the moduleKeys being sent
  if (permissions && Array.isArray(permissions)) {
    const moduleKeys = permissions.map((p: any) => p.moduleId).filter(Boolean);
    console.log('🔍 ModuleKeys being sent:', moduleKeys);
  }

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
            module: true
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
        // First, validate that all moduleKeys exist
        const moduleKeys = permissions.map((p: any) => p.moduleId).filter(Boolean);
        const existingModules = await tx.module.findMany({
          where: { moduleKey: { in: moduleKeys } },
          select: { moduleKey: true }
        });
        
        const existingModuleKeys = existingModules.map(m => m.moduleKey);
        const invalidModuleKeys = moduleKeys.filter(key => !existingModuleKeys.includes(key));
        
        console.log('🔍 Validation Debug:', {
          requestedModuleKeys: moduleKeys,
          existingModuleKeys,
          invalidModuleKeys
        });
        
        if (invalidModuleKeys.length > 0) {
          throw new Error(`Invalid module keys: ${invalidModuleKeys.join(', ')}`);
        }

        const rolePermissions = permissions.map((modulePerm: any) => {
          if (!modulePerm.moduleId || !modulePerm.actions || !Array.isArray(modulePerm.actions)) {
            return null;
          }

          // Map actions to boolean fields
          const actions = modulePerm.actions;
          return {
            roleId,
            moduleKey: modulePerm.moduleId, // moduleId in request is actually the moduleKey
            canCreate: actions.includes('create'),
            canRead: actions.includes('view'),
            canUpdate: actions.includes('edit'),
            canDelete: actions.includes('delete'),
            canViewAll: actions.includes('view')
          };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

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
            module: true
          }
        }
      }
    });

    if (!updatedRole) {
      throw new Error('Failed to fetch updated role');
    }

    // Transform the data to match frontend expectations
    const transformedRole = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isGlobal: updatedRole.isGlobal,
      isActive: updatedRole.isActive,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString(),
      permissions: updatedRole.permissions.flatMap(rp => {
        const permissions = [];
        if (rp.canCreate) permissions.push({ id: `${rp.id}-create`, moduleKey: rp.moduleKey, action: 'create' });
        if (rp.canRead) permissions.push({ id: `${rp.id}-read`, moduleKey: rp.moduleKey, action: 'view' });
        if (rp.canUpdate) permissions.push({ id: `${rp.id}-update`, moduleKey: rp.moduleKey, action: 'edit' });
        if (rp.canDelete) permissions.push({ id: `${rp.id}-delete`, moduleKey: rp.moduleKey, action: 'delete' });
        return permissions;
      })
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
