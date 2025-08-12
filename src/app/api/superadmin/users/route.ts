import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createUserSchema, updateUserSchema } from '@/lib/validations/superadmin';
import bcrypt from 'bcryptjs';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/users - Get all users with filters and pagination
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching users with filters');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const tenantId = searchParams.get('tenantId') || '';
  const roleId = searchParams.get('roleId') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { tenant: { name: { contains: search, mode: 'insensitive' } } },
      { userRoles: { role: { name: { contains: search, mode: 'insensitive' } } } }
    ];
  }

  // Status filter
  if (status) {
    where.isActive = status === 'active';
  }

  // Tenant filter
  if (tenantId) {
    where.tenantId = tenantId;
  }

  // Role filter
  if (roleId) {
    where.userRoles = {
      some: {
        roleId: roleId
      }
    };
  }

  // Build order by clause
  const orderBy: any = {};
  if (sortBy === 'tenant') {
    orderBy.tenant = { name: sortOrder };
  } else if (sortBy === 'role') {
    // Note: Role sorting is not directly supported due to many-to-many relationship
    // We'll sort by createdAt as fallback
    orderBy.createdAt = sortOrder;
  } else if (sortBy === 'lastLogin') {
    orderBy.lastLogin = sortOrder;
  } else {
    orderBy[sortBy] = sortOrder;
  }

  try {
    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
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
      }),
      prisma.user.count({ where })
    ]);

    // Get statistics
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } })
    ]);

    // Transform users to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenant,
      role: user.userRoles[0]?.role || null
    }));

    const totalPages = Math.ceil(totalCount / limit);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Found', totalCount, 'users');
    }

    return createSuccessResponse({
      users: transformedUsers,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords: totalCount
      }
    }, 'Users retrieved successfully');

  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    return createErrorResponse('Failed to fetch users', 500);
  }
});

// POST /api/superadmin/users - Create a new user
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Creating new user');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await req.json();

  try {
    // Validate input
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        tenantId: validatedData.tenantId,
        isActive: true
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
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

    // If roleId is provided, create user role assignment
    if (validatedData.roleId) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: validatedData.roleId
        }
      });
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.create',
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: user.tenantId
      }
    );

    // Transform user to match expected format
    const transformedUser = {
      ...user,
      role: user.userRoles[0]?.role || null
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User created successfully:', user.email);
    }

    return createSuccessResponse({ user: transformedUser }, 'User created successfully');

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    console.error('❌ Error creating user:', error);
    return createErrorResponse('Failed to create user', 500);
  }
});
