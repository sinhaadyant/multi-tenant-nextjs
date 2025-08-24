import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/jwt';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional(),
  sendInvitation: z.boolean().optional().default(false)
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional(),
  isActive: z.boolean().optional()
});

const bulkActionSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'assignRoles']),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional()
});

// GET /api/tenant/[tenantSlug]/users - Get users list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const status = url.searchParams.get('status') || '';
    const roleId = url.searchParams.get('roleId') || '';

    // Build where clause - only show users from this tenant
    const where: any = {
      tenantId: tenantId
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { contactNumber: { contains: search } }
      ];
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Add role filter
    if (roleId && roleId !== 'all') {
      where.userRoles = {
        some: {
          roleId: roleId
        }
      };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'role') {
      orderBy.userRoles = {
        role: {
          name: sortOrder
        }
      };
    } else if (sortBy === 'lastLogin') {
      orderBy.lastLogin = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with pagination and stats
    const [users, totalUsers, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  color: true
                }
              }
            }
          },
          auditLogs: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { action: true, createdAt: true }
          }
        }
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['isActive'],
        where: { tenantId },
        _count: { _all: true }
      })
    ]);

    // Calculate statistics
    const userStats = {
      total: totalUsers,
      active: stats.find(s => s.isActive)?._count._all || 0,
      inactive: stats.find(s => !s.isActive)?._count._all || 0
    };

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(ur => ur.role),
      lastActivity: user.auditLogs[0]?.action || null,
      lastActivityAt: user.auditLogs[0]?.createdAt || null
    }));

    // Check user permissions for user management
    const canView = await checkTenantPermission(req.user!, tenantId, 'users.view');
    const canViewAll = await checkTenantPermission(req.user!, tenantId, 'users.viewAll');
    const canCreate = await checkTenantPermission(req.user!, tenantId, 'users.create');
    const canUpdate = await checkTenantPermission(req.user!, tenantId, 'users.update');
    const canDelete = await checkTenantPermission(req.user!, tenantId, 'users.delete');

    return createSuccessResponse({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      },
      stats: userStats,
      permissions: {
        canView,
        canViewAll,
        canCreate,
        canUpdate,
        canDelete
      }
    }, 'Users retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch users',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/users - Create new user
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check create permission
    const hasCreatePermission = await checkTenantPermission(req.user!, tenantId, 'users.create');
    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create users', 403);
    }

    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        tenantId: tenantId
      }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists in this tenant', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        contactNumber: validatedData.contactNumber,
        tenantId: tenantId,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // Assign roles if provided
    if (validatedData.roleIds && validatedData.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: validatedData.roleIds.map(roleId => ({
          userId: newUser.id,
          roleId: roleId
        }))
      });
    }

    // Create audit log - simplified for now
    // await createAuditLogFromRequest(req, req.user!, 'user.created', {
    //   details: `Created user: ${newUser.name} (${newUser.email})`,
    //   resource: 'user',
    //   resourceId: newUser.id
    // });

    return createSuccessResponse({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        contactNumber: newUser.contactNumber,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    }, 'User created successfully');

  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to create user',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/users - Bulk actions
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const body = await req.json();
    const validatedData = bulkActionSchema.parse(body);

    // Check permissions based on action
    let hasPermission = false;
    switch (validatedData.action) {
      case 'activate':
      case 'deactivate':
        hasPermission = await checkTenantPermission(req.user!, tenantId, 'users.update');
        break;
      case 'delete':
        hasPermission = await checkTenantPermission(req.user!, tenantId, 'users.delete');
        break;
      case 'assignRoles':
        hasPermission = await checkTenantPermission(req.user!, tenantId, 'users.update');
        break;
      default:
        hasPermission = false;
    }

    if (!hasPermission) {
      return createErrorResponse(`Insufficient permissions to perform '${validatedData.action}' action on users`, 403);
    }

    // Verify all users belong to the tenant
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds },
        tenantId: tenantId
      }
    });

    if (users.length !== validatedData.userIds.length) {
      return createErrorResponse('Some users not found or do not belong to this tenant', 400);
    }

    let result;
    switch (validatedData.action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: validatedData.userIds }, tenantId },
          data: { isActive: true }
        });
        break;
      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: validatedData.userIds }, tenantId },
          data: { isActive: false }
        });
        break;
      case 'delete':
        // Delete user roles first
        await prisma.userRole.deleteMany({
          where: { userId: { in: validatedData.userIds } }
        });
        result = await prisma.user.deleteMany({
          where: { id: { in: validatedData.userIds }, tenantId }
        });
        break;
      case 'assignRoles':
        if (!validatedData.roleIds || validatedData.roleIds.length === 0) {
          return createErrorResponse('Role IDs are required for assignRoles action', 400);
        }
        
        // Delete existing roles and assign new ones
        await prisma.userRole.deleteMany({
          where: { userId: { in: validatedData.userIds } }
        });
        
        const roleAssignments = validatedData.userIds.flatMap(userId =>
          validatedData.roleIds!.map(roleId => ({ userId, roleId }))
        );
        
        await prisma.userRole.createMany({
          data: roleAssignments
        });
        
        result = { count: validatedData.userIds.length };
        break;
    }

    // Create audit log - simplified for now
    // await createAuditLogFromRequest(req, req.user!, `users.${validatedData.action}`, {
    //   details: `${validatedData.action} action performed on ${validatedData.userIds.length} users`,
    //   resource: 'user',
    //   resourceId: validatedData.userIds.join(',')
    // });

    return createSuccessResponse({
      action: validatedData.action,
      affectedUsers: result.count,
      userIds: validatedData.userIds
    }, `Bulk action '${validatedData.action}' completed successfully`);

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to perform bulk action',
      error.status || 500
    );
  }
}); 