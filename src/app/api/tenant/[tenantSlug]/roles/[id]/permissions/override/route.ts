import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for permission overrides
const permissionOverrideSchema = z.object({
  remove: z.array(z.object({
    module_id: z.string()
  })).optional(),
  add: z.array(z.object({
    module_id: z.string(),
    actions: z.array(z.string())
  })).optional(),
  modify: z.array(z.object({
    module_id: z.string(),
    actions: z.array(z.string())
  })).optional()
});

// GET /api/tenant/[tenantSlug]/roles/[id]/permissions/override - Get current overrides
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: roleId } = await params;

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

    // Check if role exists and is global
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    // Get global permissions (tenantId = null)
    const globalPermissions = await prisma.rolePermission.findMany({
      where: {
        roleId,
        tenantId: null
      },
      include: {
        permission: true
      }
    });
    
    // Get tenant-specific overrides
    const tenantOverrides = await prisma.rolePermission.findMany({
      where: {
        roleId,
        tenantId: tenant.id
      },
      include: {
        permission: true
      }
    });

    // Group permissions by module
    const globalPermissionsByModule = globalPermissions.reduce((acc, rp) => {
      const moduleKey = rp.permission.moduleKey;
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey].push({
        action: rp.permission.action,
        isAllowed: rp.isAllowed
      });
      return acc;
    }, {} as Record<string, Array<{ action: string; isAllowed: boolean }>>);

    const tenantOverridesByModule = tenantOverrides.reduce((acc, rp) => {
      const moduleKey = rp.permission.moduleKey;
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey].push({
        action: rp.permission.action,
        isAllowed: rp.isAllowed
      });
      return acc;
    }, {} as Record<string, Array<{ action: string; isAllowed: boolean }>>);

    // Calculate effective permissions
    const effectivePermissions = Object.keys(globalPermissionsByModule).map(moduleKey => {
      const globalPerms = globalPermissionsByModule[moduleKey];
      const tenantPerms = tenantOverridesByModule[moduleKey] || [];
      
      // Merge global and tenant permissions (tenant overrides global)
      const effectivePerms = [...globalPerms];
      tenantPerms.forEach(tenantPerm => {
        const existingIndex = effectivePerms.findIndex(p => p.action === tenantPerm.action);
        if (existingIndex >= 0) {
          effectivePerms[existingIndex] = tenantPerm;
        } else {
          effectivePerms.push(tenantPerm);
        }
      });

      return {
        module_id: moduleKey,
        global_permissions: globalPerms,
        tenant_overrides: tenantPerms,
        effective_permissions: effectivePerms
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          roleScope: role.roleScope
        },
        permissions: effectivePermissions,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        },
        summary: {
          totalModules: effectivePermissions.length,
          overriddenModules: Object.keys(tenantOverridesByModule).length,
          totalGlobalPermissions: globalPermissions.length,
          totalTenantOverrides: tenantOverrides.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching permission overrides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch permission overrides' },
      { status: 500 }
    );
  }
}

// PATCH /api/tenant/[tenantSlug]/roles/[id]/permissions/override - Update permission overrides
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: roleId } = await params;
    const body = await request.json();
    const validatedData = permissionOverrideSchema.parse(body);

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

    // Check if role exists and is global
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    // Update permission overrides in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Handle remove operations
      if (validatedData.remove && validatedData.remove.length > 0) {
        for (const removeOp of validatedData.remove) {
          // Find permissions for this module
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: removeOp.module_id,
              isActive: true
            }
          });

          // Create tenant overrides to deny these permissions
          const denyOverrides = permissions.map(permission => ({
            roleId,
            permissionId: permission.id,
            tenantId: tenant.id,
            isAllowed: false
          }));

          if (denyOverrides.length > 0) {
            // Remove existing overrides for this module
            await tx.rolePermission.deleteMany({
              where: {
                roleId,
                permissionId: { in: permissions.map(p => p.id) },
                tenantId: tenant.id
              }
            });

            // Add deny overrides
            await tx.rolePermission.createMany({
              data: denyOverrides
            });
          }
        }
      }

      // Handle add operations
      if (validatedData.add && validatedData.add.length > 0) {
        for (const addOp of validatedData.add) {
          // Find permissions for this module and actions
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: addOp.module_id,
              action: { in: addOp.actions },
              isActive: true
            }
          });

          // Create tenant overrides to allow these permissions
          const allowOverrides = permissions.map(permission => ({
            roleId,
            permissionId: permission.id,
            tenantId: tenant.id,
            isAllowed: true
          }));

          if (allowOverrides.length > 0) {
            // Remove existing overrides for these permissions
            await tx.rolePermission.deleteMany({
              where: {
                roleId,
                permissionId: { in: permissions.map(p => p.id) },
                tenantId: tenant.id
              }
            });

            // Add allow overrides
            await tx.rolePermission.createMany({
              data: allowOverrides
            });
          }
        }
      }

      // Handle modify operations
      if (validatedData.modify && validatedData.modify.length > 0) {
        for (const modifyOp of validatedData.modify) {
          // Find permissions for this module and actions
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: modifyOp.module_id,
              action: { in: modifyOp.actions },
              isActive: true
            }
          });

          // Create tenant overrides to allow these permissions
          const modifyOverrides = permissions.map(permission => ({
            roleId,
            permissionId: permission.id,
            tenantId: tenant.id,
            isAllowed: true
          }));

          if (modifyOverrides.length > 0) {
            // Remove existing overrides for these permissions
            await tx.rolePermission.deleteMany({
              where: {
                roleId,
                permissionId: { in: permissions.map(p => p.id) },
                tenantId: tenant.id
              }
            });

            // Add modify overrides
            await tx.rolePermission.createMany({
              data: modifyOverrides
            });
          }
        }
      }

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: 'Permission overrides updated successfully',
      data: {
        role: {
          id: role.id,
          name: role.name,
          roleScope: role.roleScope
        },
        operations: {
          removed: validatedData.remove?.length || 0,
          added: validatedData.add?.length || 0,
          modified: validatedData.modify?.length || 0
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

    console.error('Error updating permission overrides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update permission overrides' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenant/[tenantSlug]/roles/[id]/permissions/override - Remove all overrides
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  try {
    const { tenantSlug, id: roleId } = await params;

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

    // Check if role exists and is global
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        roleScope: 'global',
        tenantIdNew: null
      }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Global role not found' },
        { status: 404 }
      );
    }

    // Remove all tenant overrides for this role
    const result = await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        tenantId: tenant.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Permission overrides removed successfully',
      data: {
        removedOverrides: result.count
      }
    });

  } catch (error) {
    console.error('Error removing permission overrides:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove permission overrides' },
      { status: 500 }
    );
  }
}
