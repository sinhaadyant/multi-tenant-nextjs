import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) {
  try {
    const { tenantSlug } = await params;
    
    console.log('🔍 Tenant logout endpoint called for tenant:', tenantSlug);

    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authorization header is required', 401);
    }

    const token = authHeader.substring(7);

    // Verify the token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return createErrorResponse('Invalid or expired token', 401);
    }
    
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid token payload', 401);
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
        isActive: true,
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found or inactive', 404);
    }

    // Find the user in this tenant
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found in this tenant', 404);
    }

    // Create audit log
    await createAuditLog({
      action: 'tenant.user_logout',
      details: { 
        userId: user.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      tenantId: tenant.id,
      userId: user.id,
    });

    return createSuccessResponse({}, 'Logout successful');

  } catch (error) {
    console.error('Tenant logout endpoint error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  return POST(request, { params });
} 