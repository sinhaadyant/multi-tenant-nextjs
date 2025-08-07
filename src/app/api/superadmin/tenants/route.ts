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
  orderBy[sortBy] = sortOrder;

  try {
    // Get tenants with pagination
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { users: true }
          }
        }
      }),
      prisma.tenant.count({ where })
    ]);

    // Get statistics
    const stats = await prisma.tenant.groupBy({
      by: ['isActive'],
      _count: {
        id: true
      }
    });

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

  const { name, slug, domain, description, plan, region, features, isActive, metadata } = tenant;
  const { name: adminName, email: adminEmail, password: adminPassword, contactNumber } = admin;

  if (!name || !slug || !adminEmail || !adminName || !adminPassword) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for tenant creation');
    }
    const errors = [];
    if (!name) errors.push({ field: 'tenant.name', message: 'Tenant name is required' });
    if (!slug) errors.push({ field: 'tenant.slug', message: 'Tenant slug is required' });
    if (!adminEmail) errors.push({ field: 'admin.email', message: 'Admin email is required' });
    if (!adminName) errors.push({ field: 'admin.name', message: 'Admin name is required' });
    if (!adminPassword) errors.push({ field: 'admin.password', message: 'Admin password is required' });
    
    return createErrorResponse(
      'All required fields must be provided',
      400,
      errors
    );
  }

  try {
    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant slug already exists:', slug);
      }
      return createErrorResponse(
        'Tenant slug already exists',
        409,
        [{ field: 'slug', message: 'Tenant slug already exists' }]
      );
    }

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          domain: domain || `${slug}.example.com`,
          description: description || `${name} - ${plan} tenant`,
          plan: plan || 'starter',
          region: region || 'US East',
          features: Array.isArray(features) ? JSON.stringify(features) : JSON.stringify(features || ['analytics', 'api', 'sso']),
          isActive: isActive !== undefined ? isActive : true,
          metadata: metadata || {}
        }
      });

      // Hash the provided admin password
      const hashedPassword = await hashPassword(adminPassword);

      // Get the Tenant Admin role
      const tenantAdminRole = await tx.role.findFirst({
        where: { name: 'Tenant Admin' }
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          password: hashedPassword,
          contactNumber: contactNumber || '',
          tenantId: tenant.id,
          roleId: tenantAdminRole?.id,
          isActive: true
        }
      });

      return { tenant, adminUser };
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.create',
      {
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        adminEmail: adminEmail
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
        plan: result.tenant.plan,
        region: result.tenant.region,
        createdAt: result.tenant.createdAt
      },
      admin: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email
      }
    }, 'Tenant created successfully', 201);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating tenant:', error);
    }
    throw error;
  }
}); 