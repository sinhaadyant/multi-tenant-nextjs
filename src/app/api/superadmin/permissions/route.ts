import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/permissions - List all permissions
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Fetching permissions list');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permissions fetched successfully:', permissions.length);
    }

    return createSuccessResponse({
      permissions: permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      }))
    }, 'Permissions fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching permissions:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/permissions - Create new permission
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Creating new permission');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, description, module, action } = await req.json();

  if (!name || !module || !action) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for permission creation');
    }
    return createErrorResponse(
      'Permission name, module, and action are required',
      400,
      [
        { field: 'name', message: 'Permission name is required' },
        { field: 'module', message: 'Module is required' },
        { field: 'action', message: 'Action is required' }
      ]
    );
  }

  try {
    // Check if permission name already exists
    const existingPermission = await prisma.permission.findFirst({
      where: { name }
    });

    if (existingPermission) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission name already exists:', name);
      }
      return createErrorResponse(
        'Permission name already exists',
        409,
        [{ field: 'name', message: 'Permission name already exists' }]
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        module,
        action
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'permission.create',
      {
        permissionId: permission.id,
        permissionName: permission.name,
        module: permission.module,
        action: permission.action
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permission created successfully:', permission.name);
    }

    return createSuccessResponse({
      permission: {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        createdAt: permission.createdAt
      }
    }, 'Permission created successfully', 201);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating permission:', error);
    }
    throw error;
  }
}); 