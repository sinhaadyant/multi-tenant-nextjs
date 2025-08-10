import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { hashPassword } from '@/lib/jwt';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/tenants - List all tenants with pagination and filters
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Fetching tenants list');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for tenants API');
    }
    return authResult;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SuperAdmin authenticated for tenants API');
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const plan = searchParams.get('plan') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { domain: { contains: search } }
    ];
  }

  if (status) {
    where.isActive = status === 'active';
  }

  if (plan) {
    where.plan = plan;
  }

  // Build order by clause
  const orderBy: any = {};
  
  // Map frontend field names to database field names
  const fieldMapping: Record<string, string> = {
    status: 'isActive',
    name: 'name',
    slug: 'slug',
    domain: 'domain',
    plan: 'plan',
    region: 'region',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };
  
  // Handle special cases for computed fields
  if (sortBy === 'userCount') {
    // For userCount, we need to sort by the count of related users
    // Use a different approach with aggregation
    const dbField = 'createdAt'; // Default fallback for initial query
    orderBy[dbField] = 'desc';
  } else {
    const dbField = fieldMapping[sortBy] || sortBy;
    orderBy[dbField] = sortOrder;
  }

  try {
    let tenants;
    let totalCount;
    let stats;

    // Handle userCount sorting differently
    if (sortBy === 'userCount') {
      // Get all tenants with user counts for sorting
      const allTenants = await prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true } }
        }
      });

      // Sort by userCount in memory
      allTenants.sort((a, b) => {
        const aCount = a._count.users;
        const bCount = b._count.users;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      });

      // Apply pagination
      const startIndex = skip;
      const endIndex = skip + limit;
      tenants = allTenants.slice(startIndex, endIndex);
      totalCount = allTenants.length;
    } else {
      // Regular sorting for database fields
      [tenants, totalCount, stats] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            _count: { select: { users: true } }
          }
        }),
        prisma.tenant.count({ where }),
        prisma.tenant.groupBy({
          by: ['isActive'],
          _count: { id: true }
        })
      ]);
    }

    // Get stats if not already computed
    if (!stats) {
      stats = await prisma.tenant.groupBy({
        by: ['isActive'],
        _count: { id: true }
      });
    }

    const activeCount = stats.find(s => s.isActive)?._count.id || 0;
    const inactiveCount = stats.find(s => !s.isActive)?._count.id || 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenants fetched successfully:', tenants.length);
    }

    return createSuccessResponse({
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        description: tenant.description,
        isActive: tenant.isActive,
        status: tenant.isActive ? 'active' : 'suspended', // Transform isActive to status
        plan: tenant.plan,
        region: tenant.region,
        features: tenant.features ? JSON.parse(tenant.features) : [],
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        userCount: tenant._count.users
      })),
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount
      }
    }, 'Tenants fetched successfully', 200);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching tenants:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/tenants - Create new tenant
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Creating new tenant');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { tenant, admin } = await req.json();

  if (!tenant || !admin) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for tenant creation');
    }
    return createErrorResponse(
      'Tenant and admin data are required',
      400
    );
  }

  try {
    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenant.slug }
    });

    if (existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant slug already exists:', tenant.slug);
      }
      return createErrorResponse(
        'Tenant slug already exists',
        409
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: admin.email }
    });

    if (existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Admin email already exists:', admin.email);
      }
      return createErrorResponse(
        'Admin email already exists',
        409
      );
    }

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          description: tenant.description,
          plan: tenant.plan || 'starter',
          region: tenant.region || 'us-east-1',
          features: tenant.features ? JSON.stringify(tenant.features) : '[]',
          isActive: true
        }
      });

      // Hash password
      const hashedPassword = await hashPassword(admin.password);

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          tenantId: newTenant.id,
          role: 'admin',
          isActive: true
        }
      });

      return { tenant: newTenant, admin: adminUser };
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.created',
      {
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        adminEmail: result.admin.email
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant created successfully:', result.tenant.name);
    }

    return createSuccessResponse({
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        domain: result.tenant.domain,
        description: result.tenant.description,
        isActive: result.tenant.isActive,
        status: result.tenant.isActive ? 'active' : 'suspended',
        plan: result.tenant.plan,
        region: result.tenant.region,
        features: result.tenant.features ? JSON.parse(result.tenant.features) : [],
        createdAt: result.tenant.createdAt,
        updatedAt: result.tenant.updatedAt,
        userCount: 1
      }
    }, 'Tenant created successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating tenant:', error);
    }
    throw error;
  }
});
