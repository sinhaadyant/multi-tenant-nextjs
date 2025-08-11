import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/jwt';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  sendInvitation: z.boolean().optional().default(false)
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

const bulkActionSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'assignRoles']),
  roleIds: z.array(z.string()).optional()
});

// GET /api/tenant/[tenantSlug]/users - Get users list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    // User is already authenticated and verified by middleware
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
    const role = url.searchParams.get('role') || '';

    // Build where clause
    const where: any = {
      tenantId: tenantId
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Add role filter
    if (role) {
      where.userRoles = {
        some: {
          role: {
            name: {
              contains: role,
              mode: 'insensitive'
            }
          }
        }
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with pagination and stats
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Calculate stats
    const activeUsers = await prisma.user.count({
      where: { ...where, isActive: true }
    });

    const inactiveUsers = await prisma.user.count({
      where: { ...where, isActive: false }
    });

    const newThisMonth = await prisma.user.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const data = {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        contactNumber: user.contactNumber,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles.map(ur => ur.role),
        rolesCount: user.userRoles.length
      })),
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        newThisMonth
      },
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    };

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.list', {
      page,
      totalUsers,
      filters: { search, status, role }
    });

    return createSuccessResponse(data, 'Users retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return createErrorResponse('Failed to fetch users', 500);
  }
});

// POST /api/tenant/[tenantSlug]/users - Create a new user
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();

    // Validate request body
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.error.errors);
    }

    const { name, email, password, contactNumber, roleIds, sendInvitation } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId
      }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        contactNumber,
        tenantId,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Assign roles if provided
    if (roleIds && roleIds.length > 0) {
      const roleAssignments = roleIds.map((roleId: string) => ({
        userId: user.id,
        roleId
      }));

      await prisma.userRole.createMany({
        data: roleAssignments
      });
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.create', {
      userId: user.id,
      email: user.email
    });

    return createSuccessResponse(user, 'User created successfully');
  } catch (error: any) {
    console.error('Error creating user:', error);
    return createErrorResponse('Failed to create user', 500);
  }
});

// PATCH /api/tenant/[tenantSlug]/users - Bulk actions
export const PATCH = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();

    // Validate request body
    const validationResult = bulkActionSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.error.errors);
    }

    const { userIds, action, roleIds } = validationResult.data;

    // Verify all users belong to this tenant
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        tenantId
      }
    });

    if (users.length !== userIds.length) {
      return createErrorResponse('Some users not found or do not belong to this tenant', 400);
    }

    let result;
    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, tenantId },
          data: { isActive: true }
        });
        break;

      case 'deactivate':
        // Prevent deactivating all admin users
        const adminUsers = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            tenantId,
            userRoles: {
              some: {
                role: {
                  name: { contains: 'Admin', mode: 'insensitive' }
                }
              }
            }
          }
        });

        if (adminUsers.length > 0) {
          return createErrorResponse('Cannot deactivate admin users', 400);
        }

        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, tenantId },
          data: { isActive: false }
        });
        break;

      case 'delete':
        // Prevent deleting admin users
        const adminUsersToDelete = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            tenantId,
            userRoles: {
              some: {
                role: {
                  name: { contains: 'Admin', mode: 'insensitive' }
                }
              }
            }
          }
        });

        if (adminUsersToDelete.length > 0) {
          return createErrorResponse('Cannot delete admin users', 400);
        }

        result = await prisma.user.deleteMany({
          where: { id: { in: userIds }, tenantId }
        });
        break;

      case 'assignRoles':
        if (!roleIds || roleIds.length === 0) {
          return createErrorResponse('Role IDs are required for role assignment', 400);
        }

        // Remove existing role assignments
        await prisma.userRole.deleteMany({
          where: { userId: { in: userIds } }
        });

        // Assign new roles
        const roleAssignments = userIds.flatMap(userId =>
          roleIds.map(roleId => ({ userId, roleId }))
        );

        await prisma.userRole.createMany({
          data: roleAssignments
        });

        result = { count: userIds.length };
        break;

      default:
        return createErrorResponse('Invalid action', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, `users.bulk_${action}`, {
      userIds,
      action,
      roleIds,
      affectedCount: result.count
    });

    return createSuccessResponse(result, `Bulk ${action} completed successfully`);
  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    return createErrorResponse('Failed to perform bulk action', 500);
  }
}); 