import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required')
});

const assignMultipleRolesSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'At least one role ID is required')
});

// GET /api/tenant/[tenantSlug]/users/[id]/roles - Get user's assigned roles and effective permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: userId } = await params;

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user exists and belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get all role permissions for assigned roles
    const roleIds = user.userRoles.map(ur => ur.role.id);
    
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        OR: [
          { tenantId: null }, // Global permissions
          { tenantId: tenant.id } // Tenant-specific overrides
        ]
      },
      include: {
        permission: true,
        role: true
      }
    });

    // Group permissions by role
    const permissionsByRole = rolePermissions.reduce((acc, rp) => {
      const roleId = rp.roleId;
      if (!acc[roleId]) {
        acc[roleId] = {
          role: rp.role,
          permissions: []
        };
      }
      acc[roleId].permissions.push({
        id: rp.permission.id,
        name: rp.permission.name,
        action: rp.permission.action,
        moduleKey: rp.permission.moduleKey,
        isAllowed: rp.isAllowed,
        tenantId: rp.tenantId
      });
      return acc;
    }, {} as Record<string, { role: any; permissions: any[] }>);

    // Calculate effective permissions (merged from all roles)
    const effectivePermissions = new Map<string, boolean>();
    
    rolePermissions.forEach(rp => {
      const key = `${rp.permission.moduleKey}:${rp.permission.action}`;
      // Tenant overrides take precedence over global permissions
      if (rp.tenantId === tenant.id || !effectivePermissions.has(key)) {
        effectivePermissions.set(key, rp.isAllowed);
      }
    });

    // Transform user roles data
    const assignedRoles = user.userRoles.map(ur => {
      const rolePerms = permissionsByRole[ur.role.id] || { permissions: [] };
      
      return {
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        roleScope: ur.role.roleScope,
        isActive: ur.role.isActive,
        isDefault: ur.role.isDefault,
        isTemplate: ur.role.isTemplate,
        isSystem: ur.role.isSystem,
        color: ur.role.color,
        priority: ur.role.priority,
        assignedAt: ur.assignedAt,
        assignedBy: ur.assignedBy,
        permissions: rolePerms.permissions,
        permissionCount: rolePerms.permissions.length
      };
    });

    // Group effective permissions by module
    const effectivePermissionsByModule = Array.from(effectivePermissions.entries()).reduce((acc, [key, isAllowed]) => {
      const [moduleKey, action] = key.split(':');
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey].push({
        action,
        isAllowed
      });
      return acc;
    }, {} as Record<string, Array<{ action: string; isAllowed: boolean }>>);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId
        },
        assignedRoles,
        effectivePermissions: Object.entries(effectivePermissionsByModule).map(([moduleKey, permissions]) => ({
          module_id: moduleKey,
          permissions
        })),
        summary: {
          totalRoles: assignedRoles.length,
          totalEffectivePermissions: effectivePermissions.size,
          modulesWithPermissions: Object.keys(effectivePermissionsByModule).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

// POST /api/tenant/[tenantSlug]/users/[id]/roles - Assign single role to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: userId } = await params;
    const body = await request.json();
    const validatedData = assignRoleSchema.parse(body);

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user exists and belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if role exists and is available for this tenant
    const role = await prisma.role.findFirst({
      where: {
        id: validatedData.roleId,
        OR: [
          // Global roles
          {
            roleScope: 'global',
            tenantIdNew: null,
            isActive: true
          },
          // Tenant-specific roles
          {
            roleScope: 'tenant',
            tenantIdNew: tenant.id,
            isActive: true
          }
        ]
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found or not available for this tenant' },
        { status: 404 }
      );
    }

    // Check if role is already assigned to user
    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId: validatedData.roleId
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, message: 'Role is already assigned to this user' },
        { status: 400 }
      );
    }

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId: validatedData.roleId,
        assignedBy: 'tenant-admin' // You might want to get this from auth context
      },
      include: {
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role assigned to user successfully',
      data: {
        userRole: {
          id: userRole.id,
          role: {
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
            roleScope: userRole.role.roleScope
          },
          assignedAt: userRole.assignedAt,
          assignedBy: userRole.assignedBy
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

    console.error('Error assigning role to user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to assign role to user' },
      { status: 500 }
    );
  }
}

// PUT /api/tenant/[tenantSlug]/users/[id]/roles - Assign multiple roles to user (replace existing)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: userId } = await params;
    const body = await request.json();
    const validatedData = assignMultipleRolesSchema.parse(body);

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user exists and belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Validate that all roles exist and are available for this tenant
    const roles = await prisma.role.findMany({
      where: {
        id: { in: validatedData.roleIds },
        OR: [
          // Global roles
          {
            roleScope: 'global',
            tenantIdNew: null,
            isActive: true
          },
          // Tenant-specific roles
          {
            roleScope: 'tenant',
            tenantIdNew: tenant.id,
            isActive: true
          }
        ]
      }
    });

    if (roles.length !== validatedData.roleIds.length) {
      return NextResponse.json(
        { success: false, message: 'Some roles not found or not available for this tenant' },
        { status: 400 }
      );
    }

    // Assign multiple roles in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing role assignments
      await tx.userRole.deleteMany({
        where: { userId }
      });

      // Create new role assignments
      const roleAssignments = validatedData.roleIds.map(roleId => ({
        userId,
        roleId,
        assignedBy: 'tenant-admin' // You might want to get this from auth context
      }));

      await tx.userRole.createMany({
        data: roleAssignments
      });

      return roleAssignments.length;
    });

    return NextResponse.json({
      success: true,
      message: `${result} roles assigned successfully`,
      data: {
        assignedRolesCount: result,
        roleIds: validatedData.roleIds
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning roles to user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to assign roles to user' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenant/[tenantSlug]/users/[id]/roles - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json(
        { success: false, message: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if user exists and belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if role assignment exists
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId
      },
      include: {
        role: true
      }
    });

    if (!userRole) {
      return NextResponse.json(
        { success: false, message: 'Role is not assigned to this user' },
        { status: 404 }
      );
    }

    // Check if it's a system role that cannot be removed
    if (userRole.role.isSystem) {
      return NextResponse.json(
        { success: false, message: 'Cannot remove system role from user' },
        { status: 400 }
      );
    }

    // Remove role assignment
    await prisma.userRole.delete({
      where: {
        id: userRole.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role removed from user successfully',
      data: {
        removedRole: {
          id: userRole.role.id,
          name: userRole.role.name,
          roleScope: userRole.role.roleScope
        }
      }
    });

  } catch (error) {
    console.error('Error removing role from user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove role from user' },
      { status: 500 }
    );
  }
}
