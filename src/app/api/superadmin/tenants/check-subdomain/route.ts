import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/tenants/check-subdomain - Check subdomain availability
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Checking subdomain availability');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const subdomain = searchParams.get('subdomain');
  const excludeTenantId = searchParams.get('excludeTenantId'); // New parameter for editing

  if (!subdomain) {
    return createErrorResponse(
      'Subdomain parameter is required',
      400
    );
  }

  // Validate subdomain format
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return createErrorResponse(
      'Invalid subdomain format. Only lowercase letters, numbers, and hyphens are allowed.',
      400
    );
  }

  if (subdomain.length < 3 || subdomain.length > 50) {
    return createErrorResponse(
      'Subdomain must be between 3 and 50 characters long.',
      400
    );
  }

  try {
    // Build the where clause for checking subdomain availability
    let whereClause: any = { slug: subdomain };
    
    // If excludeTenantId is provided, exclude that tenant from the check
    // This allows a tenant to keep its own subdomain when editing
    if (excludeTenantId) {
      whereClause = {
        AND: [
          { slug: subdomain },
          { NOT: { id: excludeTenantId } }
        ]
      };
    }

    // Check if subdomain already exists (excluding the current tenant if editing)
    const existingTenant = await prisma.tenant.findFirst({
      where: whereClause
    });

    const available = !existingTenant;

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Subdomain check completed: ${subdomain} is ${available ? 'available' : 'unavailable'}`);
      if (excludeTenantId) {
        console.log(`🔍 Excluded tenant ID: ${excludeTenantId}`);
      }
    }

    return createSuccessResponse({
      subdomain,
      available,
      message: available ? 'Subdomain is available' : 'Subdomain is already taken'
    }, 'Subdomain availability checked successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error checking subdomain:', error);
    }
    throw error;
  }
}); 