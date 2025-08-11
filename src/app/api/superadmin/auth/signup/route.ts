import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { generateToken } from '@/lib/jwt';

export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 SuperAdmin signup attempt');
  }

  const { name, email, password, contactNumber, token } = await req.json();

  // Validate required fields
  if (!name || !email || !password || !contactNumber || !token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing required fields for signup');
    }
    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Full name is required' });
    if (!email) errors.push({ field: 'email', message: 'Email is required' });
    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    if (!contactNumber) errors.push({ field: 'contactNumber', message: 'Contact number is required' });
    if (!token) errors.push({ field: 'token', message: 'Invite token is required' });
    
    return createErrorResponse(
      'All fields are required',
      400,
      errors
    );
  }

  try {
    // Verify invite token
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token, isUsed: false },
      include: { superAdmin: true }
    });

    if (!inviteToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid or expired invite token');
      }
      return createErrorResponse(
        'Invalid or expired invite token',
        400,
        [{ field: 'token', message: 'Invalid or expired invite token' }]
      );
    }

    // Check if token is expired
    if (inviteToken.expiresAt < new Date()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invite token has expired');
      }
      return createErrorResponse(
        'Invite token has expired',
        400,
        [{ field: 'token', message: 'Invite token has expired' }]
      );
    }

    // Check if email matches the invite
    if (inviteToken.email.toLowerCase() !== email.toLowerCase()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Email does not match invite token');
      }
      return createErrorResponse(
        'Email does not match the invite',
        400,
        [{ field: 'email', message: 'Email does not match the invite' }]
      );
    }

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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create SuperAdmin and mark token as used in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create SuperAdmin
      const superAdmin = await tx.superAdmin.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          contactNumber: contactNumber.trim(),
          isActive: true
        }
      });

      // Mark invite token as used
      await tx.inviteToken.update({
        where: { id: inviteToken.id },
        data: { isUsed: true }
      });

      return superAdmin;
    });

    // Generate JWT token
    const jwtToken = generateToken({
      id: result.id,
      email: result.email,
      role: 'superadmin'
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: result.id, email: result.email, role: 'superadmin' },
      'superadmin.signup',
      { email: result.email, invitedBy: inviteToken.createdBy }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin signup successful:', email);
    }

    return createSuccessResponse({
      token: jwtToken,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: 'superadmin'
      }
    }, 'SuperAdmin account created successfully', 201);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error during SuperAdmin signup:', error);
    }
    throw error;
  }
}); 