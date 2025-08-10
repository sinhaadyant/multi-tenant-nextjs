import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authorization header is required', 401);
    }

    const token = authHeader.substring(7);

    // Verify the token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return createErrorResponse('Invalid or expired token', 401);
    }
    
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid token payload', 401);
    }

    // Check if user exists
    let user;
    if (decoded.role === 'superadmin') {
      user = await prisma.superAdmin.findUnique({
        where: { 
          id: decoded.id,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          isActive: true,
          createdAt: true
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { 
          id: decoded.id,
          isActive: true
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true
            }
          },
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });
    }

    if (!user) {
      return createErrorResponse('User not found or inactive', 404);
    }

    // Format response based on user type
    let userData;
    if (decoded.role === 'superadmin') {
      const superAdminUser = user as any;
      userData = {
        id: superAdminUser.id,
        email: superAdminUser.email,
        name: superAdminUser.name,
        role: 'superadmin',
        avatar: superAdminUser.avatar,
        isActive: superAdminUser.isActive,
        createdAt: superAdminUser.createdAt
      };
    } else {
      const tenantUser = user as any;
      userData = {
        id: tenantUser.id,
        email: tenantUser.email,
        name: tenantUser.name,
        role: 'user',
        tenantId: tenantUser.tenantId,
        tenantSlug: tenantUser.tenant?.slug,
        avatar: tenantUser.avatar,
        isActive: tenantUser.isActive,
        createdAt: tenantUser.createdAt,
        tenant: tenantUser.tenant,
        roles: tenantUser.userRoles.map((ur: any) => ur.role)
      };
    }

    return createSuccessResponse(userData);

  } catch (error: any) {
    console.error('Auth verify error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  // Handle POST requests the same as GET
  return GET(req);
}
