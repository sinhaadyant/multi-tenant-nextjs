import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// POST /api/roles/[id]/permissions/override - Override global role permissions for tenant
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { overrides } = await req.json();

  // Validation
  if (!overrides || !Array.isArray(overrides)) {
    return createErrorResponse('Overrides array is required', 400, [
      { field: 'overrides', message: 'Overrides array is required' }
    ]);
  }

  // Validate override structure
  for (const override of overrides) {
    if (!override.permissionId || typeof override.isGranted !== 'boolean') {
      return createErrorResponse('Invalid override structure', 400, [
        { field: 'overrides', message: 'Each override must have permissionId and isGranted fields' }
      ]);
    }
  }

  try {
    // Check if role exists and is global
    const role = await prisma.role.findUnique({
      where: { id: params.id },
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

    if (role.scope !== 'GLOBAL') {
      return createErrorResponse('Can only override global roles', 400);
    }

    // Verify all permission IDs exist and belong to the role
    const rolePermissionIds = role.permissions.map(rp => rp.permissionId);
    const overridePermissionIds = overrides.map(o => o.permissionId);
    
    const invalidPermissions = overridePermissionIds.filter(id => !rolePermissionIds.includes(id));
    if (invalidPermissions.length > 0) {
      return createErrorResponse('Invalid permission IDs', 400, [
        { field: 'overrides', message: `Invalid permission IDs: ${invalidPermissions.join(', ')}` }
      ]);
    }

    // Apply overrides in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing overrides for this role and tenant
      await tx.tenantRoleOverride.deleteMany({
        where: {
          roleId: params.id,
          tenantId: authResult.tenantId
        }
      });

      // Create new overrides
      if (overrides.length > 0) {
        const overrideData = overrides.map(override => ({
          roleId: params.id,
          tenantId: authResult.tenantId,
          permissionId: override.permissionId,
          isGranted: override.isGranted,
          createdBy: authResult.id
        }));

        await tx.tenantRoleOverride.createMany({
          data: overrideData
        });
      }

      return { roleId: params.id, overridesCount: overrides.length };
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.permissions.override',
      {
        roleId: params.id,
        roleName: role.name,
        tenantId: authResult.tenantId,
        overridesCount: overrides.length,
        overrides: overrides
      }
    );

    return createSuccessResponse({
      roleId: result.roleId,
      overridesCount: result.overridesCount
    }, 'Role permissions overridden successfully');
  } catch (error) {
    console.error('Error overriding role permissions:', error);
    throw error;
  }
});

// GET /api/roles/[id]/permissions/override - Get current overrides for a role
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if role exists and is global
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        tenantOverrides: {
          where: { tenantId: authResult.tenantId },
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    if (role.scope !== 'GLOBAL') {
      return createErrorResponse('Can only override global roles', 400);
    }

    // Transform the data
    const basePermissions = role.permissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      module: rp.permission.moduleKey,
      action: rp.permission.action,
      isGranted: true
    }));

    // Apply current overrides
    const overrideMap = new Map();
    role.tenantOverrides.forEach(override => {
      overrideMap.set(override.permissionId, override.isGranted);
    });

    const finalPermissions = basePermissions.map(permission => ({
      ...permission,
      isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true,
      isOverridden: overrideMap.has(permission.id)
    }));

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        scope: role.scope
      },
      permissions: finalPermissions,
      overrides: role.tenantOverrides.map(override => ({
        permissionId: override.permissionId,
        isGranted: override.isGranted,
        permission: {
          id: override.permission.id,
          name: override.permission.name,
          description: override.permission.description,
          module: override.permission.moduleKey,
          action: override.permission.action
        }
      }))
    }, 'Role permissions and overrides retrieved successfully');
  } catch (error) {
    console.error('Error fetching role permissions and overrides:', error);
    throw error;
  }
});

// DELETE /api/roles/[id]/permissions/override - Remove all overrides for a role
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if role exists and is global
    const role = await prisma.role.findUnique({
      where: { id: params.id }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    if (role.scope !== 'GLOBAL') {
      return createErrorResponse('Can only override global roles', 400);
    }

    // Remove all overrides for this role and tenant
    const result = await prisma.tenantRoleOverride.deleteMany({
      where: {
        roleId: params.id,
        tenantId: authResult.tenantId
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.permissions.override.remove',
      {
        roleId: params.id,
        roleName: role.name,
        tenantId: authResult.tenantId,
        removedOverridesCount: result.count
      }
    );

    return createSuccessResponse({
      roleId: params.id,
      removedOverridesCount: result.count
    }, 'Role permission overrides removed successfully');
  } catch (error) {
    console.error('Error removing role permission overrides:', error);
    throw error;
  }
});
