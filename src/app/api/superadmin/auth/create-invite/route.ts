import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { randomBytes } from 'crypto';

export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Creating SuperAdmin invite token');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextRequest) {
    return authResult;
  }

  const { email, expiresInDays = 1 } = await req.json();

  // Validate required fields
  if (!email) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing email for invite token creation');
    }
    return createErrorResponse(
      'Email is required',
      400,
      [{ field: 'email', message: 'Email is required' }]
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createErrorResponse(
      'Invalid email format',
      400,
      [{ field: 'email', message: 'Invalid email format' }]
    );
  }

  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingSuperAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ SuperAdmin already exists:', normalizedEmail);
      }
      return createErrorResponse(
        'SuperAdmin account already exists',
        409,
        [{ field: 'email', message: 'SuperAdmin account already exists' }]
      );
    }

    // Check if there's already an unused invite token for this email
    const existingToken = await prisma.inviteToken.findFirst({
      where: {
        email: normalizedEmail,
        type: 'superadmin',
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Active invite token already exists for:', normalizedEmail);
      }
      return createErrorResponse(
        'An active invite token already exists for this email',
        409,
        [{ field: 'email', message: 'An active invite token already exists for this email' }]
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite token
    const inviteToken = await prisma.inviteToken.create({
      data: {
        email: normalizedEmail,
        token,
        type: 'superadmin',
        expiresAt,
        superAdminId: authResult.id
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'superadmin.invite_created',
      {
        invitedEmail: normalizedEmail,
        tokenId: inviteToken.id,
        expiresAt: inviteToken.expiresAt
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin invite token created:', normalizedEmail);
    }

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/superadmin/signup?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    return createSuccessResponse({
      inviteToken: {
        id: inviteToken.id,
        email: inviteToken.email,
        token: inviteToken.token,
        expiresAt: inviteToken.expiresAt,
        inviteLink
      }
    }, 'SuperAdmin invite token created successfully', 201);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating SuperAdmin invite token:', error);
    }
    throw error;
  }
}); 