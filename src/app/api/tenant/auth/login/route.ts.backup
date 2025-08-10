import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/jwt';
import { generateTokenPair } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Tenant login attempt');
  }

  const { email, password, tenantSlug } = await req.json();

  // Validate required fields
  if (!email || !password || !tenantSlug) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for tenant login');
    }
    const errors = [];
    if (!email) errors.push({ field: 'email', message: 'Email is required' });
    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    if (!tenantSlug) errors.push({ field: 'tenantSlug', message: 'Tenant slug is required' });
    
    return createErrorResponse(
      'All fields are required',
      400,
      errors
    );
  }

  try {
    // Normalize email and tenant slug
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedTenantSlug = tenantSlug.toLowerCase().trim();

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: normalizedTenantSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true
      }
    });

    if (!tenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found or inactive:', normalizedTenantSlug);
      }
      return createErrorResponse(
        'Invalid tenant or tenant is inactive',
        401,
        [{ field: 'tenantSlug', message: 'Invalid tenant or tenant is inactive' }]
      );
    }

    // Find user within the tenant
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true
          }
        }
      }
    });

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found in tenant:', normalizedEmail, tenant.id);
      }
      return createErrorResponse(
        'Invalid email or password',
        401,
        [{ field: 'email', message: 'Invalid email or password' }]
      );
    }

    // Check if user is active
    if (!user.isActive) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User account is disabled:', normalizedEmail);
      }
      return createErrorResponse(
        'Your account has been disabled. Please contact your administrator.',
        403,
        [{ field: 'email', message: 'Account is disabled' }]
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid password for user:', normalizedEmail);
      }
      return createErrorResponse(
        'Invalid email or password',
        401,
        [{ field: 'password', message: 'Invalid email or password' }]
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: tenant.id,
      tenantSlug: tenant.slug
    };

    const tokenPair = generateTokenPair(tokenPayload);

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'user.login',
      { 
        email: user.email,
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant user login successful:', user.email, 'in tenant:', tenant.slug);
    }

    // Prepare user data for response (exclude sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      tenant: user.tenant,
      roles: user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        permissions: userRole.role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          submodule: rp.permission.submodule,
          action: rp.permission.action
        }))
      }))
    };

    return createSuccessResponse({
      user: userData,
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresAt: tokenPair.expiresAt,
      refreshExpiresAt: tokenPair.refreshExpiresAt
    }, 'Login successful');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error during tenant login:', error);
    }
    throw error;
  }
}); 