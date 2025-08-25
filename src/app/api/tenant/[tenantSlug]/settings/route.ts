import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get tenant settings
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        timezone: true,
        dateFormat: true,
        language: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        contactNumber: true,
        preferences: true
      }
    });

    const settings = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      description: tenant.description,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor || '#3B82F6',
      secondaryColor: tenant.secondaryColor || '#10B981',
      timezone: tenant.timezone || 'UTC',
      dateFormat: tenant.dateFormat || 'MM/DD/YYYY',
      language: tenant.language || 'en',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        }
      },
      features: {
        auditLogs: true,
        reports: true,
        notifications: true,
        backup: true
      },
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        contactNumber: user.contactNumber,
        preferences: user.preferences || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      } : null
    };

    return createSuccessResponse(settings, 'Tenant settings retrieved successfully');

  } catch (error: any) {
    console.error('Tenant Settings API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});

export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;
    const body = await req.json();

    // Check if user has permission to update tenant settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check if user has admin role or tenant management permission
    const hasPermission = user.userRoles.some(userRole => 
      userRole.role.permissions.some(permission => 
        permission.moduleKey === 'tenant' && permission.canUpdate
      ) || userRole.role.name === 'Admin'
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to update tenant settings', 403);
    }

    // Update tenant settings
    const updatedTenant = await prisma.tenant.update({
      where: { slug: tenantSlug },
      data: {
        name: body.name,
        domain: body.domain,
        description: body.description,
        logo: body.logo,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        timezone: body.timezone,
        dateFormat: body.dateFormat,
        language: body.language
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        timezone: true,
        dateFormat: true,
        language: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedTenant, 'Tenant settings updated successfully');

  } catch (error: any) {
    console.error('Update Tenant Settings API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'Settings POST endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 