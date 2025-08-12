import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating global role
const updateGlobalRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.string()).optional(),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isDefault: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  isActive: z.boolean().optional()
});

// GET /api/superadmin/roles/[id] - Get specific global role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                tenantId: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    const transformedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      roleScope: role.roleScope,
      isActive: role.isActive,
      isDefault: role.isDefault,
      isTemplate: role.isTemplate,
      isSystem: role.isSystem,
      color: role.color,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        action: rp.permission.action,
        moduleKey: rp.permission.moduleKey,
        isAllowed: rp.isAllowed
      })),
      users: role.userRoles.map(ur => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        tenantId: ur.user.tenantId
      })),
      userCount: role.userRoles.length
    };

    return NextResponse.json({
      success: true,
      data: { role: transformedRole }
    });

  } catch (error) {
    console.error('Error fetching global role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch global role' },
      { status: 500 }
    );
  }
}

// PUT /api/superadmin/roles/[id] - Update global role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;
    const body = await request.json();
    const validatedData = updateGlobalRoleSchema.parse(body);

    // Check if role exists and is global
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    // Check if system role is being modified
    if (existingRole.isSystem && (validatedData.isActive === false || validatedData.isTemplate === false)) {
      return NextResponse.json(
        { success: false, message: 'Cannot modify system role properties' },
        { status: 400 }
      );
    }

    // Check for name conflict if name is being updated
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: {
          name: validatedData.name,
          roleScope: 'global',
          tenantIdNew: null,
          id: { not: roleId }
        }
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, message: 'Role name already exists globally' },
          { status: 400 }
        );
      }
    }

    // Update role and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the role
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          color: validatedData.color,
          priority: validatedData.priority,
          isDefault: validatedData.isDefault,
          isTemplate: validatedData.isTemplate,
          isActive: validatedData.isActive
        }
      });

      // Update permissions if provided
      if (validatedData.permissions !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: {
            roleId,
            tenantId: null // Only global permissions
          }
        });

        // Add new permissions
        if (validatedData.permissions.length > 0) {
          const permissionAssignments = validatedData.permissions.map(permissionId => ({
            roleId,
            permissionId,
            tenantId: null, // Global permissions
            isAllowed: true
          }));

          await tx.rolePermission.createMany({
            data: permissionAssignments
          });
        }
      }

      return updatedRole;
    });

    // Fetch the updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Global role updated successfully',
      data: {
        role: {
          id: updatedRole!.id,
          name: updatedRole!.name,
          description: updatedRole!.description,
          roleScope: updatedRole!.roleScope,
          isActive: updatedRole!.isActive,
          isDefault: updatedRole!.isDefault,
          isTemplate: updatedRole!.isTemplate,
          color: updatedRole!.color,
          priority: updatedRole!.priority,
          createdAt: updatedRole!.createdAt,
          updatedAt: updatedRole!.updatedAt,
          permissions: updatedRole!.permissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            action: rp.permission.action,
            moduleKey: rp.permission.moduleKey,
            isAllowed: rp.isAllowed
          }))
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating global role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update global role' },
      { status: 500 }
    );
  }
}

// DELETE /api/superadmin/roles/[id] - Delete global role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Check if role exists and is global
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      },
      include: {
        userRoles: true,
        permissions: {
          where: {
            tenantId: { not: null } // Check for tenant overrides
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete system role' },
        { status: 400 }
      );
    }

    // Check if role is assigned to users
    if (existingRole.userRoles.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete role that is assigned to ${existingRole.userRoles.length} user(s)` 
        },
        { status: 400 }
      );
    }

    // Check if role has tenant overrides
    if (existingRole.permissions.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete global role that has tenant-specific overrides' 
        },
        { status: 400 }
      );
    }

    // Delete the role (permissions will be cascaded)
    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Global role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting global role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete global role' },
      { status: 500 }
    );
  }
} 