import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/tenants/[id] - Get specific tenant
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Fetching tenant details:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
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
        console.log('❌ Tenant not found:', id);
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
        status: tenant.isActive ? 'active' : 'suspended', // Transform isActive to status
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
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Updating tenant:', id);
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
      where: { id }
    });

    if (!existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Prepare update data
    const dataToUpdate: any = {};
    
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.domain !== undefined) dataToUpdate.domain = updateData.domain;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.plan !== undefined) dataToUpdate.plan = updateData.plan;
    if (updateData.region !== undefined) dataToUpdate.region = updateData.region;
    if (updateData.features !== undefined) dataToUpdate.features = JSON.stringify(updateData.features);

    // Handle slug update with validation
    if (updateData.slug !== undefined && updateData.slug !== existingTenant.slug) {
      // Check if the new slug is already taken by another tenant
      const existingTenantWithSlug = await prisma.tenant.findFirst({
        where: {
          slug: updateData.slug,
          NOT: { id: id } // Exclude current tenant
        }
      });

      if (existingTenantWithSlug) {
        return createErrorResponse(
          'This subdomain is already taken by another tenant',
          409
        );
      }

      dataToUpdate.slug = updateData.slug;
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: dataToUpdate
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.updated',
      {
        tenantId: id,
        tenantName: existingTenant.name,
        changes: dataToUpdate
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant updated successfully:', updatedTenant.name);
    }

    return createSuccessResponse({
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        domain: updatedTenant.domain,
        description: updatedTenant.description,
        isActive: updatedTenant.isActive,
        status: updatedTenant.isActive ? 'active' : 'suspended', // Transform isActive to status
        plan: updatedTenant.plan,
        region: updatedTenant.region,
        features: updatedTenant.features ? JSON.parse(updatedTenant.features) : [],
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt
      }
    }, 'Tenant updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating tenant:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/tenants/[id] - Delete tenant
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Deleting tenant:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Delete tenant and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all users in the tenant
      await tx.user.deleteMany({
        where: { tenantId: id }
      });

      // Delete the tenant
      await tx.tenant.delete({
        where: { id }
      });
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'tenant.deleted',
      {
        tenantId: id,
        tenantName: existingTenant.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant deleted successfully:', existingTenant.name);
    }

    return createSuccessResponse({}, 'Tenant deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting tenant:', error);
    }
    throw error;
  }
});
