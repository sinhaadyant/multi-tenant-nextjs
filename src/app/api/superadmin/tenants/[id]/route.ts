import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/tenants/[id] - Get specific tenant
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Fetching tenant details:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            lastLogin: true,
            createdAt: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!tenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', params.id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant details fetched successfully');
    }

    return createSuccessResponse({
      tenant: {
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
        userCount: tenant._count.users,
        users: tenant.users
      }
    }, 'Tenant details fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching tenant:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/tenants/[id] - Update tenant
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Updating tenant:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const updateData = await req.json();

  try {
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found for update:', params.id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Check if slug is being updated and if it already exists
    if (updateData.slug && updateData.slug !== existingTenant.slug) {
      const slugExists = await prisma.tenant.findUnique({
        where: { slug: updateData.slug }
      });

      if (slugExists) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Tenant slug already exists:', updateData.slug);
        }
        return createErrorResponse(
          'Tenant slug already exists',
          409,
          [{ field: 'slug', message: 'Tenant slug already exists' }]
        );
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        name: updateData.name,
        slug: updateData.slug,
        domain: updateData.domain,
        description: updateData.description,
        isActive: updateData.isActive,
        plan: updateData.plan,
        region: updateData.region,
        features: Array.isArray(updateData.features) ? JSON.stringify(updateData.features) : updateData.features
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.update',
      {
        tenantId: params.id,
        tenantName: updatedTenant.name,
        changes: updateData
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant updated successfully');
    }

    return createSuccessResponse({
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        domain: updatedTenant.domain,
        description: updatedTenant.description,
        isActive: updatedTenant.isActive,
        plan: updatedTenant.plan,
        region: updatedTenant.region,
        features: updatedTenant.features ? JSON.parse(updatedTenant.features) : [],
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt,
        userCount: updatedTenant._count.users
      }
    }, 'Tenant updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating tenant:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/tenants/[id] - Soft delete tenant
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Soft deleting tenant:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found for deletion:', params.id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Soft delete tenant (set isActive to false)
    const deletedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.delete',
      {
        tenantId: params.id,
        tenantName: deletedTenant.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant soft deleted successfully');
    }

    return createSuccessResponse({
      tenant: {
        id: deletedTenant.id,
        name: deletedTenant.name,
        slug: deletedTenant.slug,
        isActive: deletedTenant.isActive
      }
    }, 'Tenant deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting tenant:', error);
    }
    throw error;
  }
}); 