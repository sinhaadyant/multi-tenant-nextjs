import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required')
});

const bulkAssignSchema = z.object({
  assignments: z.array(assignRoleSchema),
  removeExisting: z.boolean().default(false)
});

const removeRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required')
});

const bulkRemoveSchema = z.object({
  assignments: z.array(removeRoleSchema)
});

// GET /api/tenant/[tenantSlug]/roles/assign - Get role assignments
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'roles.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view role assignments', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const roleId = url.searchParams.get('roleId') || '';
    const userIdFilter = url.searchParams.get('userId') || '';
    const sortBy = url.searchParams.get('sortBy') || 'assignedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      role: {
        tenantId: tenantId,
        isGlobal: false
      },
      user: {
        tenantId: tenantId
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        {
          user: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        },
        {
          role: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Add role filter
    if (roleId) {
      where.roleId = roleId;
    }

    // Add user filter
    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch role assignments with pagination
    const [assignments, totalAssignments] = await Promise.all([
      prisma.userRole.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              lastLogin: true
            }
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true,
              color: true
            }
          }
        }
      }),
      prisma.userRole.count({ where })
    ]);

    // Get available roles and users for filters
    const [roles, users] = await Promise.all([
      prisma.role.findMany({
        where: {
          tenantId: tenantId,
          isGlobal: false,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          _count: {
            select: {
              userRoles: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.user.findMany({
        where: {
          tenantId: tenantId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              userRoles: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    // Calculate statistics
    const assignmentStats = {
      total: totalAssignments,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        assignmentCount: role._count.userRoles
      })),
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        roleCount: user._count.userRoles
      }))
    };

    // Format response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy,
      user: assignment.user,
      role: assignment.role
    }));

    return createSuccessResponse({
      assignments: formattedAssignments,
      roles: roles,
      users: users,
      pagination: {
        page,
        limit,
        total: totalAssignments,
        totalPages: Math.ceil(totalAssignments / limit),
        hasNext: page * limit < totalAssignments,
        hasPrev: page > 1
      },
      stats: assignmentStats,
      permissions: {
        canView: hasViewPermission,
        canAssign: await checkTenantPermission(req.user!, tenantId!, 'roles.assign'),
        canRemove: await checkTenantPermission(req.user!, tenantId!, 'roles.remove')
      }
    }, 'Role assignments retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching role assignments:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch role assignments',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/roles/assign - Assign role to user
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasAssignPermission = await checkTenantPermission(req.user!, tenantId!, 'roles.assign');
    if (!hasAssignPermission) {
      return createErrorResponse('Insufficient permissions to assign roles', 403);
    }

    const body = await req.json();
    const validatedData = assignRoleSchema.parse(body);

    // Verify user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId: tenantId
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Verify role exists and belongs to tenant
    const role = await prisma.role.findFirst({
      where: {
        id: validatedData.roleId,
        tenantId: tenantId,
        isGlobal: false
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // For single role assignment: Remove any existing role assignments for this user
    await prisma.userRole.deleteMany({
      where: {
        userId: validatedData.userId
      }
    });

    // Create new role assignment
    const assignment = await prisma.userRole.create({
      data: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        assignedBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'role.assigned',
      details: `Assigned single role "${role.name}" to user "${user.name}" (replaced previous role)`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        roleId: assignment.roleId,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
        user: assignment.user,
        role: assignment.role
      }
    }, 'Role assigned successfully');

  } catch (error: any) {
    console.error('Error assigning role:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid assignment data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to assign role',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/roles/assign - Bulk assign roles
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasAssignPermission = await checkTenantPermission(req.user!, tenantId!, 'roles.assign');
    if (!hasAssignPermission) {
      return createErrorResponse('Insufficient permissions to assign roles', 403);
    }

    const body = await req.json();
    const validatedData = bulkAssignSchema.parse(body);

    // Verify all users and roles exist and belong to tenant
    const [users, roles] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: validatedData.assignments.map(a => a.userId) },
          tenantId: tenantId
        }
      }),
      prisma.role.findMany({
        where: {
          id: { in: validatedData.assignments.map(a => a.roleId) },
          tenantId: tenantId,
          isGlobal: false
        }
      })
    ]);

    if (users.length !== validatedData.assignments.length) {
      return createErrorResponse('Some users not found', 404);
    }

    if (roles.length !== validatedData.assignments.length) {
      return createErrorResponse('Some roles not found', 404);
    }

    // For single role assignment: Always remove existing assignments for all users
    await prisma.userRole.deleteMany({
      where: {
        userId: { in: validatedData.assignments.map(a => a.userId) }
      }
    });

    // Create new assignments (single role per user)
    const assignments = await Promise.all(
      validatedData.assignments.map(async (assignment) => {
        return prisma.userRole.create({
          data: {
            userId: assignment.userId,
            roleId: assignment.roleId,
            assignedBy: userId
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        });
      })
    );

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'roles.bulk_assigned',
      details: `Bulk assigned single roles to ${assignments.length} users (replaced previous roles)`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      assignments: assignments.map(a => ({
        id: a.id,
        userId: a.userId,
        roleId: a.roleId,
        assignedAt: a.assignedAt,
        assignedBy: a.assignedBy,
        user: a.user,
        role: a.role
      })),
      count: assignments.length
    }, `Successfully assigned ${assignments.length} roles`);

  } catch (error: any) {
    console.error('Error bulk assigning roles:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid bulk assignment data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to bulk assign roles',
      error.status || 500
    );
  }
});

// DELETE /api/tenant/[tenantSlug]/roles/assign - Remove role assignment
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasRemovePermission = await checkTenantPermission(req.user!, tenantId!, 'roles.remove');
    if (!hasRemovePermission) {
      return createErrorResponse('Insufficient permissions to remove role assignments', 403);
    }

    const body = await req.json();
    const validatedData = bulkRemoveSchema.parse(body);

    // Verify all assignments exist and belong to tenant
    const assignments = await prisma.userRole.findMany({
      where: {
        id: { in: validatedData.assignments.map(a => `${a.userId}-${a.roleId}`) },
        role: {
          tenantId: tenantId
        },
        user: {
          tenantId: tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (assignments.length !== validatedData.assignments.length) {
      return createErrorResponse('Some assignments not found', 404);
    }

    // Remove assignments
    await prisma.userRole.deleteMany({
      where: {
        id: { in: assignments.map(a => a.id) }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'roles.bulk_removed',
      details: `Removed ${assignments.length} role assignments`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      removed: assignments.length,
      assignments: assignments.map(a => ({
        userId: a.userId,
        roleId: a.roleId,
        user: a.user,
        role: a.role
      }))
    }, `Successfully removed ${assignments.length} role assignments`);

  } catch (error: any) {
    console.error('Error removing role assignments:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid removal data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to remove role assignments',
      error.status || 500
    );
  }
});
