import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/users/[userId]/roles - Get user's assigned roles
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { userId: string } }) => {
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
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        userRoles: {
          include: {
            role: {
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
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin && user.tenantId !== tenantId) {
      return createErrorResponse('Access denied', 403);
    }

    // Transform the data and apply tenant overrides
    const userRoles = user.userRoles.map(userRole => {
      const role = userRole.role;
      
      // Get base permissions
      const basePermissions = role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action,
        isGranted: true
      }));

      // Apply tenant overrides if this is a global role and we have a tenant context
      let finalPermissions = basePermissions;
      if (role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0) {
        const overrideMap = new Map();
        role.tenantOverrides.forEach(override => {
          overrideMap.set(override.permissionId, override.isGranted);
        });

        finalPermissions = basePermissions.map(permission => ({
          ...permission,
          isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true
        }));
      }

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        scope: role.scope,
        isActive: role.isActive,
        assignedAt: userRole.assignedAt.toISOString(),
        assignedBy: userRole.assignedBy,
        permissions: finalPermissions,
        hasOverrides: role.tenantOverrides.length > 0
      };
    });

    return createSuccessResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      roles: userRoles
    }, 'User roles retrieved successfully');
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
});

// POST /api/users/[userId]/roles - Assign role to user
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const { roleId } = await req.json();

  // Validation
  if (!roleId) {
    return createErrorResponse('Role ID is required', 400, [
      { field: 'roleId', message: 'Role ID is required' }
    ]);
  }

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
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin) {
      // Tenant users can only assign roles to users in their tenant
      if (user.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }

      // Tenant users can only assign global roles or their own tenant roles
      if (role.scope === 'TENANT' && role.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }
    } else {
      // SuperAdmin can only assign global roles
      if (role.scope === 'TENANT') {
        return createErrorResponse('SuperAdmin can only assign global roles', 403);
      }
    }

    // Check if role is already assigned
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: params.userId,
          roleId: roleId
        }
      }
    });

    if (existingAssignment) {
      return createErrorResponse('Role is already assigned to this user', 409);
    }

    // Assign role to user
    const result = await prisma.userRole.create({
      data: {
        userId: params.userId,
        roleId: roleId,
        assignedBy: authResult.id
      },
      include: {
        role: true,
        user: true
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.role.assign',
      {
        userId: params.userId,
        userName: result.user.name,
        roleId: roleId,
        roleName: result.role.name,
        scope: result.role.scope
      }
    );

    return createSuccessResponse({
      assignment: {
        userId: result.userId,
        roleId: result.roleId,
        assignedAt: result.assignedAt.toISOString(),
        assignedBy: result.assignedBy
      }
    }, 'Role assigned to user successfully', 201);
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
});

// DELETE /api/users/[userId]/roles - Remove role from user
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { userId: string } }) => {
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get('roleId');

  if (!roleId) {
    return createErrorResponse('Role ID is required', 400, [
      { field: 'roleId', message: 'Role ID is required' }
    ]);
  }

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
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check if role assignment exists
    const assignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: params.userId,
          roleId: roleId
        }
      },
      include: {
        role: true,
        user: true
      }
    });

    if (!assignment) {
      return createErrorResponse('Role assignment not found', 404);
    }

    // Check access permissions
    if (!isSuperAdmin) {
      // Tenant users can only remove roles from users in their tenant
      if (user.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }

      // Tenant users can only remove global roles or their own tenant roles
      if (assignment.role.scope === 'TENANT' && assignment.role.tenantId !== tenantId) {
        return createErrorResponse('Access denied', 403);
      }
    } else {
      // SuperAdmin can only remove global roles
      if (assignment.role.scope === 'TENANT') {
        return createErrorResponse('SuperAdmin can only remove global roles', 403);
      }
    }

    // Remove role assignment
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: params.userId,
          roleId: roleId
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.role.remove',
      {
        userId: params.userId,
        userName: assignment.user.name,
        roleId: roleId,
        roleName: assignment.role.name,
        scope: assignment.role.scope
      }
    );

    return createSuccessResponse({}, 'Role removed from user successfully');
  } catch (error) {
    console.error('Error removing role from user:', error);
    throw error;
  }
});
