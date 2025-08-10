import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/roles/[id] - Get a single role
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching role:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { userRoles: true }
        },
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Role not found:', params.id);
      }
      return createErrorResponse('Role not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role fetched successfully:', role.name);
    }

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isGlobal: role.isGlobal,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.userRoles,
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
          module: rp.permission.module,
          action: rp.permission.action
        }))
      }
    }, 'Role fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching role:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/roles/[id] - Update a role
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Updating role:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, description, isGlobal, isActive, permissions } = await req.json();

  try {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: params.id }
    });

    if (!existingRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Role not found:', params.id);
      }
      return createErrorResponse('Role not found', 404);
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: { 
          name,
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Role name already exists:', name);
        }
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
          isGlobal: isGlobal !== undefined ? isGlobal : existingRole.isGlobal,
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
        permissions: permissions || []
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role updated successfully:', result.name);
    }

    return createSuccessResponse({
      role: {
        id: result.id,
        name: result.name,
        description: result.description,
        isGlobal: result.isGlobal,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, 'Role updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating role:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/roles/[id] - Delete a role
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Deleting role:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
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
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Role not found:', params.id);
      }
      return createErrorResponse('Role not found', 404);
    }

    // Check if role is assigned to any users
    if (existingRole._count.userRoles > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Role is assigned to users, cannot delete:', params.id);
      }
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
        roleName: existingRole.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role deleted successfully:', existingRole.name);
    }

    return createSuccessResponse({}, 'Role deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting role:', error);
    }
    throw error;
  }
}); 