import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/permissions - List all modules with their permissions
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Fetching modules and permissions list');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get all modules with their permissions
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' }
    });

    // Get role permissions for all modules
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            tenantId: true
          }
        },
        module: {
          select: {
            moduleKey: true,
            moduleName: true,
            description: true,
            icon: true,
            path: true,
            isActive: true,
            isVisible: true,
            orderIndex: true
          }
        }
      }
    });

    // Group permissions by module
    const permissionsByModule = modules.map(module => {
      const modulePermissions = rolePermissions.filter(rp => rp.moduleKey === module.moduleKey);
      
      return {
        moduleKey: module.moduleKey,
        moduleName: module.moduleName,
        description: module.description,
        icon: module.icon,
        path: module.path,
        isActive: module.isActive,
        isVisible: module.isVisible,
        orderIndex: module.orderIndex,
        permissions: modulePermissions.map(rp => ({
          id: rp.id,
          roleId: rp.roleId,
          roleName: rp.role.name,
          tenantId: rp.role.tenantId,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canViewAll: rp.canViewAll
        }))
      };
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Modules and permissions fetched successfully:', modules.length);
    }

    return createSuccessResponse({
      modules: permissionsByModule
    }, 'Modules and permissions fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching modules and permissions:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/permissions - Update role permissions for a module
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Updating role permissions');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { roleId, moduleKey, permissions } = await req.json();

  if (!roleId || !moduleKey || !permissions) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for permission update');
    }
    return createErrorResponse(
      'Role ID, module key, and permissions are required',
      400
    );
  }

  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { moduleKey }
    });

    if (!module) {
      return createErrorResponse('Module not found', 404);
    }

    // Check if role permission already exists
    const existingPermission = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleKey
      }
    });

    let rolePermission;
    if (existingPermission) {
      // Update existing permission
      rolePermission = await prisma.rolePermission.update({
        where: { id: existingPermission.id },
        data: {
          canCreate: permissions.canCreate || false,
          canRead: permissions.canRead || false,
          canUpdate: permissions.canUpdate || false,
          canDelete: permissions.canDelete || false,
          canViewAll: permissions.canViewAll || false
        }
      });
    } else {
      // Create new permission
      rolePermission = await prisma.rolePermission.create({
        data: {
          roleId,
          moduleKey,
          canCreate: permissions.canCreate || false,
          canRead: permissions.canRead || false,
          canUpdate: permissions.canUpdate || false,
          canDelete: permissions.canDelete || false,
          canViewAll: permissions.canViewAll || false
        }
      });
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.permissions.updated',
      {
        roleId,
        roleName: role.name,
        moduleKey,
        moduleName: module.moduleName,
        permissions: {
          canCreate: permissions.canCreate,
          canRead: permissions.canRead,
          canUpdate: permissions.canUpdate,
          canDelete: permissions.canDelete,
          canViewAll: permissions.canViewAll
        }
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role permissions updated successfully');
    }

    return createSuccessResponse(rolePermission, 'Role permissions updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating role permissions:', error);
    }
    throw error;
  }
}); 