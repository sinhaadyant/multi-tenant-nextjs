import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';
import { createAuditLogFromRequest } from '@/lib/audit';
import crypto from 'crypto';

// POST /api/superadmin/superadmins/invite - Create superadmin invite
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Creating superadmin invite');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authentication failed:', authResult.error);
      }
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const body = await req.json();
    const { email, name } = body;

    // Validate required fields
    if (!email || !name) {
      return createErrorResponse('Email and name are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Please enter a valid email address', 400);
    }

    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (existingSuperAdmin) {
      return createErrorResponse('A superadmin with this email already exists', 400);
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create invite token
    const inviteToken = await prisma.inviteToken.create({
      data: {
        token,
        email,
        type: 'superadmin',
        expiresAt,
        superAdminId: authResult.user.id
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult.user,
      'superadmin.invite_created',
      {
        invitedEmail: email,
        invitedName: name,
        inviteTokenId: inviteToken.id
      }
    );

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/superadmin/signup?token=${token}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Superadmin invite created successfully');
      console.log('📧 Invite link:', inviteLink);
    }

    return createSuccessResponse({
      invite: {
        id: inviteToken.id,
        email,
        name,
        token,
        inviteLink,
        expiresAt: inviteToken.expiresAt.toISOString(),
        createdBy: authResult.user.email
      }
    }, 'Superadmin invite created successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating superadmin invite:', error);
    }
    throw error;
  }
});
