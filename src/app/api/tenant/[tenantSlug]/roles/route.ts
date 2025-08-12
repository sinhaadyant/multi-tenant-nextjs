import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createTenantRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.object({
    module_id: z.string(),
    actions: z.array(z.string())
  })).optional(),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isDefault: z.boolean().default(false)
});

// GET /api/tenant/[tenantSlug]/roles - List roles for tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const roleType = searchParams.get('roleType') || 'all'; // global, tenant, all
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build where clause for roles
    const where: any = {
      OR: [
        // Global roles (visible to all tenants)
        {
          roleScope: 'global',
          tenantIdNew: null,
          isActive: true
        },
        // Tenant-specific roles for this tenant
        {
          roleScope: 'tenant',
          tenantIdNew: tenant.id,
          isActive: true
        }
      ]
    };

    // Filter by role type
    if (roleType === 'global') {
      where.OR = [where.OR[0]];
    } else if (roleType === 'tenant') {
      where.OR = [where.OR[1]];
    }

    // Add search filter
    if (search) {
      where.AND = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Add status filter
    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch roles with user count
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          userRoles: {
            where: {
              user: {
                tenantId: tenant.id
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.role.count({ where })
    ]);

    // Transform data for response
    const transformedRoles = roles.map(role => {
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        roleScope: role.roleScope,
        isActive: role.isActive,
        isDefault: role.isDefault,
        isTemplate: role.isTemplate,
        isSystem: role.isSystem,
        color: role.color,
        priority: role.priority,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role.userRoles.length,
        assignedUsers: role.userRoles.map(ur => ({
          id: ur.user.id,
          name: ur.user.name,
          email: ur.user.email
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        roles: transformedRoles,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tenant roles:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tenant roles' },
      { status: 500 }
    );
  }
}

// POST /api/tenant/[tenantSlug]/roles - Create tenant-specific role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const body = await request.json();
    const validatedData = createTenantRoleSchema.parse(body);

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if role name already exists in this tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        name: validatedData.name,
        roleScope: 'tenant',
        tenantIdNew: tenant.id
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, message: 'Role name already exists in this tenant' },
        { status: 400 }
      );
    }

    // Create role and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          roleScope: 'tenant',
          tenantIdNew: tenant.id,
          color: validatedData.color,
          priority: validatedData.priority,
          isDefault: validatedData.isDefault,
          isTemplate: false,
          isSystem: false,
          createdBy: 'tenant-admin' // You might want to get this from auth context
        }
      });

      // Assign permissions if provided
      if (validatedData.permissions && validatedData.permissions.length > 0) {
        for (const perm of validatedData.permissions) {
          // Find or create permissions for this module and actions
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: perm.module_id,
              action: { in: perm.actions },
              isActive: true
            }
          });

          // Create role permissions
          const rolePermissions = permissions.map(permission => ({
            roleId: role.id,
            permissionId: permission.id,
            tenantId: tenant.id, // Tenant-specific permissions
            isAllowed: true
          }));

          if (rolePermissions.length > 0) {
            await tx.rolePermission.createMany({
              data: rolePermissions
            });
          }
        }
      }

      return role;
    });

    // Fetch the created role
    const createdRole = await prisma.role.findUnique({
      where: { id: result.id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant role created successfully',
      data: {
        role: {
          id: createdRole!.id,
          name: createdRole!.name,
          description: createdRole!.description,
          roleScope: createdRole!.roleScope,
          isActive: createdRole!.isActive,
          isDefault: createdRole!.isDefault,
          color: createdRole!.color,
          priority: createdRole!.priority,
          createdAt: createdRole!.createdAt,
          updatedAt: createdRole!.updatedAt,
          userCount: createdRole!.userRoles.length
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating tenant role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create tenant role' },
      { status: 500 }
    );
  }
}
