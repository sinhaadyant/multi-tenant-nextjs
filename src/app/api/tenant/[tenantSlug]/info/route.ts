import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Fetching tenant info:', tenantSlug);
  }

  try {
    // Normalize tenant slug
    const normalizedTenantSlug = tenantSlug.toLowerCase().trim();

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: normalizedTenantSlug
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        isActive: true,
        plan: true,
        region: true,
        features: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!tenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', normalizedTenantSlug);
      }
      return createErrorResponse(
        'Tenant not found. Please check the URL and try again.',
        404
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant info fetched successfully:', tenant.name);
    }

    // Return tenant information (excluding sensitive data)
    const tenantInfo = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      description: tenant.description,
      plan: tenant.plan,
      region: tenant.region,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString()
    };

    return createSuccessResponse(tenantInfo, 'Tenant information retrieved successfully');

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching tenant info:', error);
    }
    throw error;
  }
});
