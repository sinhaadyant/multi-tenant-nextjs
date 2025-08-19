import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/permissions/[id] - Get a single permission
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Fetching permission:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const permission = await prisma.permission.findUnique({
      where: { id: id }
    });

    if (!permission) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission not found:', id);
      }
      return createErrorResponse('Permission not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permission fetched successfully:', permission.name);
    }

    return createSuccessResponse({
      permission: {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      }
    }, 'Permission fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching permission:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/permissions/[id] - Update a permission
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Updating permission:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, description, module, action } = await req.json();

  try {
    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: id }
    });

    if (!existingPermission) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission not found:', id);
      }
      return createErrorResponse('Permission not found', 404);
    }

    // Check if new name conflicts with existing permission
    if (name && name !== existingPermission.name) {
      const nameConflict = await prisma.permission.findFirst({
        where: { 
          name,
          id: { not: id }
        }
      });

      if (nameConflict) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Permission name already exists:', name);
        }
        return createErrorResponse(
          'Permission name already exists',
          409,
          [{ field: 'name', message: 'Permission name already exists' }]
        );
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: id },
      data: {
        name: name || existingPermission.name,
        description: description !== undefined ? description : existingPermission.description,
        module: module || existingPermission.module,
        action: action || existingPermission.action
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'permission.update',
      {
        permissionId: updatedPermission.id,
        permissionName: updatedPermission.name,
        module: updatedPermission.module,
        action: updatedPermission.action
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permission updated successfully:', updatedPermission.name);
    }

    return createSuccessResponse({
      permission: {
        id: updatedPermission.id,
        name: updatedPermission.name,
        description: updatedPermission.description,
        module: updatedPermission.module,
        action: updatedPermission.action,
        createdAt: updatedPermission.createdAt,
        updatedAt: updatedPermission.updatedAt
      }
    }, 'Permission updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating permission:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/permissions/[id] - Delete a permission
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Deleting permission:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: id },
      include: {
        rolePermissions: true
      }
    });

    if (!existingPermission) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission not found:', id);
      }
      return createErrorResponse('Permission not found', 404);
    }

    // Check if permission is assigned to any roles
    if (existingPermission.rolePermissions.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission is assigned to roles, cannot delete:', id);
      }
      return createErrorResponse(
        'Cannot delete permission that is assigned to roles. Please remove all role assignments first.',
        409
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: id }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'permission.delete',
      {
        permissionId: existingPermission.id,
        permissionName: existingPermission.name,
        module: existingPermission.module,
        action: existingPermission.action
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permission deleted successfully:', existingPermission.name);
    }

    return createSuccessResponse({}, 'Permission deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting permission:', error);
    }
    throw error;
  }
}); 