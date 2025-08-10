import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/check-email - Check email availability
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Checking email availability');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for email check API');
    }
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const tenantId = searchParams.get('tenantId'); // Optional: for tenant-specific checks

  if (!email) {
    return createErrorResponse(
      'Email parameter is required',
      400
    );
  }

  try {
    // Check if email exists in users table (tenant users)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(tenantId && { tenantId }) // If tenantId provided, check only within that tenant
      },
      select: {
        id: true,
        email: true,
        name: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Check if email exists in superadmin table
    const existingSuperAdmin = await prisma.superAdmin.findFirst({
      where: {
        email: email.toLowerCase()
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email availability check completed');
    }

    if (existingUser) {
      return createSuccessResponse({
        available: false,
        existsIn: 'tenant',
        details: {
          userId: existingUser.id,
          userName: existingUser.name,
          tenantName: existingUser.tenant?.name,
          tenantSlug: existingUser.tenant?.slug
        },
        message: tenantId 
          ? 'Email is already registered in this tenant'
          : 'Email is already registered in a tenant'
      }, 'Email check completed', 200);
    }

    if (existingSuperAdmin) {
      return createSuccessResponse({
        available: false,
        existsIn: 'superadmin',
        details: {
          superAdminId: existingSuperAdmin.id,
          superAdminName: existingSuperAdmin.name
        },
        message: 'Email is already registered as a SuperAdmin'
      }, 'Email check completed', 200);
    }

    return createSuccessResponse({
      available: true,
      existsIn: null,
      details: null,
      message: 'Email is available'
    }, 'Email check completed', 200);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error checking email availability:', error);
    }
    throw error;
  }
}); 