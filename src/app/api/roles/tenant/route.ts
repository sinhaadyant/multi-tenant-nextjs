import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// POST /api/roles/tenant - Create new tenant role (Tenant Admin only)
export const POST = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, description, permissions = [] } = await req.json();

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
    // Check for duplicate role name within the same tenant
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: name.trim(),
        tenantId: authResult.tenantId
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists in this tenant', 409, [
        { field: 'name', message: 'Role name already exists in this tenant' }
      ]);
    }

    // Create tenant role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          scope: 'TENANT',
          tenantId: authResult.tenantId,
          isActive: true,
          createdBy: authResult.id
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
          select: { userRoles: true }
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
      scope: createdRole.scope,
      isActive: createdRole.isActive,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      userCount: createdRole._count.userRoles,
      permissions: createdRole.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action
      }))
    };

    await createAuditLogFromRequest(req, authResult, 'tenant_role.create', {
      roleId: result.id,
      roleName: result.name,
      tenantId: authResult.tenantId,
      permissionsCount: permissions.length
    });

    return createSuccessResponse({ role: transformedRole }, 'Tenant role created successfully', 201);
  } catch (error) {
    console.error('Error creating tenant role:', error);
    throw error;
  }
});
