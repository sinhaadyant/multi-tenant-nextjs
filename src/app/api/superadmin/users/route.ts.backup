import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { hashPassword } from '@/lib/jwt';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/users - List all users across all tenants
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching users list');
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
  const tenantId = searchParams.get('tenantId') || '';
  const roleId = searchParams.get('roleId') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (roleId) {
    where.roleId = roleId;
  }

  if (status) {
    where.isActive = status === 'active';
  }

  // Build order by clause
  const orderBy: any = {};
  
  // Map frontend field names to database field names
  const fieldMapping: Record<string, string> = {
    status: 'isActive',
    name: 'name',
    email: 'email',
    tenant: 'tenantId',
    role: 'id', // Can't sort by role directly, use id as fallback
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastLogin: 'lastLogin'
  };
  
  // Handle special sorting cases
  if (sortBy === 'role') {
    // For role sorting, we need to sort by the first role name
    // This is a complex case that might need a different approach
    console.warn('Role sorting is not fully supported - using user ID as fallback');
    orderBy.id = sortOrder;
  } else {
    const dbField = fieldMapping[sortBy] || sortBy;
    orderBy[dbField] = sortOrder;
  }

  try {
    // Get users with pagination and statistics in parallel
    const [users, totalCount, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tenant: { select: { name: true, slug: true } },
          userRoles: {
            include: {
              role: { select: { name: true, description: true } }
            }
          }
        }
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['isActive'],
        _count: { id: true }
      })
    ]);

    const activeCount = stats.find(s => s.isActive)?._count.id || 0;
    const inactiveCount = stats.find(s => !s.isActive)?._count.id || 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Users fetched successfully:', users.length);
    }

    return createSuccessResponse({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenant: user.tenant ? {
          id: user.tenantId,
          name: user.tenant.name,
          slug: user.tenant.slug
        } : null,
        roles: user.userRoles.map(userRole => ({
          id: userRole.role.id,
          name: userRole.role.name,
          description: userRole.role.description
        }))
      })),
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      }
    }, 'Users fetched successfully', 200, {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalRecords: totalCount
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching users:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/users - Create new user
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Creating new user');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { email, name, password, tenantId, roleId } = await req.json();

  if (!email || !name || !password || !tenantId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for user creation');
    }
    const errors = [];
    if (!email) errors.push({ field: 'email', message: 'Email is required' });
    if (!name) errors.push({ field: 'name', message: 'Name is required' });
    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    if (!tenantId) errors.push({ field: 'tenantId', message: 'Tenant ID is required' });
    
    return createErrorResponse(
      'Email, name, password, and tenantId are required',
      400,
      errors
    );
  }

  try {
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', tenantId);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Check if user email already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId
      }
    });

    if (existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User email already exists in tenant:', email);
      }
      return createErrorResponse(
        'User email already exists in this tenant',
        409,
        [{ field: 'email', message: 'User email already exists in this tenant' }]
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        tenantId,
        roleId: roleId || null
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        role: {
          select: { name: true, description: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.create',
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User created successfully:', user.email);
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        tenant: user.tenant ? {
          id: user.tenantId,
          name: user.tenant.name,
          slug: user.tenant.slug
        } : null,
        role: user.role ? {
          id: user.roleId,
          name: user.role.name,
          description: user.role.description
        } : null
      }
    }, 'User created successfully', 201);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating user:', error);
    }
    throw error;
  }
}); 