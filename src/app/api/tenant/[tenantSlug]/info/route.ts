import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) {
  try {
    const { tenantSlug } = await params;
    
    console.log('🔍 Tenant info endpoint called for tenant:', tenantSlug);

    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: tenantSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        plan: true,
        region: true,
        isActive: true,
        features: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found or inactive', 404);
    }

    // Format the response
    const tenantInfo = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      description: tenant.description,
      plan: tenant.plan,
      region: tenant.region,
      status: tenant.isActive ? 'active' : 'inactive',
      userCount: tenant._count.users,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString()
    };

    return createSuccessResponse({ tenant: tenantInfo }, 'Tenant information retrieved successfully');

  } catch (error) {
    console.error('Tenant info endpoint error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
