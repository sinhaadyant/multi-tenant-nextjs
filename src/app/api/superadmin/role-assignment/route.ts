import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/role-assignment - Get role assignments for a tenant
export const GET = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return createErrorResponse('Tenant ID is required', 400);
  }

  try {
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Get all users with their role assignments for the tenant
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data
    const roleAssignments = users.map(user => ({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      isActive: user.isActive,
      roles: user.userRoles.map(ur => ({
        roleId: ur.role.id,
        roleName: ur.role.name,
        roleDescription: ur.role.description,
        isRoleActive: ur.role.isActive,
        assignedAt: ur.assignedAt,
        assignedBy: ur.assignedBy
      }))
    }));

    return createSuccessResponse({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      },
      roleAssignments
    }, 'Role assignments fetched successfully');
  } catch (error) {
    console.error('Error fetching role assignments:', error);
    throw error;
  }
});

// POST /api/superadmin/role-assignment - Assign roles to users
export const POST = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { tenantId, assignments } = await req.json();

  // Validation
  if (!tenantId) {
    return createErrorResponse('Tenant ID is required', 400);
  }

  if (!assignments || !Array.isArray(assignments)) {
    return createErrorResponse('Assignments array is required', 400);
  }

  try {
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Validate assignments
    for (const assignment of assignments) {
      if (!assignment.userId || !assignment.roleId) {
        return createErrorResponse('Each assignment must have userId and roleId', 400);
      }

      // Check if user exists and belongs to the tenant
      const user = await prisma.user.findFirst({
        where: {
          id: assignment.userId,
          tenantId: tenantId
        }
      });

      if (!user) {
        return createErrorResponse(`User ${assignment.userId} not found in tenant`, 404);
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: assignment.roleId }
      });

      if (!role) {
        return createErrorResponse(`Role ${assignment.roleId} not found`, 404);
      }
    }

    // Update role assignments in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updatedAssignments = [];

      for (const assignment of assignments) {
        // Remove existing role assignment for this user
        await tx.userRole.deleteMany({
          where: {
            userId: assignment.userId
          }
        });

        // Create new role assignment
        const userRole = await tx.userRole.create({
          data: {
            userId: assignment.userId,
            roleId: assignment.roleId,
            assignedBy: authResult.id
          },
          include: {
            user: true,
            role: true
          }
        });

        updatedAssignments.push(userRole);
      }

      return updatedAssignments;
    });

    await createAuditLogFromRequest(req, authResult, 'role.assignment.bulk', {
      tenantId,
      tenantName: tenant.name,
      assignmentsCount: assignments.length,
      assignments: assignments.map(a => ({ userId: a.userId, roleId: a.roleId }))
    });

    return createSuccessResponse({
      message: 'Role assignments updated successfully',
      assignments: results.map(result => ({
        userId: result.userId,
        roleId: result.roleId,
        userName: result.user.name,
        roleName: result.role.name,
        assignedAt: result.assignedAt
      }))
    }, 'Role assignments updated successfully');
  } catch (error) {
    console.error('Error updating role assignments:', error);
    throw error;
  }
});
