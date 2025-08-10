import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/users - Get users list with filters and pagination
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true
      }
    });

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

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
      tenantId: user.tenant.id
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

    // Fetch users with pagination
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

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(ur => ur.role)
    }));

    // Calculate stats
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [total, active, inactive, newThisMonth] = await Promise.all([
      prisma.user.count({ where: { tenantId: user.tenant.id } }),
      prisma.user.count({
        where: {
          tenantId: user.tenant.id,
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          tenantId: user.tenant.id,
          isActive: false
        }
      }),
      prisma.user.count({
        where: {
          tenantId: user.tenant.id,
          createdAt: { gte: lastMonth }
        }
      })
    ]);

    const stats = {
      total,
      active,
      inactive,
      newThisMonth
    };

    const pagination = {
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      hasNext: page < Math.ceil(totalUsers / limit),
      hasPrev: page > 1
    };

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'users.list', {
      tenantId: user.tenant.id,
      filters: { search, status, role },
      pagination: { page, limit }
    });

    return createSuccessResponse({
      users: transformedUsers,
      stats,
      pagination
    }, 'Users retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return createErrorResponse('Failed to fetch users', 500);
  }
});

// POST /api/tenant/[tenantSlug]/users - Create new user
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant and has admin permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user has permission to create users
    const canCreateUsers = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'users' && 
        (rp.permission.action === 'create' || rp.permission.action === 'manage')
      )
    );

    if (!canCreateUsers) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    const body = await req.json();
    const { name, email, password, roleIds, isActive = true } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return createErrorResponse('Missing required fields: name, email, password', 400);
    }

    // Check if email already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: user.tenant.id
      }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 409);
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: await Bun.password.hash(password),
        isActive,
        tenantId: user.tenant.id
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
      const userRoles = roleIds.map((roleId: string) => ({
        userId: newUser.id,
        roleId
      }));

      await prisma.userRole.createMany({
        data: userRoles
      });

      // Fetch updated user with roles
      const updatedUser = await prisma.user.findUnique({
        where: { id: newUser.id },
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

      await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'users.create', {
        tenantId: user.tenant.id,
        userId: newUser.id,
        userEmail: newUser.email
      });

      return createSuccessResponse({
        user: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          isActive: updatedUser!.isActive,
          createdAt: updatedUser!.createdAt,
          roles: updatedUser!.userRoles.map(ur => ur.role)
        }
      }, 'User created successfully');
    }

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'users.create', {
      tenantId: user.tenant.id,
      userId: newUser.id,
      userEmail: newUser.email
    });

    return createSuccessResponse({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        roles: []
      }
    }, 'User created successfully');

  } catch (error: any) {
    console.error('Error creating user:', error);
    return createErrorResponse('Failed to create user', 500);
  }
}); 