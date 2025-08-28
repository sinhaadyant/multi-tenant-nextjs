import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import crypto from 'crypto';
// import { sendEmail } from '@/lib/email'; // Commented out as email service might not be configured

// Validation schema for user invitation
const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  roleId: z.string().min(1, 'Role is required'),
  message: z.string().optional(),
});

export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 User invitation request for tenant:', tenantSlug);
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
    return createErrorResponse('Invalid or expired token', 401);
  }

  if (!decoded || !decoded.id) {
    return createErrorResponse('Invalid token payload', 401);
  }

  // Parse request body
  const body = await req.json();
  const validationResult = inviteUserSchema.safeParse(body);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return createErrorResponse('Validation failed', 400, errors);
  }

  const { email, name, roleId, message } = validationResult.data;

  try {
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

    // Verify the requesting user has permission to invite users
    const requestingUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
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

    if (!requestingUser) {
      return createErrorResponse('User not found in this tenant', 404);
    }

    // Check if user has permission to invite users
    // Allow if user has any role with user creation permissions
    const hasInvitePermission = requestingUser.userRoles.some(userRole => 
      userRole.role.permissions.some(permission => 
        (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
        permission.canCreate
      )
    );

    // If no specific permission found, check if user is an admin or has any management role
    const hasAdminRole = requestingUser.userRoles.some(userRole => 
      userRole.role.name.toLowerCase().includes('admin') || 
      userRole.role.name.toLowerCase().includes('manager') ||
      userRole.role.name.toLowerCase().includes('administrator')
    );

    // Allow invitation if user has create permission OR is an admin/manager
    if (!hasInvitePermission && !hasAdminRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Permission check failed for user:', requestingUser.email);
        console.log('User roles:', requestingUser.userRoles.map(ur => ur.role.name));
        console.log('User permissions:', requestingUser.userRoles.flatMap(ur => 
          ur.role.permissions.map(p => `${p.moduleKey}:${p.canCreate}`)
        ));
      }
      return createErrorResponse('You do not have permission to invite users. Please contact your administrator.', 403);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      return createErrorResponse('A user with this email already exists in this tenant', 409);
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return createErrorResponse('A pending invitation already exists for this email', 409);
    }

    // Verify the role exists and belongs to this tenant
    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
        tenantId: tenant.id
      }
    });

    if (!role) {
      return createErrorResponse('Role not found in this tenant', 404);
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create the invitation
    const invitation = await prisma.userInvitation.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        tenantId: tenant.id,
        roleId: roleId,
        invitedById: requestingUser.id,
        token: invitationToken,
        expiresAt: expiresAt,
        message: message?.trim(),
        status: 'pending'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Generate invitation URL for development (skip email sending for now)
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${tenantSlug}/signup?token=${invitationToken}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Invitation created for:', normalizedEmail);
      console.log('🔗 Invitation URL:', invitationUrl);
    }

    // TODO: Send invitation email when email service is configured
    // try {
    //   await sendEmail({
    //     to: normalizedEmail,
    //     subject: `You've been invited to join ${tenant.name}`,
    //     template: 'user-invitation',
    //     data: {
    //       inviteeName: name,
    //       tenantName: tenant.name,
    //       roleName: role.name,
    //       inviterName: requestingUser.name,
    //       invitationUrl: invitationUrl,
    //       message: message || '',
    //       expiryDays: 7
    //     }
    //   });
    // } catch (emailError) {
    //   console.error('❌ Failed to send invitation email:', emailError);
    // }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: requestingUser.id, email: requestingUser.email, role: 'user' },
      'tenant.user_invited',
      {
        invitedEmail: normalizedEmail,
        invitedName: name,
        roleId: roleId,
        roleName: role.name,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        invitationId: invitation.id
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User invitation created successfully:', invitation.id);
    }

    return createSuccessResponse({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        tenant: invitation.tenant,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        createdAt: invitation.createdAt,
        invitationUrl: invitationUrl
      }
    }, 'User invitation created successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error during user invitation:', error);
    }
    throw error;
  }
});