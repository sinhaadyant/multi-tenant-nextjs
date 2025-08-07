import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/roles - Get all roles (for tenant management)
export const GET = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the expected format
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isGlobal: role.isGlobal,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role._count.users,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    }));

    await createAuditLogFromRequest(req, authResult, 'role.list', {
      rolesCount: transformedRoles.length
    });

    return createSuccessResponse({ roles: transformedRoles }, 'Roles retrieved successfully');
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
});

// POST /api/superadmin/roles - Create new role (for tenant management)
export const POST = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    return createErrorResponse('Unauthorized', 401);
  }

  const { name, description, isGlobal = false, permissions = [] } = await req.json();

  // Validation
  if (!name || name.trim().length === 0) {
    return createErrorResponse('Role name is required', 400, [
      { field: 'name', message: 'Role name is required' }
    ]);
  }

  if (name.trim().length < 3) {
    return createErrorResponse('Role name must be at least 3 characters', 400, [
      { field: 'name', message: 'Role name must be at least 3 characters' }
    ]);
  }

  if (name.trim().length > 50) {
    return createErrorResponse('Role name must be less than 50 characters', 400, [
      { field: 'name', message: 'Role name must be less than 50 characters' }
    ]);
  }

  try {
    // Check for duplicate role name
    const existingRole = await prisma.role.findFirst({
      where: { name: name.trim() }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists', 409, [
        { field: 'name', message: 'Role name already exists' }
      ]);
    }

    // Create role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isGlobal,
          isActive: true
        }
      });

      // Assign permissions if provided
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((permissionId: string) => ({
          roleId: role.id,
          permissionId
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      return role;
    });

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: result.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!createdRole) {
      throw new Error('Failed to fetch created role');
    }

    // Transform the data
    const transformedRole = {
      id: createdRole.id,
      name: createdRole.name,
      description: createdRole.description,
      isGlobal: createdRole.isGlobal,
      isActive: createdRole.isActive,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      userCount: createdRole._count.users,
      permissions: createdRole.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    };

    await createAuditLogFromRequest(req, authResult, 'role.create', {
      roleId: result.id,
      roleName: result.name,
      permissionsCount: permissions.length,
      isGlobal: result.isGlobal
    });

    return createSuccessResponse({ role: transformedRole }, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}); 