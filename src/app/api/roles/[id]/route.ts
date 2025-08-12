import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/roles/[id] - Get a single role
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Try SuperAdmin first, then Tenant Auth
  let authResult = await requireSuperAdmin(req);
  let isSuperAdmin = true;
  let tenantId: string | null = null;

  if (authResult instanceof NextResponse) {
    // Not SuperAdmin, try Tenant Auth
    authResult = await requireTenantAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    isSuperAdmin = false;
    tenantId = authResult.tenantId;
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        tenantOverrides: {
          where: tenantId ? { tenantId } : undefined,
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin) {
      // Tenant users can only access global roles or their own tenant roles
      if (role.scope === 'TENANT' && role.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }
    }

    // Apply tenant overrides if this is a global role and we have a tenant context
    let finalPermissions = role.permissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      module: rp.permission.moduleKey,
      action: rp.permission.action,
      isGranted: true
    }));

    if (role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0) {
      const overrideMap = new Map();
      role.tenantOverrides.forEach(override => {
        overrideMap.set(override.permissionId, override.isGranted);
      });

      finalPermissions = finalPermissions.map(permission => ({
        ...permission,
        isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true
      }));
    }

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        scope: role.scope,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.userRoles,
        permissions: finalPermissions,
        hasOverrides: role.tenantOverrides.length > 0
      }
    }, 'Role fetched successfully');
  } catch (error) {
    console.error('Error fetching role:', error);
    throw error;
  }
});

// PUT /api/roles/[id] - Update a role
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { name, description, isActive, permissions } = await req.json();

  // Try SuperAdmin first, then Tenant Auth
  let authResult = await requireSuperAdmin(req);
  let isSuperAdmin = true;
  let tenantId: string | null = null;

  if (authResult instanceof NextResponse) {
    // Not SuperAdmin, try Tenant Auth
    authResult = await requireTenantAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    isSuperAdmin = false;
    tenantId = authResult.tenantId;
  }

  try {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: params.id }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin) {
      // Tenant users can only update their own tenant roles
      if (existingRole.scope === 'GLOBAL' || existingRole.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }
    } else {
      // SuperAdmin can only update global roles
      if (existingRole.scope === 'TENANT') {
        return createErrorResponse('SuperAdmin can only update global roles', 403);
      }
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: { 
          name,
          id: { not: params.id },
          scope: existingRole.scope,
          tenantId: existingRole.tenantId
        }
      });

      if (nameConflict) {
        return createErrorResponse(
          'Role name already exists',
          409,
          [{ field: 'name', message: 'Role name already exists' }]
        );
      }
    }

    // Update role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update role
      const updatedRole = await tx.role.update({
        where: { id: params.id },
        data: {
          name: name || existingRole.name,
          description: description !== undefined ? description : existingRole.description,
          isActive: isActive !== undefined ? isActive : existingRole.isActive
        }
      });

      // Update permissions if provided
      if (permissions !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: params.id }
        });

        // Add new permissions
        if (permissions && permissions.length > 0) {
          const rolePermissions = permissions.map((permissionId: string) => ({
            roleId: params.id,
            permissionId
          }));

          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }

      return updatedRole;
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.update',
      {
        roleId: result.id,
        roleName: result.name,
        scope: result.scope,
        permissions: permissions || []
      }
    );

    return createSuccessResponse({
      role: {
        id: result.id,
        name: result.name,
        description: result.description,
        scope: result.scope,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, 'Role updated successfully');
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
});

// DELETE /api/roles/[id] - Delete a role
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Try SuperAdmin first, then Tenant Auth
  let authResult = await requireSuperAdmin(req);
  let isSuperAdmin = true;
  let tenantId: string | null = null;

  if (authResult instanceof NextResponse) {
    // Not SuperAdmin, try Tenant Auth
    authResult = await requireTenantAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    isSuperAdmin = false;
    tenantId = authResult.tenantId;
  }

  try {
    // Check if role exists and get user count
    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { userRoles: true }
        }
      }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin) {
      // Tenant users can only delete their own tenant roles
      if (existingRole.scope === 'GLOBAL' || existingRole.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }
    } else {
      // SuperAdmin can only delete global roles
      if (existingRole.scope === 'TENANT') {
        return createErrorResponse('SuperAdmin can only delete global roles', 403);
      }
    }

    // Check if role is assigned to any users
    if (existingRole._count.userRoles > 0) {
      return createErrorResponse(
        `Cannot delete role that is assigned to ${existingRole._count.userRoles} user(s). Please reassign or remove users from this role first.`,
        409
      );
    }

    // Delete role (permissions will be cascaded due to foreign key constraints)
    await prisma.role.delete({
      where: { id: params.id }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.delete',
      {
        roleId: existingRole.id,
        roleName: existingRole.name,
        scope: existingRole.scope
      }
    );

    return createSuccessResponse({}, 'Role deleted successfully');
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
});
